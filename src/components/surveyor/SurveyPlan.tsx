import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import type { Sides } from "../../types/deed";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SurveyPlanProps {
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
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

function findSideIndex(coords: [number, number][], targetSide: "N"|"S"|"E"|"W"): number {
  let bestIndex = 0;
  let bestScore = -Infinity;
  
  for (let i = 0; i < coords.length; i++) {
    const start = coords[i];
    const end = coords[(i + 1) % coords.length];
    const avgLat = (start[0] + end[0]) / 2;
    const avgLng = (start[1] + end[1]) / 2;
    
    let score = 0;
    
    if (targetSide === "N") {
      score = avgLat;
    } else if (targetSide === "S") {
      score = -avgLat;
    } else if (targetSide === "E") {
      score = avgLng;
    } else if (targetSide === "W") {
      score = -avgLng;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  
  return bestIndex;
}

const SurveyPlan: React.FC<SurveyPlanProps> = ({ points, sides, isOpen, onClose }) => {
  if (!isOpen) return null;
  if (!points || points.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm sm:max-w-md text-center" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg sm:text-xl font-bold mb-2">Survey Plan</h2>
          <p className="text-gray-600 text-sm">No survey data available.</p>
          <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Close</button>
        </div>
      </div>
    );
  }

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

    return <Marker position={midpoint} icon={divIcon} />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4 lg:ml-64" onClick={onClose}>
      <div className="bg-white rounded-lg sm:rounded-2xl overflow-hidden w-full h-full sm:h-[600px] max-w-5xl relative shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-10 p-3 sm:p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-sm sm:text-base">Survey Plan</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">✕</button>
        </div>
        <div className="w-full h-full pt-12 sm:pt-16">
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
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t block sm:hidden">
          <p className="text-xs text-gray-600 text-center">{coords.length} survey point{coords.length !== 1 ? "s" : ""} • Pinch to zoom • Tap markers for details</p>
        </div>
      </div>
    </div>
  );
};

export default SurveyPlan;
