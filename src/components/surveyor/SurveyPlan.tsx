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
  isOpen: boolean;
  onClose: () => void;
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

const SurveyPlan: React.FC<SurveyPlanProps> = ({ points, isOpen, onClose }) => {
  if (!isOpen) return null;

  if (!points || points.length === 0) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-lg text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-2">Survey Plan</h2>
          <p className="text-gray-600">No survey data available.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const coords = points.map((p) => [p.latitude, p.longitude] as [number, number]);
  const center = coords[0];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl h-[600px] relative shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 z-10"
        >
          ✕
        </button>
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
