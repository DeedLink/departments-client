import React, { useState, useMemo, useEffect } from "react";
import { Search, Eye, Map, FileText, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import type { Deed } from "../../types/deed";
import SurveyPlan from "./SurveyPlan";
import { getDeedBySurveyorWalletAddress, getPlanByPlanNumber, getPlanByDeedNumber } from "../../api/api";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import DeedPopup from "./DeedPopup";
import { detectOverlappingDeeds, type OverlapResult } from "../../utils/functions";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DeedsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [surveyPoints, setSurveyPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [sidesOfTheDeed, setSidesOfTheDeed] = useState<Deed["sides"] | undefined>(undefined);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [overlaps, setOverlaps] = useState<OverlapResult[]>([]);
  const [isOverlapModalOpen, setIsOverlapModalOpen] = useState(false);
  const [loadingOverlaps, setLoadingOverlaps] = useState(false);
  const [plansMap, setPlansMap] = useState<Record<string, { coordinates: { longitude: number; latitude: number }[]; sides?: { North?: string; South?: string; East?: string; West?: string }; planId?: string }>>({});
  const { account } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchDeeds = async () => {
      try {
        const response = await getDeedBySurveyorWalletAddress(account || "");
        setDeeds(response);
      } catch {
        showToast("Failed to load deeds", "error");
      }
    };
    fetchDeeds();
  }, [account]);

  // Fetch plan data for all deeds and detect overlaps
  useEffect(() => {
    const fetchPlansAndDetectOverlaps = async () => {
      if (deeds.length === 0) return;

      setLoadingOverlaps(true);
      type PlanData = { coordinates: { longitude: number; latitude: number }[]; sides?: { North?: string; South?: string; East?: string; West?: string }; planId?: string };
      const plans: Record<string, PlanData> = {};

      try {
        // Fetch all plan data - try both by plan number and by deed number
        const planPromises = deeds.map(async (deed) => {
          // Try to fetch by surveyPlanNumber first
          if (deed.surveyPlanNumber) {
            try {
              const res = await getPlanByPlanNumber(deed.surveyPlanNumber);
              if (res.success && res.data) {
                // Convert coordinates from {longitude, latitude} to {longitude, latitude} format
                // Database stores as {longitude, latitude}, we need to keep it as LocationPoint format
                const coords = (res.data.coordinates || []).map((coord: any) => ({
                  longitude: coord.longitude ?? coord.lng ?? 0,
                  latitude: coord.latitude ?? coord.lat ?? 0,
                }));
                
                plans[deed.surveyPlanNumber] = {
                  coordinates: coords,
                  sides: res.data.sides,
                  planId: res.data.planId || deed.surveyPlanNumber,
                };
                console.log(`✅ Fetched plan ${deed.surveyPlanNumber} for deed ${deed.deedNumber}`, {
                  coordCount: coords.length,
                  firstCoord: coords[0],
                });
                return;
              }
            } catch (error) {
              console.error(`❌ Failed to fetch plan ${deed.surveyPlanNumber} for deed ${deed.deedNumber}:`, error);
            }
          }
          
          // Also try to fetch plan by deed number (in case plan number is same as deed number)
          // Store it both by planId and by deed number for lookup
          try {
            const res = await getPlanByDeedNumber(deed.deedNumber);
            // Check if response indicates success and has data
            if (res && res.success && res.data) {
              const planId = res.data.planId || res.data._id || deed.deedNumber;
              
              // Convert coordinates from {longitude, latitude} to {longitude, latitude} format
              // Database stores as {longitude, latitude}, we need to keep it as LocationPoint format
              const coords = (res.data.coordinates || []).map((coord: any) => ({
                longitude: coord.longitude ?? coord.lng ?? 0,
                latitude: coord.latitude ?? coord.lat ?? 0,
              }));
              
              const planData = {
                coordinates: coords,
                sides: res.data.sides,
                planId: res.data.planId || planId,
              };
              // Store by both planId and deed number for flexible lookup
              plans[planId] = planData;
              plans[deed.deedNumber] = planData; // Also store by deed number
              // Also store by surveyPlanNumber if it exists and is different
              if (deed.surveyPlanNumber && deed.surveyPlanNumber !== planId) {
                plans[deed.surveyPlanNumber] = planData;
              }
              console.log(`✅ Fetched plan by deed number ${deed.deedNumber} (planId: ${planId})`, {
                coordCount: coords.length,
                firstCoord: coords[0],
              });
            } else {
              // Plan not found (404 or no data) - this is expected for deeds without plans
              // Only log if we're in debug mode or if it's unexpected
              if (process.env.NODE_ENV === 'development') {
                console.log(`ℹ️ No plan found for deed ${deed.deedNumber} (this is OK - deed may not have a plan yet)`);
              }
            }
          } catch (error: any) {
            // Handle network errors or other unexpected errors
            // 404s are expected and handled above, so this is for other errors
            if (error?.response?.status !== 404) {
              console.error(`❌ Error fetching plan for deed ${deed.deedNumber}:`, error);
            } else {
              // 404 is expected - deed doesn't have a plan yet
              if (process.env.NODE_ENV === 'development') {
                console.log(`ℹ️ No plan found for deed ${deed.deedNumber} (404 - this is OK)`);
              }
            }
          }
        });

        await Promise.all(planPromises);
        setPlansMap(plans);

        // Debug: Log deed and plan information
        console.log('=== Overlap Detection Debug ===');
        console.log('Total deeds:', deeds.length);
        console.log('Plans fetched:', Object.keys(plans).length);
        deeds.forEach(deed => {
          console.log(`Deed ${deed.deedNumber}:`, {
            hasPlanNumber: !!deed.surveyPlanNumber,
            planNumber: deed.surveyPlanNumber,
            hasLocation: !!deed.location && deed.location.length > 0,
            locationCount: deed.location?.length || 0,
            hasSides: !!deed.sides,
            planData: deed.surveyPlanNumber ? plans[deed.surveyPlanNumber] : null
          });
        });

        // Detect overlaps
        const detectedOverlaps = detectOverlappingDeeds(deeds, plans);
        console.log('Detected overlaps:', detectedOverlaps);
        console.log('=== End Debug ===');
        setOverlaps(detectedOverlaps);
      } catch (error) {
        console.error("Error detecting overlaps:", error);
        showToast("Failed to detect overlaps", "error");
      } finally {
        setLoadingOverlaps(false);
      }
    };

    fetchPlansAndDetectOverlaps();
  }, [deeds]);

  // Get overlapping deeds for a specific deed
  const getOverlappingDeeds = (deedNumber: string): OverlapResult[] => {
    return overlaps.filter(
      overlap => overlap.deed1 === deedNumber || overlap.deed2 === deedNumber
    );
  };

  // Check if a deed has overlaps
  const hasOverlaps = (deedNumber: string): boolean => {
    return getOverlappingDeeds(deedNumber).length > 0;
  };

  // Get deed info helper (used in error display)
  const getDeedInfo = (deedNumber: string) => {
    return deeds.find(d => d.deedNumber === deedNumber);
  };

  // Get display plan ID - prioritize planId from fetched plan data, otherwise normalize surveyPlanNumber
  const getDisplayPlanId = (deed: Deed): string | null => {
    if (!deed.surveyPlanNumber) return null;
    
    // First, check if we have plan data with the actual planId
    const planData = plansMap[deed.surveyPlanNumber] || plansMap[deed.deedNumber];
    if (planData?.planId) {
      return planData.planId;
    }
    
    // If surveyPlanNumber already has the prefix, return it as is
    if (deed.surveyPlanNumber.startsWith('DeedLinkPlan-')) {
      return deed.surveyPlanNumber;
    }
    
    // Otherwise, add the prefix if it's missing
    // Check if it's a numeric value that needs prefix
    if (/^\d+$/.test(deed.surveyPlanNumber.trim())) {
      return `DeedLinkPlan-${deed.surveyPlanNumber}`;
    }
    
    // Return as is if it doesn't match expected patterns
    return deed.surveyPlanNumber;
  };

  const filteredDeeds = useMemo(() => {
    return deeds.filter((deed) => 
      deed.ownerFullName.toLowerCase().includes(search.toLowerCase()) ||
      deed.deedNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, deeds]);

  const totalPages = Math.ceil(filteredDeeds.length / rowsPerPage);
  const paginatedDeeds = filteredDeeds.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenSurvey = async (deed: Deed) => {
    if (deed.surveyPlanNumber) {
      try {
        const res = await getPlanByPlanNumber(deed.surveyPlanNumber);
        if (res.success) {
          setSurveyPoints(res.data.coordinates);
          setIsSurveyOpen(true);
          setSidesOfTheDeed(res.data.sides);
        }
      } catch {
        showToast("Error getting plan", "error");
      }
    } else {
      showToast("No survey plan available for this deed.", "error");
    }
  };

const getLatestValuation = (deed: Deed) => {
  if (!deed.valuation || deed.valuation.length === 0) return { requested: 0, estimated: 0 };

  const latest = deed.valuation
    .slice()
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))[0];

  const requested = Number(latest.requestedValue) || 0;
  const estimated = Number(latest.estimatedValue) || 0;

  return { requested, estimated };
};



  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Loading Overlaps Indicator */}
      {loadingOverlaps && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={4} className="opacity-25" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M4 12a8 8 0 018-8" />
            </svg>
            <p className="text-sm font-medium text-blue-800">Detecting overlaps...</p>
          </div>
        </div>
      )}

      {/* Overlap Alert Banner */}
      {!loadingOverlaps && overlaps.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-300 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-base font-bold text-red-900">
                  ⚠️ {overlaps.length} Overlap Error{overlaps.length !== 1 ? 's' : ''} Detected
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Critical: Some deeds have overlapping coordinates or boundaries that need immediate attention
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOverlapModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                View on Map
              </button>
              <button
                onClick={() => setIsOverlapModalOpen(true)}
                className="px-4 py-2 bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Errors Summary Panel */}
      {!loadingOverlaps && overlaps.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overlap Errors Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overlaps.slice(0, 6).map((overlap, index) => {
                  const deed1Info = getDeedInfo(overlap.deed1);
                  const deed2Info = getDeedInfo(overlap.deed2);
                  
                  return (
                    <div
                      key={index}
                      className="bg-white border-2 border-red-300 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          overlap.overlapType === 'polygon' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : overlap.overlapType === 'boundary'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {overlap.overlapType === 'polygon' ? '📍 Polygon' : 
                           overlap.overlapType === 'boundary' ? '🔗 Boundary' : 
                           '⚠️ Both'}
                        </span>
                        {overlap.overlapPercentage !== undefined && (
                          <span className="text-xs font-semibold text-red-600">
                            {overlap.overlapPercentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-gray-600">Deed 1:</span>
                          <span className="text-xs font-mono text-red-700 font-bold">{overlap.deed1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-gray-600">Deed 2:</span>
                          <span className="text-xs font-mono text-red-700 font-bold">{overlap.deed2}</span>
                        </div>
                        {deed1Info && deed2Info && (
                          <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
                            {deed1Info.ownerFullName} ↔ {deed2Info.ownerFullName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {overlaps.length > 6 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setIsOverlapModalOpen(true)}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold underline"
                  >
                    View all {overlaps.length} overlap errors →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or deed number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="block md:hidden p-4 space-y-4">
        {paginatedDeeds.map((deed) => {
          const { requested, estimated } = getLatestValuation(deed);
          const deedHasOverlaps = hasOverlaps(deed.deedNumber);
          return (
            <div key={deed.deedNumber} className={`bg-gray-50 border rounded-xl p-4 hover:shadow-md transition-shadow ${deedHasOverlaps ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-green-600 font-mono">{deed.deedNumber}</h3>
                  {deedHasOverlaps && (
                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Overlap
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 px-2 py-1 bg-gray-200 rounded-full">{deed.landType}</span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-black"><strong>Owner:</strong> {deed.ownerFullName}</p>
                <p className="text-black"><strong>Requested Value:</strong> LKR {requested.toLocaleString()}</p>
                <p className="text-black"><strong>Estimated Value:</strong> LKR {estimated.toLocaleString()}</p>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-black font-semibold mb-1">Status:</p>
                  {deedHasOverlaps ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      {getOverlappingDeeds(deed.deedNumber).length} overlap{getOverlappingDeeds(deed.deedNumber).length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      No issues
                    </span>
                  )}
                  {(() => {
                    const displayPlanId = getDisplayPlanId(deed);
                    return displayPlanId ? (
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Plan: {displayPlanId}
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedDeed(deed)}
                  className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  Open Details
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenSurvey(deed)}
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Map className="w-4 h-4" />
                    View Plan
                  </button>
                  <button
                    onClick={() => navigate(`/surveyor/plan/${deed.deedNumber}`)}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Survey
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto p-4">
        <table className="w-full">
          <thead>
            <tr className="border border-gray-200 bg-green-50">
              <th className="px-4 py-3 text-left font-medium text-black">Deed Number</th>
              <th className="px-4 py-3 text-left font-medium text-black">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-black">Land Type</th>
              <th className="px-4 py-3 text-left font-medium text-black">Requested Value (LKR)</th>
              <th className="px-4 py-3 text-left font-medium text-black">Estimated Value (LKR)</th>
              <th className="px-4 py-3 text-center font-medium text-black min-w-[140px]">Status</th>
              <th className="px-4 py-3 text-center font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedDeeds.map((deed) => {
              const { requested, estimated } = getLatestValuation(deed);
              const deedHasOverlaps = hasOverlaps(deed.deedNumber);
              return (
                <tr key={deed.deedNumber} className={`hover:bg-gray-50 text-black transition-colors ${deedHasOverlaps ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-mono font-medium">{deed.deedNumber}</span>
                      {deedHasOverlaps && (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Overlap
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{deed.ownerFullName}</td>
                  <td className="px-4 py-3">{deed.landType}</td>
                  <td className="px-4 py-3 font-mono">{requested.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{estimated.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center min-w-[140px]">
                    <div className="flex flex-col items-center gap-1.5">
                      {deedHasOverlaps ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          {getOverlappingDeeds(deed.deedNumber).length} overlap{getOverlappingDeeds(deed.deedNumber).length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          No issues
                        </span>
                      )}
                      {(() => {
                        const displayPlanId = getDisplayPlanId(deed);
                        return displayPlanId ? (
                          <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                            Plan: {displayPlanId}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedDeed(deed)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3 h-3" /> Open
                      </button>
                      <button
                        onClick={() => handleOpenSurvey(deed)}
                        className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 shadow-sm"
                      >
                        <Map className="w-3 h-3" /> Plan
                      </button>
                      <button
                        onClick={() => navigate(`/surveyor/plan/${deed.deedNumber}`)}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-sm"
                      >
                        <FileText className="w-3 h-3" /> Survey
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredDeeds.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No deeds found</p>
          <p className="text-black text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}

      {totalPages > 0 && (
        <div className="p-4 border-t border-gray-200 flex justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-black text-sm font-medium">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <DeedPopup deed={selectedDeed} onClose={() => setSelectedDeed(null)} />
      <SurveyPlan points={surveyPoints} sides={sidesOfTheDeed} isOpen={isSurveyOpen} onClose={() => setIsSurveyOpen(false)} />
      
      {/* Overlap Details Modal */}
      {isOverlapModalOpen && (
        <OverlapDetailsModal
          overlaps={overlaps}
          deeds={deeds}
          plansMap={plansMap}
          onClose={() => setIsOverlapModalOpen(false)}
        />
      )}
    </div>
  );
};

// Overlap Details Modal Component
interface OverlapDetailsModalProps {
  overlaps: OverlapResult[];
  deeds: Deed[];
  plansMap: Record<string, { coordinates: { longitude: number; latitude: number }[]; sides?: { North?: string; South?: string; East?: string; West?: string } }>;
  onClose: () => void;
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

const OverlapDetailsModal: React.FC<OverlapDetailsModalProps> = ({ overlaps, deeds, plansMap, onClose }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const getDeedInfo = (deedNumber: string) => {
    return deeds.find(d => d.deedNumber === deedNumber);
  };

  const getOverlapTypeColor = (type: string) => {
    switch (type) {
      case 'polygon':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'boundary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'both':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverlapTypeLabel = (type: string) => {
    switch (type) {
      case 'polygon':
        return 'Polygon Overlap';
      case 'boundary':
        return 'Boundary Overlap';
      case 'both':
        return 'Both Polygon & Boundary';
      default:
        return 'Unknown';
    }
  };

  // Get all unique deed numbers from overlaps
  const getUniqueOverlappingDeeds = () => {
    const deedNumbers = new Set<string>();
    overlaps.forEach(overlap => {
      deedNumbers.add(overlap.deed1);
      deedNumbers.add(overlap.deed2);
    });
    return Array.from(deedNumbers);
  };

  // Get coordinates for a deed
  const getDeedCoordinates = (deedNumber: string): [number, number][] => {
    const deed = deeds.find(d => String(d.deedNumber).trim() === String(deedNumber).trim());
    if (!deed) {
      console.log(`⚠️ Deed ${deedNumber} not found in deeds array`);
      return [];
    }

    // Try to get plan coordinates first - check by surveyPlanNumber
    if (deed.surveyPlanNumber && plansMap[deed.surveyPlanNumber]) {
      const planCoords = plansMap[deed.surveyPlanNumber].coordinates;
      console.log(`📍 Using plan ${deed.surveyPlanNumber} for deed ${deedNumber} (${planCoords.length} coords)`);
      // Plan coordinates are stored as {longitude, latitude} but we need [latitude, longitude] for map
      return planCoords.map((coord: any) => {
        const lat = coord.latitude ?? coord.lat ?? 0;
        const lng = coord.longitude ?? coord.lng ?? 0;
        return [lat, lng] as [number, number];
      }).filter(([lat, lng]) => lat !== 0 || lng !== 0);
    }

    // Also try to get plan by deed number
    if (plansMap[deedNumber]) {
      const planCoords = plansMap[deedNumber].coordinates;
      console.log(`📍 Using plan by deed number ${deedNumber} (${planCoords.length} coords)`);
      return planCoords.map((coord: any) => {
        const lat = coord.latitude ?? coord.lat ?? 0;
        const lng = coord.longitude ?? coord.lng ?? 0;
        return [lat, lng] as [number, number];
      }).filter(([lat, lng]) => lat !== 0 || lng !== 0);
    }

    // Fall back to deed location
    if (deed.location && deed.location.length > 0) {
      console.log(`📍 Using deed location for deed ${deedNumber} (${deed.location.length} coords)`);
      return deed.location.map((coord: any) => {
        const lat = coord.latitude ?? coord.lat ?? 0;
        const lng = coord.longitude ?? coord.lng ?? 0;
        return [lat, lng] as [number, number];
      }).filter(([lat, lng]) => lat !== 0 || lng !== 0);
    }

    console.log(`❌ No coordinates found for deed ${deedNumber}`);
    return [];
  };

  // Get all coordinates for map bounds
  const getAllCoordinates = (): [number, number][] => {
    const allCoords: [number, number][] = [];
    getUniqueOverlappingDeeds().forEach(deedNumber => {
      const coords = getDeedCoordinates(deedNumber);
      allCoords.push(...coords);
    });
    return allCoords;
  };


  const allCoords = getAllCoordinates();
  const center: [number, number] = allCoords.length > 0 
    ? [allCoords.reduce((sum, [lat]) => sum + lat, 0) / allCoords.length, 
       allCoords.reduce((sum, [, lng]) => sum + lng, 0) / allCoords.length]
    : [7.8731, 80.7718]; // Default center (Sri Lanka)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 lg:ml-64" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Overlapping Deeds Detected</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {overlaps.length} overlap{overlaps.length !== 1 ? 's' : ''} found between deeds
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tab Selector */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'map'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Map className="w-4 h-4 inline mr-1" />
              Map View
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'map' ? (
            <div className="h-[600px] w-full border border-gray-300 rounded-xl overflow-hidden">
              <MapContainer
                center={center}
                zoom={10}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {allCoords.length > 0 && <FitBounds coords={allCoords} />}
                
                {/* Render each overlap pair - show both deeds in each overlap */}
                {overlaps.map((overlap, overlapIndex) => {
                  console.log(`🗺️ Rendering overlap: ${overlap.deed1} vs ${overlap.deed2}`);
                  const coords1 = getDeedCoordinates(overlap.deed1);
                  const coords2 = getDeedCoordinates(overlap.deed2);
                  console.log(`   Deed ${overlap.deed1}: ${coords1.length} coordinates`);
                  console.log(`   Deed ${overlap.deed2}: ${coords2.length} coordinates`);
                  
                  const deed1 = deeds.find(d => String(d.deedNumber).trim() === String(overlap.deed1).trim());
                  const deed2 = deeds.find(d => String(d.deedNumber).trim() === String(overlap.deed2).trim());
                  
                  // Use different colors for each deed in the pair to distinguish them
                  const color1 = overlapIndex % 2 === 0 ? '#ef4444' : '#3b82f6'; // Red or Blue
                  const color2 = overlapIndex % 2 === 0 ? '#3b82f6' : '#ef4444'; // Blue or Red
                  
                  return (
                    <React.Fragment key={`${overlap.deed1}-${overlap.deed2}-${overlapIndex}`}>
                      {/* Deed 1 Polygon */}
                      {coords1.length >= 3 ? (
                        <>
                          <Polygon
                            positions={coords1}
                            pathOptions={{
                              color: color1,
                              fillColor: color1,
                              fillOpacity: 0.25,
                              weight: 3,
                            }}
                          >
                            <Popup>
                              <div className="text-sm">
                                <strong className="font-semibold text-red-700">Deed: {overlap.deed1}</strong>
                                {deed1 && (
                                  <>
                                    <br />
                                    <span className="text-gray-600">Owner: {deed1.ownerFullName}</span>
                                    <br />
                                    <span className="text-gray-600">Type: {deed1.landType}</span>
                                  </>
                                )}
                                <br />
                                <span className="text-xs text-gray-500 mt-1 block">
                                  Overlaps with: <strong className="text-blue-700">{overlap.deed2}</strong>
                                </span>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                                  overlap.overlapType === 'polygon' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : overlap.overlapType === 'boundary'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {overlap.overlapType === 'polygon' ? '📍 Polygon' : 
                                   overlap.overlapType === 'boundary' ? '🔗 Boundary' : 
                                   '⚠️ Both'}
                                  {overlap.overlapPercentage !== undefined && ` (${overlap.overlapPercentage.toFixed(1)}%)`}
                                </span>
                              </div>
                            </Popup>
                          </Polygon>
                          {/* Deed 1 Label at centroid */}
                          {coords1.length > 0 && (
                            <Marker
                              position={[
                                coords1.reduce((sum, [lat]) => sum + lat, 0) / coords1.length,
                                coords1.reduce((sum, [, lng]) => sum + lng, 0) / coords1.length
                              ]}
                              icon={L.divIcon({
                                className: 'custom-marker',
                                html: `<div style="background-color: ${color1}; color: white; padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); text-align: center;">${overlap.deed1}</div>`,
                                iconSize: [70, 35],
                                iconAnchor: [35, 17],
                              })}
                            />
                          )}
                        </>
                      ) : (
                        <div className="absolute top-2 left-2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded z-[1000] text-sm">
                          ⚠️ Deed {overlap.deed1}: No coordinates found ({coords1.length} points)
                        </div>
                      )}
                      
                      {/* Deed 2 Polygon */}
                      {coords2.length >= 3 ? (
                        <>
                          <Polygon
                            positions={coords2}
                            pathOptions={{
                              color: color2,
                              fillColor: color2,
                              fillOpacity: 0.25,
                              weight: 3,
                              dashArray: '10, 5', // Dashed border to distinguish from deed1
                            }}
                          >
                            <Popup>
                              <div className="text-sm">
                                <strong className="font-semibold text-blue-700">Deed: {overlap.deed2}</strong>
                                {deed2 && (
                                  <>
                                    <br />
                                    <span className="text-gray-600">Owner: {deed2.ownerFullName}</span>
                                    <br />
                                    <span className="text-gray-600">Type: {deed2.landType}</span>
                                  </>
                                )}
                                <br />
                                <span className="text-xs text-gray-500 mt-1 block">
                                  Overlaps with: <strong className="text-red-700">{overlap.deed1}</strong>
                                </span>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                                  overlap.overlapType === 'polygon' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : overlap.overlapType === 'boundary'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {overlap.overlapType === 'polygon' ? '📍 Polygon' : 
                                   overlap.overlapType === 'boundary' ? '🔗 Boundary' : 
                                   '⚠️ Both'}
                                  {overlap.overlapPercentage !== undefined && ` (${overlap.overlapPercentage.toFixed(1)}%)`}
                                </span>
                              </div>
                            </Popup>
                          </Polygon>
                          {/* Deed 2 Label at centroid */}
                          {coords2.length > 0 && (
                            <Marker
                              position={[
                                coords2.reduce((sum, [lat]) => sum + lat, 0) / coords2.length,
                                coords2.reduce((sum, [, lng]) => sum + lng, 0) / coords2.length
                              ]}
                              icon={L.divIcon({
                                className: 'custom-marker',
                                html: `<div style="background-color: ${color2}; color: white; padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); text-align: center;">${overlap.deed2}</div>`,
                                iconSize: [70, 35],
                                iconAnchor: [35, 17],
                              })}
                            />
                          )}
                        </>
                      ) : (
                        <div className="absolute top-2 right-2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded z-[1000] text-sm">
                          ⚠️ Deed {overlap.deed2}: No coordinates found ({coords2.length} points)
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {overlaps.map((overlap, index) => {
                  const deed1Info = getDeedInfo(overlap.deed1);
                  const deed2Info = getDeedInfo(overlap.deed2);
                  
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getOverlapTypeColor(overlap.overlapType)}`}>
                              {getOverlapTypeLabel(overlap.overlapType)}
                            </span>
                            {overlap.overlapPercentage !== undefined && (
                              <span className="text-xs text-gray-600">
                                {overlap.overlapPercentage.toFixed(1)}% overlap
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deed 1</p>
                              <p className="font-mono font-semibold text-green-600">{overlap.deed1}</p>
                              {deed1Info && (
                                <p className="text-sm text-gray-600 mt-1">{deed1Info.ownerFullName}</p>
                              )}
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deed 2</p>
                              <p className="font-mono font-semibold text-green-600">{overlap.deed2}</p>
                              {deed2Info && (
                                <p className="text-sm text-gray-600 mt-1">{deed2Info.ownerFullName}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {overlaps.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No overlaps detected</p>
                  <p className="text-gray-500 text-sm mt-1">All deeds have unique coordinates and boundaries</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeedsTable;
