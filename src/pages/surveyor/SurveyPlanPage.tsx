import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, useMapEvents, useMap } from "react-leaflet";
import { createPlan, getPlanByDeedNumber, updateSurveyPlanNumber, updatePlan, getAllPlans, getPlanBySeurveyorWalletAddress } from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import type { Coordinate, Plan } from "../../types/plan";
import L from "leaflet";
import { Trash2, AlertTriangle } from "lucide-react";
import { calculatePolygonArea, doPolygonsOverlap, doBoundariesOverlap, type LocationPoint, calculateOverlapPercentage } from "../../utils/functions";
import { useLoader } from "../../contexts/LoaderContext";
import { useWallet } from "../../contexts/WalletContext";
import SurveyPlanPageHeader from "../../components/surveyPlanPage/surveyplanpageheader";
import SurveyPlanPageTabSelector from "../../components/surveyPlanPage/surveyplanpagetabselector";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const defaultPlan: Plan = {
  planId: "",
  deedNumber: "",
  createdBy: "",
  documentURI: "",
  coordinates: [],
    sides: { 
    North: "",
    South: "",
    East: "",
    West: ""
  },
  areaSize: 0,
  areaType: "Square Meter",
  status: "active",
  details: "",
  signedBy: "",
  createdAt: new Date(),
};

