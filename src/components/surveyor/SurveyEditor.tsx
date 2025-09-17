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
  const [sides, setSides] = useState<Sides>({
    North: "",
    South: "",
    East: "",
    West: "",
  });

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

  const addPointManually = () => {
    setPoints((prev) => [...prev, [0, 0]]);
  };

  const handleSave = () => {
    const formattedPoints = points.map(([latitude, longitude]) => ({ latitude, longitude }));
    onSave(formattedPoints, sides);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 h-5/6 rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Set Boundaries</h2>
          <button onClick={onClose} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
            Close
          </button>
        </div>
        <div className="flex flex-col md:flex-row flex-1">
          <div className="p-4 md:w-1/3 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <input
                type="text"
                name="North"
                placeholder="North"
                value={sides.North}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="South"
                placeholder="South"
                value={sides.South}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="East"
                placeholder="East"
                value={sides.East}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="West"
                placeholder="West"
                value={sides.West}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
            <h2 className="text-lg font-semibold mb-2">Polygon Points</h2>
            <button
              onClick={addPointManually}
              className="mb-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-800"
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
                    className="border p-2 rounded"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => handleCoordChange(i, "lng", e.target.value)}
                    placeholder="Longitude"
                    className="border p-2 rounded"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
      </div>
    </div>
  );
};

export default SurveyEditor;
