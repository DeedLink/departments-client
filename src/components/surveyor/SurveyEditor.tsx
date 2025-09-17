import { useState } from "react";
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Sides } from "../../types/deed";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SurveyEditorProps {
  onSave: (points: { latitude: number; longitude: number }[], sides: Sides) => void;
  isOpen: boolean;
  onClose: () => void;
}

function ClickHandler({ setPoints }: { setPoints: React.Dispatch<React.SetStateAction<[number, number][]>> }) {
  useMapEvents({
    click(e) {
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });
  return null;
}

const SurveyEditor: React.FC<SurveyEditorProps> = ({ onSave, isOpen, onClose }) => {
  if (!isOpen) return null;

  const [points, setPoints] = useState<[number, number][]>([]);
  const [sides, setSides] = useState<Sides>({ North: "", South: "", East: "", West: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSides({ ...sides, [e.target.name]: e.target.value });
  };

  const handleCoordChange = (index: number, field: "lat" | "lng", value: string) => {
    setPoints((prev) =>
      prev.map((p, i) =>
        i === index
          ? [field === "lat" ? parseFloat(value) || 0 : p[0], field === "lng" ? parseFloat(value) || 0 : p[1]]
          : p
      )
    );
  };

  const addPointManually = () => setPoints((prev) => [...prev, [0, 0]]);

  const handleSave = () => {
    const formattedPoints = points.map(([latitude, longitude]) => ({ latitude, longitude }));
    onSave(formattedPoints, sides);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg sm:rounded-2xl overflow-hidden w-full h-full sm:h-[600px] max-w-5xl relative shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-10 p-3 sm:p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-sm sm:text-base">Set Boundaries</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 pt-12 sm:pt-16">
          <div className="p-4 md:w-1/3 overflow-y-auto border-r">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["North", "South", "East", "West"] as (keyof Sides)[]).map((dir) => (
                <input
                  key={dir}
                  type="text"
                  name={dir}
                  placeholder={dir}
                  value={sides[dir]}
                  onChange={handleChange}
                  className="border p-2 rounded text-sm w-full"
                />
              ))}
            </div>

            <h2 className="text-sm sm:text-base font-semibold mb-2">Polygon Points</h2>
            <button
              onClick={addPointManually}
              className="mb-2 px-3 py-1 bg-gray-700 text-white text-xs sm:text-sm rounded hover:bg-gray-800"
            >
              Add Point
            </button>

            <div className="space-y-2">
              {points.map(([lat, lng], i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => handleCoordChange(i, "lat", e.target.value)}
                    placeholder="Latitude"
                    className="border p-2 rounded text-xs sm:text-sm"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => handleCoordChange(i, "lng", e.target.value)}
                    placeholder="Longitude"
                    className="border p-2 rounded text-xs sm:text-sm"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Save Survey
            </button>
          </div>

          <div className="flex-1">
            <MapContainer center={[6.9271, 79.8612]} zoom={13} className="w-full h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickHandler setPoints={setPoints} />
              {points.map((p, i) => (
                <Marker key={i} position={p} />
              ))}
              {points.length >= 3 && (
                <Polygon positions={points} pathOptions={{ color: "green", fillOpacity: 0.4 }} />
              )}
            </MapContainer>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t block sm:hidden">
          <p className="text-xs text-gray-600 text-center">
            Tap map to add points • Pinch to zoom • Drag to pan
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyEditor;
