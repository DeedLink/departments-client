import { useEffect, useState, useMemo, useCallback } from "react";
import { getAllPlans } from "../api/api";
import { useToast } from "../contexts/ToastContext";
import type { Plan } from "../types/plan";
import MapView from "../components/map/MapView";
import PlanMarker from "../components/map/PlanMarker";
import PlanDetailsPopup from "../components/map/PlanDetailsPopup";
import { Search, Filter, MapPin, FileText, XCircle, RefreshCw } from "lucide-react";
import { getDeedById } from "../api/api";
import type { Deed } from "../types/deed";

const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];

const PlansMapPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeed, setLoadingDeed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "completed">("all");
  const { showToast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      fetchDeedDetails(selectedPlan.deedNumber);
    } else {
      setSelectedDeed(null);
    }
  }, [selectedPlan]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Failed to load plans";
      setError(errorMsg);
      showToast(errorMsg, "error");
      console.error("Failed to load plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeedDetails = useCallback(async (deedNumber: string) => {
    try {
      setLoadingDeed(true);
      const deed = await getDeedById(deedNumber);
      if (deed && deed.deedNumber) {
        setSelectedDeed(deed);
      } else {
        setSelectedDeed(null);
      }
    } catch (error) {
      console.error("Failed to fetch deed details:", error);
      setSelectedDeed(null);
    } finally {
      setLoadingDeed(false);
    }
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch = 
        plan.planId?.toLowerCase().includes(search.toLowerCase()) ||
        plan.deedNumber.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (statusFilter !== "all" && plan.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [plans, search, statusFilter]);

  const allBounds = useMemo(() => {
    const bounds: [number, number][] = [];
    filteredPlans.forEach((plan) => {
      if (plan.coordinates && plan.coordinates.length >= 3) {
        plan.coordinates.forEach((coord) => {
          bounds.push([coord.latitude, coord.longitude]);
        });
      }
    });
    return bounds;
  }, [filteredPlans]);

  const getPlanColor = (plan: Plan): string => {
    if (plan.status === "active") return "#10b981";
    if (plan.status === "completed") return "#3b82f6";
    return "#6b7280";
  };

  const handlePlanClick = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedPlan(null);
    setSelectedDeed(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading plans...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border border-red-200 p-8">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-lg text-red-700 font-semibold mb-2">Error loading plans</p>
            <p className="text-gray-600 text-sm text-center mb-6">{error}</p>
            <button
              onClick={fetchPlans}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 bg-white rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Sri Lanka Plans Map</h1>
          <p className="text-gray-600">View all survey plans across Sri Lanka</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by plan ID or deed number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      statusFilter === "all"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-l border-r border-gray-300 ${
                      statusFilter === "active"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter("inactive")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-r border-gray-300 ${
                      statusFilter === "inactive"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Inactive
                  </button>
                  <button
                    onClick={() => setStatusFilter("completed")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      statusFilter === "completed"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="h-[calc(100vh-300px)] min-h-[600px] relative">
              {filteredPlans.length === 0 && !loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 rounded-lg">
                  <div className="text-center p-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-700 text-lg font-semibold mb-1">No plans found</p>
                    <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              ) : (
                <MapView
                  center={SRI_LANKA_CENTER}
                  zoom={8}
                  bounds={allBounds.length > 0 ? allBounds : undefined}
                >
                  {filteredPlans.map((plan) => (
                    <PlanMarker
                      key={plan._id || plan.planId}
                      plan={plan}
                      color={getPlanColor(plan)}
                      onPlanClick={handlePlanClick}
                    />
                  ))}
                </MapView>
              )}
            </div>

            {filteredPlans.length > 0 && (
              <div className="absolute top-4 right-4 bg-white rounded-lg border border-gray-200 shadow-lg p-4 z-[2000] pointer-events-auto max-w-[180px] sm:max-w-none">
                <div className="text-sm font-semibold text-gray-800 mb-3">Legend</div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded border-2 border-emerald-700 bg-emerald-600 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">Active</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded border-2 border-blue-700 bg-blue-600 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">Completed</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-500 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">Inactive</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700 font-medium flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>{filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedPlan && (
          <PlanDetailsPopup
            plan={selectedPlan}
            deed={selectedDeed}
            loading={loadingDeed}
            onClose={handleClosePopup}
          />
        )}
      </div>
    </div>
  );
};

export default PlansMapPage;

