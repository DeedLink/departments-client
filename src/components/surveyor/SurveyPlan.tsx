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
      map.fitBounds(bounds, { padding: [20, 20] });
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
          className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm sm:max-w-md text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-2">Survey Plan</h2>
          <p className="text-gray-600 text-sm">No survey data available.</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4 lg:ml-64"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg sm:rounded-2xl overflow-hidden w-full h-full sm:h-[600px] max-w-5xl relative shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-10 p-3 sm:p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-sm sm:text-base">Survey Plan</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>
        
        {/* Map Container */}
        <div className="w-full h-full pt-12 sm:pt-16">
          <MapContainer
            center={center}
            zoom={16}
            scrollWheelZoom={true}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
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
              <Polygon 
                positions={coords} 
                pathOptions={{ 
                  color: "green", 
                  fillOpacity: 0.3,
                  weight: 2 
                }} 
              />
            )}
          </MapContainer>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t block sm:hidden">
          <p className="text-xs text-gray-600 text-center">
            {coords.length} survey point{coords.length !== 1 ? 's' : ''} • Pinch to zoom • Tap markers for details
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyPlan;
