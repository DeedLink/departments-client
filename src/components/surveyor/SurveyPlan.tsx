import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SurveyPlanProps {
  points: { latitude: number; longitude: number }[];
}

const FitBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

const SurveyPlan: React.FC<SurveyPlanProps> = ({ points }) => {
  if (!points || points.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Survey Plan</h2>
        <p>No survey data available.</p>
      </div>
    );
  }

  const coords = points.map((p) => [p.latitude, p.longitude] as [number, number]);
  const center = coords[0];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Survey Plan</h2>
      <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitBounds coords={coords} />
          {coords.map((c, i) => (
            <Marker key={i} position={c}>
              <Popup>
                Point {i + 1}: {c[0].toFixed(6)}, {c[1].toFixed(6)}
              </Popup>
            </Marker>
          ))}
          {coords.length > 1 && (
            <Polygon positions={coords} pathOptions={{ color: "green", fillOpacity: 0.3 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default SurveyPlan;
