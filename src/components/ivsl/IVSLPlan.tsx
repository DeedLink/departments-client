import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import type { Sides } from "../../types/deed";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface IVSLPlanProps {
  points: { latitude: number; longitude: number }[];
  sides?: Sides;
  isOpen: boolean;
  onClose: () => void;
}

const FitBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat - sw.lat;
      const lngDiff = ne.lng - sw.lng;
      const avgLat = (ne.lat + sw.lat) / 2;
      const latMeters = latDiff * 111320;
      const lngMeters = lngDiff * 111320 * Math.cos(avgLat * Math.PI / 180);
      const diagonalMeters = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
      
      let padding: [number, number];
      let maxZoom: number;
      
      if (diagonalMeters < 10) {
        padding = [120, 120];
        maxZoom = 24;
      } else if (diagonalMeters < 50) {
        padding = [100, 100];
        maxZoom = 23;
      } else if (diagonalMeters < 200) {
        padding = [80, 80];
        maxZoom = 22;
      } else {
        padding = [60, 60];
        maxZoom = 21;
      }
      
      map.fitBounds(bounds, { padding, maxZoom });
    }
  }, [coords, map]);
  return null;
};

function getMidpoint(start: [number, number], end: [number, number]): [number, number] {
  return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
}

function getBearing(start: [number, number], end: [number, number]): number {
  const lat1 = start[0] * Math.PI / 180;
  const lat2 = end[0] * Math.PI / 180;
  const dLng = (end[1] - start[1]) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x) * 180 / Math.PI;
}

function identifySide(coords: [number, number][], sideIndex: number): "N"|"S"|"E"|"W" | null {
  if (coords.length < 4 || sideIndex >= coords.length) return null;
  
  const start = coords[sideIndex];
  const end = coords[(sideIndex + 1) % coords.length];
  const bearing = getBearing(start, end);
  
  const absBearing = Math.abs(bearing);
  if (absBearing < 45 || absBearing > 135) {
    return bearing > 0 ? "N" : "S";
  } else {
    return bearing > 0 ? "E" : "W";
  }
}

function findSideIndex(coords: [number, number][], targetSide: "N"|"S"|"E"|"W"): number {
  let bestIndex = 0;
  let bestScore = -Infinity;
  
  for (let i = 0; i < coords.length; i++) {
    const start = coords[i];
    const end = coords[(i + 1) % coords.length];
    const midpoint = getMidpoint(start, end);
    
    let score = 0;
    if (targetSide === "N") score = midpoint[0];
    else if (targetSide === "S") score = -midpoint[0];
    else if (targetSide === "E") score = midpoint[1];
    else if (targetSide === "W") score = -midpoint[1];
    
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  
  return bestIndex;
}

function polygonArea(coords: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % coords.length];
    area += (y1 * x2 - y2 * x1);
  }
  return Math.abs(area / 2) * 111320 * 111320 * Math.cos((coords[0][0] * Math.PI) / 180);
}

const IVSLPlan: React.FC<IVSLPlanProps> = ({ points, sides, isOpen, onClose }) => {
  const [area, setArea] = useState<number | null>(null);
  const [perches, setPerches] = useState<number | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const [nearestRoad, setNearestRoad] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !points || points.length === 0) return;

    const coords = points.map((p) => [p.latitude, p.longitude] as [number, number]);
    if (coords.length > 2) {
      const a = polygonArea(coords);
      setArea(a);
      setPerches(a / 25.2929);
      setValue((a / 25.2929) * 500000);
    }

    const [lat, lng] = coords[0];
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => setNearestRoad(data?.address?.road || "Unknown road"));
  }, [isOpen, points]);

  if (!isOpen) return null;

  const coords = points.map((p) => [p.latitude, p.longitude] as [number, number]);
  const center = coords[0];

  const renderSide = (label: string, targetSide: "N"|"S"|"E"|"W", color: string) => {
    if (coords.length < 4) return null;
    
    const sideIndex = findSideIndex(coords, targetSide);
    const start = coords[sideIndex];
    const end = coords[(sideIndex + 1) % coords.length];
    const midpoint = getMidpoint(start, end);
    
    const divIcon = L.divIcon({
      className: "custom-boundary-label",
      html: `<div style="background:${color};color:white;padding:4px 10px;border-radius:5px;font-size:11px;font-weight:600;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);text-align:center;display:inline-block;">${targetSide}: ${label}</div>`,
      iconSize: [200, 35],
      iconAnchor: [100, 17],
    });

    return (
      <Marker position={midpoint} icon={divIcon} />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4 lg:ml-64" onClick={onClose}>
      <div className="bg-white rounded-lg sm:rounded-2xl overflow-hidden w-full h-full sm:h-[600px] max-w-5xl flex flex-col shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className=" bg-white/90 backdrop-blur-sm z-10 p-3 sm:p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-sm sm:text-base">Survey Plan & Valuation</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">✕</button>
        </div>

        <div className="flex-1 w-full h-full">
          <MapContainer center={center} zoom={16} minZoom={3} maxZoom={24} scrollWheelZoom={true} className="w-full h-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={24} maxNativeZoom={19} />
            <FitBounds coords={coords} />
            {coords.map((c, i) => (
              <Marker key={i} position={c}>
                <Popup>
                  <div className="text-xs">
                    <strong>Point {i + 1}</strong><br/>
                    Lat: {c[0].toFixed(6)}<br/>
                    Lng: {c[1].toFixed(6)}
                  </div>
                </Popup>
              </Marker>
            ))}
            {coords.length > 1 && (
              <Polygon positions={coords} pathOptions={{ color: "green", fillOpacity: 0.3, weight: 2 }} />
            )}
            {sides && coords.length >= 4 && (
              <>
                {sides.North && renderSide(sides.North, "N", "#ef4444")}
                {sides.East && renderSide(sides.East, "E", "#3b82f6")}
                {sides.South && renderSide(sides.South, "S", "#f97316")}
                {sides.West && renderSide(sides.West, "W", "#8b5cf6")}
              </>
            )}
          </MapContainer>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-4 border-t">
          <h4 className="font-semibold text-sm sm:text-base mb-2">Valuation Summary</h4>
          <p className="text-xs sm:text-sm text-gray-700">
            Area: {area ? `${area.toFixed(2)} m²` : "Calculating..."}<br/>
            Area in perches: {perches ? perches.toFixed(2) : "..."}<br/>
            Estimated Value: {value ? `ETH ${value.toLocaleString()}` : "..."}<br/>
            Nearest Road: {nearestRoad || "Fetching..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IVSLPlan;