const MapClickHandler = ({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// FitBounds component for map
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

const SurveyPlanPage = () => {
  const { deedNumber } = useParams<{ deedNumber: string }>();
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [isNew, setIsNew] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'map' | 'details' | 'summary'>('map');
  const [overlappingPlans, setOverlappingPlans] = useState<Array<{ plan: Plan; overlapType: 'polygon' | 'boundary' | 'both'; overlapPercentage?: number }>>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loadingOverlaps, setLoadingOverlaps] = useState(false);
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();
  const { account } = useWallet();

  const fetchPlan = async () => {
    setIsLoading(true);
    console.log("0");
    try {
      if (deedNumber) {
        const res = await getPlanByDeedNumber(deedNumber);
        if (res.success) {
          // Convert coordinates from {longitude, latitude} to {latitude, longitude} if needed
          const planData = res.data;
          if (planData.coordinates && Array.isArray(planData.coordinates)) {
            planData.coordinates = planData.coordinates.map((coord: any) => {
              // Handle both formats
              if (coord.latitude !== undefined && coord.longitude !== undefined) {
                return { latitude: coord.latitude, longitude: coord.longitude };
              }
              // If stored as {longitude, latitude}, swap them
              return { latitude: coord.longitude || coord.latitude, longitude: coord.latitude || coord.longitude };
            });
          }
          setPlan(planData);
          setIsNew(false);
        }
        else if(!res.success) {
          showToast("No existing plan. Creating new one.", "info");
          setPlan({ ...defaultPlan, deedNumber: deedNumber || "" });
          setIsNew(true);
        }
      } else {
        showToast("Deed number missing", "error");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast("No existing plan. Creating new one.", "info");
        setPlan({ ...defaultPlan, deedNumber: deedNumber || "" });
        setIsNew(true);
      } else {
        showToast("Error fetching plan", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [deedNumber]);

  // Fetch all plans to check for overlaps
  useEffect(() => {
    const fetchAllPlans = async () => {
      try {
        // Try to get plans by surveyor first, fallback to all plans
        let plans: any[] = [];
        if (account) {
          try {
            plans = await getPlanBySeurveyorWalletAddress(account);
          } catch {
            // Fallback to all plans if surveyor-specific fails
            plans = await getAllPlans();
          }
        } else {
          plans = await getAllPlans();
        }
        
        // Convert coordinates format if needed
        const normalizedPlans: Plan[] = plans.map((p: any) => {
          if (p.coordinates && Array.isArray(p.coordinates)) {
            p.coordinates = p.coordinates.map((coord: any) => {
              // Ensure coordinates are in {latitude, longitude} format
              if (coord.latitude !== undefined && coord.longitude !== undefined) {
                return { latitude: coord.latitude, longitude: coord.longitude };
              }
              // Handle if stored differently
              return { latitude: coord.latitude || coord.lat || 0, longitude: coord.longitude || coord.lng || 0 };
            });
          }
          return p as Plan;
        });
        
        setAllPlans(normalizedPlans);
      } catch (error) {
        console.error("Error fetching plans for overlap detection:", error);
      }
    };
    fetchAllPlans();
  }, [account]);

  // Check for overlaps when plan coordinates or boundaries change
  useEffect(() => {
    const checkOverlaps = () => {
      if (!plan.coordinates || plan.coordinates.length < 3) {
        setOverlappingPlans([]);
        return;
      }

      setLoadingOverlaps(true);
      const overlaps: Array<{ plan: Plan; overlapType: 'polygon' | 'boundary' | 'both'; overlapPercentage?: number }> = [];

      // Convert current plan coordinates to LocationPoint format
      // Plan coordinates are {latitude, longitude}, LocationPoint is {longitude, latitude}
      const currentPlanCoords: LocationPoint[] = plan.coordinates.map(coord => ({
        longitude: coord.longitude,
        latitude: coord.latitude
      }));

      // Check against all other plans
      for (const otherPlan of allPlans) {
        // Skip the current plan itself
        if (otherPlan._id === plan._id || otherPlan.planId === plan.planId) {
          continue;
        }

        if (!otherPlan.coordinates || otherPlan.coordinates.length < 3) {
          continue;
        }

        // Convert other plan coordinates to LocationPoint format
        // Plan coordinates are {latitude, longitude}, LocationPoint is {longitude, latitude}
        const otherPlanCoords: LocationPoint[] = otherPlan.coordinates.map(coord => ({
          longitude: coord.longitude,
          latitude: coord.latitude
        }));

        // Check polygon overlap
        const polygonOverlap = doPolygonsOverlap(currentPlanCoords, otherPlanCoords);

        // Check boundary overlap
        const boundaryOverlap = doBoundariesOverlap(plan.sides, otherPlan.sides);

        if (polygonOverlap || boundaryOverlap) {
          const overlapType: 'polygon' | 'boundary' | 'both' = 
            polygonOverlap && boundaryOverlap ? 'both' :
            polygonOverlap ? 'polygon' : 'boundary';

          const overlapPercentage = polygonOverlap 
            ? calculateOverlapPercentage(currentPlanCoords, otherPlanCoords)
            : undefined;

          overlaps.push({
            plan: otherPlan,
            overlapType,
            overlapPercentage,
          });
        }
      }

      setOverlappingPlans(overlaps);
      setLoadingOverlaps(false);
    };

    // Debounce overlap checking
    const timeoutId = setTimeout(checkOverlaps, 500);
    return () => clearTimeout(timeoutId);
  }, [plan.coordinates, plan.sides, allPlans, plan._id, plan.planId]);

  const coordinateToLatLng = (coord: Coordinate): [number, number] => {
    return [coord.latitude, coord.longitude];
  };

  const latLngToCoordinate = (latlng: [number, number]): Coordinate => {
    return { latitude: latlng[0], longitude: latlng[1] };
  };

  const addPoint = (point: [number, number]) => {
    setPlan((prev) => {
      const newCoordinate = latLngToCoordinate(point);
      const newCoordinates = [...prev.coordinates, newCoordinate];
      const coordTuples = newCoordinates.map(coordinateToLatLng);
      const calculatedArea = coordTuples.length >= 3 ? Math.round(calculatePolygonArea(coordTuples)) : 0;
      
      return {
        ...prev,
        coordinates: newCoordinates,
        areaSize: calculatedArea
      };
    });
  };

  const removePoint = (index: number) => {
    setPlan((prev) => {
      const newCoordinates = prev.coordinates.filter((_, i) => i !== index);
      const coordTuples = newCoordinates.map(coordinateToLatLng);
      const calculatedArea = coordTuples.length >= 3 ? Math.round(calculatePolygonArea(coordTuples)) : 0;
      
      return {
        ...prev,
        coordinates: newCoordinates,
        areaSize: calculatedArea
      };
    });
  };

  const clearAllPoints = () => {
    setPlan(prev => ({ ...prev, coordinates: [], areaSize: 0 }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!plan.planId.trim()) newErrors.planId = "Plan ID is required";
    if (!plan.createdBy.trim()) newErrors.createdBy = "Created By is required";
    if (plan.coordinates.length < 3) newErrors.coordinates = "At least 3 boundary points are required";
    if (plan.areaSize <= 0) newErrors.areaSize = "Area size must be greater than 0";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        // Creating a new plan
        console.log("Creating new plan", plan);
        try {
          const res = await createPlan(plan);
          console.log("res: ", res);
          if (res && res.planId) {
            // Update the deed with the plan ID
            const planIdUpdateRes = await updateSurveyPlanNumber(deedNumber || "", res.planId);
            console.log("planIdUpdateRes: ", planIdUpdateRes);
            
            // Update local state with the created plan data
            setPlan({ ...plan, planId: res.planId });
            setIsNew(false);
            showToast("Plan created successfully!", "success");
          } else {
            showToast("Error: Plan ID not returned from server", "error");
          }
        } catch (error) {
          console.error("Error creating plan:", error);
          showToast("Error creating plan", "error");
        }
      } else {
        // Updating an existing plan
        console.log("Updating plan", plan);
        if (!plan._id) {
          showToast("Error: Plan ID (_id) is missing. Cannot update plan.", "error");
          return;
        }
        
        try {
          // Use MongoDB _id for updating, not planId
          const res = await updatePlan(plan._id, plan);
          console.log("Update res: ", res);
          showToast("Plan updated successfully!", "success");
          
          // Refresh the plan data to ensure we have the latest version
          await fetchPlan();
        } catch (error) {
          console.error("Error updating plan:", error);
          showToast("Error updating plan", "error");
        }
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      showToast("Error saving plan", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    showLoader(); 
    setTimeout(() => {
      hideLoader();
    }, 3000);
  }

  useEffect(()=>{
    console.log("plan: ",plan);
  },[plan])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <SurveyPlanPageHeader handleSave={handleSave} isSaving={isSaving} isNew={isNew} deedNumber={deedNumber} plan={plan}/>
        <SurveyPlanPageTabSelector activeTab={activeTab} setActiveTab={setActiveTab}/>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
          <div className="lg:col-span-2 order-2 lg:order-1 h-full">
            {activeTab === 'map' && (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700 h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <h2 className="text-xl font-semibold text-white">Boundary Map</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={clearAllPoints}
                      disabled={plan.coordinates.length === 0}
                      className="px-3 py-1 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 border border-red-600/30"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Clear All</span>
                    </button>
                  </div>
                </div>
                
                {/* Overlap Warning Banner */}
                {overlappingPlans.length > 0 && (
                  <div className="mb-4 bg-red-50 border-2 border-red-300 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-900 mb-2">
                          ⚠️ {overlappingPlans.length} Overlap{overlappingPlans.length !== 1 ? 's' : ''} Detected
                        </h3>
                        <div className="space-y-2">
                          {overlappingPlans.map((overlap, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-2 border border-red-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  overlap.overlapType === 'polygon' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : overlap.overlapType === 'boundary'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {overlap.overlapType === 'polygon' ? '📍 Polygon' : 
                                   overlap.overlapType === 'boundary' ? '🔗 Boundary' : 
                                   '⚠️ Both'}
                                </span>
                                {overlap.overlapPercentage !== undefined && (
                                  <span className="text-xs font-semibold text-red-600">
                                    {overlap.overlapPercentage.toFixed(1)}% overlap
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700">
                                <span className="font-semibold">Plan:</span> {overlap.plan.planId} 
                                {overlap.plan.deedNumber && <span className="text-gray-500"> (Deed: {overlap.plan.deedNumber})</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-64 sm:h-96 w-full border border-gray-600 rounded-xl overflow-hidden">
                  <MapContainer
                    center={plan.coordinates.length > 0 ? coordinateToLatLng(plan.coordinates[0]) : [7.8731, 80.7718]}
                    zoom={plan.coordinates.length > 0 ? 15 : 8}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    {/* Fit bounds to show all polygons */}
                    {plan.coordinates.length > 0 && (
                      <FitBounds coords={[
                        ...plan.coordinates.map(coordinateToLatLng),
                        ...overlappingPlans.flatMap(op => 
                          op.plan.coordinates?.map(coord => [coord.latitude, coord.longitude] as [number, number]) || []
                        )
                      ]} />
                    )}

                    <MapClickHandler onAddPoint={addPoint} />

                    {/* Render overlapping plans first (in background) */}
                    {overlappingPlans.map((overlap, idx) => {
                      const coords = overlap.plan.coordinates?.map(coord => [coord.latitude, coord.longitude] as [number, number]) || [];
                      if (coords.length < 3) return null;
                      
                      const color = overlap.overlapType === 'polygon' ? '#3b82f6' : 
                                   overlap.overlapType === 'boundary' ? '#f59e0b' : '#ef4444';
                      
                      return (
                        <Polygon
                          key={`overlap-${idx}`}
                          positions={coords}
                          pathOptions={{
                            color: color,
                            fillColor: color,
                            fillOpacity: 0.2,
                            weight: 2,
                            dashArray: '5, 5'
                          }}
                        >
                          <Popup>
                            <div className="text-sm">
                              <strong className="font-semibold">Overlapping Plan: {overlap.plan.planId}</strong>
                              {overlap.plan.deedNumber && (
                                <>
                                  <br />
                                  <span className="text-gray-600">Deed: {overlap.plan.deedNumber}</span>
                                </>
                              )}
                              <br />
                              <span className="text-xs text-gray-500">
                                Type: {overlap.overlapType}
                                {overlap.overlapPercentage !== undefined && ` (${overlap.overlapPercentage.toFixed(1)}%)`}
                              </span>
                            </div>
                          </Popup>
                        </Polygon>
                      );
                    })}

                    {/* Current plan markers */}
                    {plan.coordinates.map((coord, idx) => (
                      <Marker
                        key={idx}
                        position={coordinateToLatLng(coord)}
                        icon={L.icon({
                          iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png",
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png",
                          shadowSize: [41, 41]
                        })}
                      />
                    ))}

                    {/* Current plan polygon */}
                    {plan.coordinates.length > 1 && (
                      <Polygon
                        positions={[...plan.coordinates.map(coordinateToLatLng), coordinateToLatLng(plan.coordinates[0])]}
                        pathOptions={{
                          color: overlappingPlans.length > 0 ? "#ef4444" : "#10B981",
                          fillColor: overlappingPlans.length > 0 ? "#ef4444" : "#10B981",
                          fillOpacity: 0.3,
                          weight: 3
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong className="font-semibold">Current Plan: {plan.planId || 'New Plan'}</strong>
                            {plan.deedNumber && (
                              <>
                                <br />
                                <span className="text-gray-600">Deed: {plan.deedNumber}</span>
                              </>
                            )}
                            {overlappingPlans.length > 0 && (
                              <>
                                <br />
                                <span className="text-red-600 font-semibold">
                                  ⚠️ {overlappingPlans.length} overlap{overlappingPlans.length !== 1 ? 's' : ''} detected
                                </span>
                              </>
                            )}
                          </div>
                        </Popup>
                      </Polygon>
                    )}

                    {/* Fallback to polyline if no polygon yet */}
                    {plan.coordinates.length > 1 && plan.coordinates.length < 3 && (
                      <Polyline 
                        positions={[...plan.coordinates.map(coordinateToLatLng), coordinateToLatLng(plan.coordinates[0])]} 
                        color={overlappingPlans.length > 0 ? "#ef4444" : "#10B981"} 
                        weight={3}
                      />
                    )}
                  </MapContainer>
                </div>
                
                {errors.coordinates && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠</span>
                    {errors.coordinates}
                  </p>
                )}

                {loadingOverlaps && (
                  <p className="text-blue-400 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={4} className="opacity-25" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M4 12a8 8 0 018-8" />
                    </svg>
                    Checking for overlaps...
                  </p>
                )}
                
                <div className="mt-4 text-sm text-gray-400 space-y-1">
                  <p>• Click on the map to add boundary points</p>
                  <p>• Points will automatically connect to form the boundary</p>
                  <p>• Minimum 3 points required for a valid survey plan</p>
                  <p>• Area will be calculated automatically</p>
                </div>

                {plan.coordinates.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {plan.coordinates.map((coord, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                        <div className="text-xs text-gray-400">Point {index + 1}</div>
                        <div className="text-sm font-mono text-gray-200">
                          {coord.latitude.toFixed(4)}, {coord.longitude.toFixed(4)}
                        </div>
                        <button
                          onClick={() => removePoint(index)}
                          className="text-red-400 hover:text-red-300 text-xs mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700 h-full">
                <h2 className="text-xl font-semibold mb-6 text-white">Plan Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Plan ID *
                    </label>
                    <input
                      type="text"
                      value={plan.planId}
                      onChange={(e) => setPlan({ ...plan, planId: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400 ${
                        errors.planId ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter unique plan identifier"
                    />
                    {errors.planId && <p className="text-red-400 text-xs mt-1">{errors.planId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Created By *
                    </label>
                    <input
                      type="text"
                      value={plan.createdBy}
                      onChange={(e) => setPlan({ ...plan, createdBy: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400 ${
                        errors.createdBy ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Licensed surveyor name"
                    />
                    {errors.createdBy && <p className="text-red-400 text-xs mt-1">{errors.createdBy}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Area Size
                    </label>
                    <input
                      type="number"
                      value={plan.areaSize}
                      onChange={(e) => setPlan({ ...plan, areaSize: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-400 mt-1">Auto-calculated from boundary coordinates</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Area Type
                    </label>
                    <select
                      value={plan.areaType}
                      onChange={(e) => setPlan({ ...plan, areaType: e.target.value as Plan["areaType"] })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white"
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Signed By
                    </label>
                    <input
                      type="text"
                      value={plan.signedBy}
                      onChange={(e) => setPlan({ ...plan, signedBy: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400"
                      placeholder="Authorized officer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={plan.status}
                      onChange={(e) => setPlan({ ...plan, status: e.target.value as Plan["status"] })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-300 mb-4">Boundary Sides</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        North Side
                      </label>
                      <input
                        type="text"
                        value={plan.sides.North}
                        onChange={(e) => setPlan({ ...plan, sides: { ...plan.sides, North: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400"
                        placeholder="North boundary description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        South Side
                      </label>
                      <input
                        type="text"
                        value={plan.sides.South}
                        onChange={(e) => setPlan({ ...plan, sides: { ...plan.sides, South: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400"
                        placeholder="South boundary description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        East Side
                      </label>
                      <input
                        type="text"
                        value={plan.sides.East}
                        onChange={(e) => setPlan({ ...plan, sides: { ...plan.sides, East: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400"
                        placeholder="East boundary description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        West Side
                      </label>
                      <input
                        type="text"
                        value={plan.sides.West}
                        onChange={(e) => setPlan({ ...plan, sides: { ...plan.sides, West: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-white placeholder-gray-400"
                        placeholder="West boundary description"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={plan.details || ""}
                    onChange={(e) => setPlan({ ...plan, details: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none text-white placeholder-gray-400 h-full"
                    placeholder="Enter detailed description, notes, restrictions, or special conditions for this survey plan..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700 h-full">
                <h2 className="text-xl font-semibold mb-6 text-white">Plan Summary</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  <div className="p-4 sm:p-6 bg-green-400 rounded-xl">
                    <div className="text-sm text-black mb-1">Total Area</div>
                    <div className="text-xl sm:text-2xl font-bold text-black">
                      <span className="flex flex-wrap text-wrap break-all">{plan.areaSize.toLocaleString("en-US", { notation: "compact" })}</span> {plan.areaType}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-green-400 rounded-xl">
                    <div className="text-sm text-black mb-1">Boundary Points</div>
                    <div className="text-xl sm:text-2xl font-bold text-black">
                      {plan.coordinates.length}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-green-400 rounded-xl">
                    <div className="text-sm text-black mb-1">Plan Status</div>
                    <div className="text-xl sm:text-2xl font-semibold capitalize text-black">
                      {isNew ? 'New Plan' : plan.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 border rounded-xl p-4 bg-green-200">
                    <h3 className="text-lg font-medium text-black">Plan Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-black">Plan ID</span>
                        <span className="font-medium text-black">{plan.planId || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-black">Deed Number</span>
                        <span className="font-medium text-black">{deedNumber}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-black">Created By</span>
                        <span className="font-medium text-black">{plan.createdBy || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-black">Signed By</span>
                        <span className="font-medium text-black">{plan.signedBy || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 order rounded-xl p-4 bg-green-200">
                    <h3 className="text-lg font-medium text-black">Validation Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-black">Plan ID</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.planId ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>
                          {plan.planId ? 'Valid' : 'Required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black">Created By</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.createdBy ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>
                          {plan.createdBy ? 'Valid' : 'Required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black">Boundary Points</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.coordinates.length >= 3 ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>
                          {plan.coordinates.length >= 3 ? 'Valid' : 'Min 3 required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black">Area Calculation</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.areaSize > 0 ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'}`}>
                          {plan.areaSize > 0 ? 'Calculated' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black">Overlap Status</span>
                        <span className={`text-sm px-2 py-1 rounded flex items-center gap-1 ${
                          overlappingPlans.length > 0 
                            ? 'bg-red-600/20 text-red-400 border border-red-600/30' 
                            : 'bg-green-600/20 text-green-400 border border-green-600/30'
                        }`}>
                          {overlappingPlans.length > 0 ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              {overlappingPlans.length} overlap{overlappingPlans.length !== 1 ? 's' : ''}
                            </>
                          ) : (
                            'No overlaps'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(plan.sides.North || plan.sides.South || plan.sides.East || plan.sides.West) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-white">Boundary Sides</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.sides.North && (
                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="text-sm font-medium text-green-400 mb-1">North Side</div>
                          <div className="text-gray-200">{plan.sides.North}</div>
                        </div>
                      )}
                      {plan.sides.South && (
                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="text-sm font-medium text-green-400 mb-1">South Side</div>
                          <div className="text-gray-200">{plan.sides.South}</div>
                        </div>
                      )}
                      {plan.sides.East && (
                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="text-sm font-medium text-green-400 mb-1">East Side</div>
                          <div className="text-gray-200">{plan.sides.East}</div>
                        </div>
                      )}
                      {plan.sides.West && (
                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="text-sm font-medium text-green-400 mb-1">West Side</div>
                          <div className="text-gray-200">{plan.sides.West}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {plan.coordinates.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-white">Coordinate Points</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border border-gray-600 rounded-lg">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-300">Point</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-300">Latitude</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-300">Longitude</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-300 hidden sm:table-cell">Coordinates</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {plan.coordinates.map((coord, index) => (
                            <tr key={index} className="hover:bg-gray-750">
                              <td className="px-4 py-3 font-medium text-green-400">Point {index + 1}</td>
                              <td className="px-4 py-3 font-mono text-gray-200">{coord.latitude.toFixed(6)}</td>
                              <td className="px-4 py-3 font-mono text-gray-200">{coord.longitude.toFixed(6)}</td>
                              <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">
                                {coord.latitude.toFixed(6)}, {coord.longitude.toFixed(6)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2 h-full">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 sticky top-4 h-full">
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Overview</h3>
              
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-black rounded-lg">
                  <div className="text-xs text-white font-medium mb-1">DEED NUMBER</div>
                  <div className="text-sm font-mono font-bold text-white">{deedNumber}</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-black rounded-lg">
                  <div className="text-xs text-white font-medium mb-1">BOUNDARY POINTS</div>
                  <div className="text-xl font-bold text-white">{plan.coordinates.length}</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-black rounded-lg">
                  <div className="text-xs text-white font-medium mb-1">CALCULATED AREA</div>
                  <div className="text-sm font-bold text-white">
                    {plan.areaSize > 0 ? `${plan.areaSize.toLocaleString()} ${plan.areaType}` : 'Not calculated'}
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-black rounded-lg">
                  <div className="text-xs text-white font-medium mb-1">FORM STATUS</div>
                  <div className="text-sm font-bold text-white">
                    {Object.keys(errors).length === 0 ? 'Ready to save' : 'Needs attention'}
                  </div>
                </div>
              </div>

              {plan.coordinates.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Latest Points</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                    {plan.coordinates.slice(-5).map((coord, index) => (
                      <div key={index} className="text-xs p-3 bg-gray-700 rounded border border-gray-600">
                        <div className="font-medium text-gray-200">Point {plan.coordinates.length - 4 + index}</div>
                        <div className="text-gray-400 font-mono mt-1">
                          {coord.latitude.toFixed(4)}, {coord.longitude.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{isNew ? 'New Plan' : 'Existing Plan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize">{plan.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyPlanPage;