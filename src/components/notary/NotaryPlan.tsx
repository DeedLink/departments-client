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

interface NotaryPlanProps {
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
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [coords, map]);
  return null;
};

function offsetPoint([lat, lng]: [number, number], dx: number, dy: number): [number, number] {
  const latOffset = dy / 111320;
  const lngOffset = dx / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + latOffset, lng + lngOffset];
}

function createAngledPolygon(start: [number, number], end: [number, number], direction: "N"|"S"|"E"|"W") {
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  const length = Math.sqrt(dx * dx + dy * dy) * 111320;
  const offset = length * 0.3;

  if (direction === "N") {
    const p1 = offsetPoint(start, -offset, offset);
    const p2 = offsetPoint(end, offset, offset);
    return [start, end, p2, p1];
  }
  if (direction === "S") {
    const p1 = offsetPoint(start, offset, -offset);
    const p2 = offsetPoint(end, -offset, -offset);
    return [start, end, p2, p1];
  }
  if (direction === "E") {
    const p1 = offsetPoint(start, offset, offset);
    const p2 = offsetPoint(end, offset, -offset);
    return [start, end, p2, p1];
  }
  if (direction === "W") {
    const p1 = offsetPoint(start, -offset, -offset);
    const p2 = offsetPoint(end, -offset, offset);
    return [start, end, p2, p1];
  }
  return [];
}

function getCentroid(coords: [number, number][]): [number, number] {
  let lat = 0, lng = 0;
  coords.forEach(([la, lo]) => { lat += la; lng += lo; });
  return [lat / coords.length, lng / coords.length];
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

const NotaryPlan: React.FC<NotaryPlanProps> = ({ points, sides, isOpen, onClose }) => {
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

  const renderSide = (label: string, start: [number, number], end: [number, number], direction: "N"|"S"|"E"|"W", color: string) => {
    const poly = createAngledPolygon(start, end, direction);
    if (poly.length === 0) return null;
    const centroid = getCentroid(poly);

    const divIcon = L.divIcon({
      className: "custom-label",
      html: `<div style="background:${color};color:white;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap;">${label}</div>`,
    });

    return (
      <>
        <Polygon positions={poly} pathOptions={{ color, fillOpacity: 0.4 }} />
        <Marker position={centroid} icon={divIcon} />
      </>
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
          <MapContainer center={center} zoom={16} scrollWheelZoom={true} className="w-full h-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                {sides.North && renderSide(sides.North, coords[0], coords[1], "N", "red")}
                {sides.East && renderSide(sides.East, coords[1], coords[2], "E", "blue")}
                {sides.South && renderSide(sides.South, coords[2], coords[3], "S", "orange")}
                {sides.West && renderSide(sides.West, coords[3], coords[0], "W", "purple")}
              </>
            )}
          </MapContainer>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-4 border-t">
          <h4 className="font-semibold text-sm sm:text-base mb-2">Valuation Summary</h4>
          <p className="text-xs sm:text-sm text-gray-700">
            Area: {area ? `${area.toFixed(2)} m²` : "Calculating..."}<br/>
            Area in perches: {perches ? perches.toFixed(2) : "..."}<br/>
            Estimated Value: {value ? `Rs. ${value.toLocaleString()}` : "..."}<br/>
            Nearest Road: {nearestRoad || "Fetching..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotaryPlan;
