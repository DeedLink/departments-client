import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import { getPlanByDeedNumber } from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import type { Plan } from "../../types/plan";
import L from "leaflet";

const defaultPlan: Plan = {
  planId: "",
  deedNumber: "",
  createdBy: "",
  documentURI: "",
  coordinates: [],
  areaSize: 0,
  areaType: "Square Meter",
  status: "active",
  details: "",
  signedBy: "",
  createdAt: new Date(),
};

// Component to handle clicks on map and add coordinates
const MapClickHandler = ({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const SurveyPlanPage = () => {
  const { deedNumber } = useParams<{ deedNumber: string }>();
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [isNew, setIsNew] = useState(true);
  const { showToast } = useToast();

  const fetchPlan = async () => {
    try {
      if (deedNumber) {
        const res = await getPlanByDeedNumber(deedNumber);
        if (res.success) {
          setPlan(res.data);
          setIsNew(false);
        }
      } else {
        showToast("Deed number missing", "error");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast("No existing plan. Creating new one.", "info");
        setPlan({ ...defaultPlan, deedNumber });
        setIsNew(true);
      } else {
        showToast("Error fetching plan", "error");
      }
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [deedNumber]);

  const addPoint = (point: [number, number]) => {
    setPlan((prev) => ({
      ...prev,
      coordinates: [...(prev.coordinates || []), point],
    }));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        {isNew ? "Create New Survey Plan" : "Edit Survey Plan"}
      </h1>

      {/* Map for selecting coordinates */}
      <div className="h-96 w-full border rounded overflow-hidden mb-6">
        <MapContainer
          center={[7.8731, 80.7718]} // Default center (Sri Lanka)
          zoom={8}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <MapClickHandler onAddPoint={addPoint} />

          {/* Show clicked points */}
          {plan.coordinates.map((point, idx) => (
            <Marker
              key={idx}
              position={point as [number, number]}
              icon={L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
                iconSize: [25, 25],
              })}
            />
          ))}

          {/* Connect points with a polygon-like line */}
          {plan.coordinates.length > 1 && (
            <Polyline positions={plan.coordinates as [number, number][]} color="blue" />
          )}
        </MapContainer>
      </div>

      {/* Form for editing/creating */}
      <form className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Plan ID</label>
          <input
            type="text"
            value={plan.planId}
            onChange={(e) => setPlan({ ...plan, planId: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Created By</label>
          <input
            type="text"
            value={plan.createdBy}
            onChange={(e) => setPlan({ ...plan, createdBy: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Area Size</label>
          <input
            type="number"
            value={plan.areaSize}
            onChange={(e) =>
              setPlan({ ...plan, areaSize: Number(e.target.value) })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Area Type</label>
          <select
            value={plan.areaType}
            onChange={(e) =>
              setPlan({ ...plan, areaType: e.target.value as Plan["areaType"] })
            }
            className="border rounded px-3 py-2 w-full"
          >
            <option>Hectare</option>
            <option>Acre</option>
            <option>Square Meter</option>
            <option>Square Kilometer</option>
            <option>Square Mile</option>
            <option>Square Foot</option>
            <option>Square Yard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Details</label>
          <textarea
            value={plan.details || ""}
            onChange={(e) => setPlan({ ...plan, details: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => {
            if (isNew) {
              console.log("Creating new plan", plan);
            } else {
              console.log("Updating plan", plan);
            }
          }}
        >
          {isNew ? "Create Plan" : "Update Plan"}
        </button>
      </form>
    </div>
  );
};

export default SurveyPlanPage;
