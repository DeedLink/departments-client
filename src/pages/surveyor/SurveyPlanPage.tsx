import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import { getPlanByDeedNumber } from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import type { Plan } from "../../types/plan";
import L from "leaflet";
import { Save, Trash2, Calculator, Map, FileText, Calendar } from "lucide-react";
import { calculatePolygonArea } from "../../utils/functions";
import { useLoader } from "../../contexts/LoaderContext";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'map' | 'details' | 'summary'>('map');
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();

  const fetchPlan = async () => {
    setIsLoading(true);
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

  const addPoint = (point: [number, number]) => {
    setPlan((prev:any) => {
      const newCoordinates = [...(prev.coordinates || []), point];
      const calculatedArea = newCoordinates.length >= 3 ? Math.round(calculatePolygonArea(newCoordinates)) : 0;
      return {
        ...prev,
        coordinates: newCoordinates,
        areaSize: calculatedArea
      };
    });
  };

  const removePoint = (index: number) => {
    setPlan((prev:any) => {
      const newCoordinates = prev.coordinates.filter((_:any, i:any) => i !== index);
      const calculatedArea = newCoordinates.length >= 3 ? Math.round(calculatePolygonArea(newCoordinates)) : 0;
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
        console.log("Creating new plan", plan);
      } else {
        console.log("Updating plan", plan);
      }
      
      showToast(isNew ? "Plan created successfully!" : "Plan updated successfully!", "success");
      setIsNew(false);
    } catch (error) {
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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isNew ? "Create New Survey Plan" : "Edit Survey Plan"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-green-500" />
                  Deed: {deedNumber}
                </span>
                {plan.planId && (
                  <span className="flex items-center gap-1">
                    <Map className="w-4 h-4 text-green-500" />
                    Plan: {plan.planId}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-green-500" />
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white px-4 sm:px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{isNew ? "Create Plan" : "Update Plan"}</span>
                  <span className="sm:hidden">{isNew ? "Create" : "Update"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800 rounded-xl shadow-2xl mb-4 sm:mb-6 border border-gray-700">
          <div className="flex overflow-x-auto">
            {[
              { key: 'map', label: 'Boundary Map', icon: Map, shortLabel: 'Map' },
              { key: 'details', label: 'Plan Details', icon: FileText, shortLabel: 'Details' },
              { key: 'summary', label: 'Summary', icon: Calculator, shortLabel: 'Summary' }
            ].map(({ key, label, icon: Icon, shortLabel }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 min-w-0 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === key
                    ? 'text-green-400 border-b-2 border-green-400 bg-gray-750'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            {activeTab === 'map' && (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700">
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
                
                <div className="h-64 sm:h-96 w-full border border-gray-600 rounded-xl overflow-hidden">
                  <MapContainer
                    center={[7.8731, 80.7718]}
                    zoom={8}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    <MapClickHandler onAddPoint={addPoint} />

                    {plan.coordinates.map((point, idx) => (
                      <Marker
                        key={idx}
                        position={point as any}
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

                    {plan.coordinates.length > 1 && (
                      <Polyline 
                        positions={[...plan.coordinates, plan.coordinates[0]] as any[]} 
                        color="#10B981" 
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
                
                <div className="mt-4 text-sm text-gray-400 space-y-1">
                  <p>• Click on the map to add boundary points</p>
                  <p>• Points will automatically connect to form the boundary</p>
                  <p>• Minimum 3 points required for a valid survey plan</p>
                  <p>• Area will be calculated automatically</p>
                </div>

                {plan.coordinates.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {plan.coordinates.map((coord, index) => {
                      const lat = Array.isArray(coord) ? coord[0] : (coord as any).lat || 0;
                      const lng = Array.isArray(coord) ? coord[1] : (coord as any).lng || 0;
                      
                      return (
                        <div key={index} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                          <div className="text-xs text-gray-400">Point {index + 1}</div>
                          <div className="text-sm font-mono text-gray-200">
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                          </div>
                          <button
                            onClick={() => removePoint(index)}
                            className="text-red-400 hover:text-red-300 text-xs mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={plan.details || ""}
                    onChange={(e) => setPlan({ ...plan, details: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none text-white placeholder-gray-400"
                    placeholder="Enter detailed description, notes, restrictions, or special conditions for this survey plan..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-white">Plan Summary</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl border border-blue-700/50">
                    <div className="text-sm text-gray-300 mb-1">Total Area</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-400">
                      {plan.areaSize.toLocaleString()} {plan.areaType}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl border border-green-700/50">
                    <div className="text-sm text-gray-300 mb-1">Boundary Points</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {plan.coordinates.length}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl border border-purple-700/50">
                    <div className="text-sm text-gray-300 mb-1">Plan Status</div>
                    <div className="text-lg font-semibold capitalize text-purple-400">
                      {isNew ? 'New Plan' : plan.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Plan Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Plan ID</span>
                        <span className="font-medium text-gray-200">{plan.planId || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Deed Number</span>
                        <span className="font-medium text-gray-200">{deedNumber}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Created By</span>
                        <span className="font-medium text-gray-200">{plan.createdBy || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Signed By</span>
                        <span className="font-medium text-gray-200">{plan.signedBy || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Validation Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Plan ID</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.planId ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>
                          {plan.planId ? 'Valid' : 'Required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Created By</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.createdBy ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>
                          {plan.createdBy ? 'Valid' : 'Required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Boundary Points</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.coordinates.length >= 3 ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>
                          {plan.coordinates.length >= 3 ? 'Valid' : 'Min 3 required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Area Calculation</span>
                        <span className={`text-sm px-2 py-1 rounded ${plan.areaSize > 0 ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'}`}>
                          {plan.areaSize > 0 ? 'Calculated' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

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
                          {plan.coordinates.map((coord, index) => {
                            const lat = Array.isArray(coord) ? coord[0] : (coord as any).lat || 0;
                            const lng = Array.isArray(coord) ? coord[1] : (coord as any).lng || 0;
                            
                            return (
                              <tr key={index} className="hover:bg-gray-750">
                                <td className="px-4 py-3 font-medium text-green-400">Point {index + 1}</td>
                                <td className="px-4 py-3 font-mono text-gray-200">{lat.toFixed(6)}</td>
                                <td className="px-4 py-3 font-mono text-gray-200">{lng.toFixed(6)}</td>
                                <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">
                                  {lat.toFixed(6)}, {lng.toFixed(6)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 sticky top-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Overview</h3>
              
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg border border-blue-700/50">
                  <div className="text-xs text-blue-400 font-medium mb-1">DEED NUMBER</div>
                  <div className="text-sm font-mono font-bold text-blue-200">{deedNumber}</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-lg border border-green-700/50">
                  <div className="text-xs text-green-400 font-medium mb-1">BOUNDARY POINTS</div>
                  <div className="text-xl font-bold text-green-200">{plan.coordinates.length}</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg border border-purple-700/50">
                  <div className="text-xs text-purple-400 font-medium mb-1">CALCULATED AREA</div>
                  <div className="text-sm font-bold text-purple-200">
                    {plan.areaSize > 0 ? `${plan.areaSize.toLocaleString()} ${plan.areaType}` : 'Not calculated'}
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 rounded-lg border border-yellow-700/50">
                  <div className="text-xs text-yellow-400 font-medium mb-1">FORM STATUS</div>
                  <div className="text-sm font-bold text-yellow-200">
                    {Object.keys(errors).length === 0 ? 'Ready to save' : 'Needs attention'}
                  </div>
                </div>
              </div>

              {plan.coordinates.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Latest Points</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {plan.coordinates.slice(-5).map((coord, index) => {
                      const lat = Array.isArray(coord) ? coord[0] : (coord as any).lat || 0;
                      const lng = Array.isArray(coord) ? coord[1] : (coord as any).lng || 0;
                      
                      return (
                        <div key={index} className="text-xs p-3 bg-gray-700 rounded border border-gray-600">
                          <div className="font-medium text-gray-200">Point {plan.coordinates.length - 4 + index}</div>
                          <div className="text-gray-400 font-mono mt-1">
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                          </div>
                        </div>
                      );
                    })}
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