import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { formatToETH } from "../../utils/formatCurrency";
import type { Deed, Sides } from "../../types/deed";
import { signProperty, getSignatures } from "../../web3.0/contractService";
import { signDeed, getPlanByPlanNumber } from "../../api/api";
import { BrowserProvider } from "ethers";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  deed: Deed | null;
  onClose: () => void;
};

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


const NotaryDeedPopup = ({ deed, onClose }: Props) => {
  if (!deed) return null;

  const { showToast } = useToast();
  const [isSigned, setIsSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'map'>('details');
  const [planPoints, setPlanPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [planSides, setPlanSides] = useState<Sides | undefined>();
  const [loadingPlan, setLoadingPlan] = useState(false);

  const latestValuation = deed.valuation && deed.valuation.length > 0
    ? deed.valuation.slice().sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  const locationCoords = deed.location && deed.location.length > 0
    ? deed.location.map((loc) => [loc.latitude, loc.longitude] as [number, number])
    : [];

  const mapCoords = planPoints.length > 0
    ? planPoints.map((p) => [p.latitude, p.longitude] as [number, number])
    : locationCoords;

  const mapCenter: [number, number] = mapCoords.length > 0
    ? mapCoords[0]
    : [7.2906, 80.6337];

  useEffect(() => {
    const fetchSurveyPlan = async () => {
      if (deed.surveyPlanNumber && activeTab === 'map') {
        setLoadingPlan(true);
        try {
          const res = await getPlanByPlanNumber(deed.surveyPlanNumber);
          if (res.success && res.data?.coordinates) {
            setPlanPoints(res.data.coordinates);
            setPlanSides(res.data.sides);
          }
        } catch (error) {
          console.error("Error fetching survey plan:", error);
        } finally {
          setLoadingPlan(false);
        }
      }
    };
    fetchSurveyPlan();
  }, [deed.surveyPlanNumber, activeTab]);

  const getMidpoint = (start: [number, number], end: [number, number]): [number, number] => {
    return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  };

  const findSideIndex = (coords: [number, number][], targetSide: "N"|"S"|"E"|"W"): number => {
    let bestIndex = 0;
    let bestScore = -Infinity;
    
    for (let i = 0; i < coords.length; i++) {
      const start = coords[i];
      const end = coords[(i + 1) % coords.length];
      const avgLat = (start[0] + end[0]) / 2;
      const avgLng = (start[1] + end[1]) / 2;
      
      let score = 0;
      
      if (targetSide === "N") {
        score = avgLat;
      } else if (targetSide === "S") {
        score = -avgLat;
      } else if (targetSide === "E") {
        score = avgLng;
      } else if (targetSide === "W") {
        score = -avgLng;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    
    return bestIndex;
  };

  const renderSide = (label: string, targetSide: "N"|"S"|"E"|"W", color: string) => {
    if (mapCoords.length < 4) return null;
    
    const sideIndex = findSideIndex(mapCoords, targetSide);
    const start = mapCoords[sideIndex];
    const end = mapCoords[(sideIndex + 1) % mapCoords.length];
    const midpoint = getMidpoint(start, end);
    
    const divIcon = L.divIcon({
      className: "custom-boundary-label",
      html: `<div style="background:${color};color:white;padding:4px 10px;border-radius:5px;font-size:11px;font-weight:600;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);text-align:center;display:inline-block;">${targetSide}: ${label}</div>`,
      iconSize: [200, 35],
      iconAnchor: [100, 17],
    });

    return <Marker position={midpoint} icon={divIcon} />;
  };

  const checkSignatures = async () => {
    try {
      if (deed.tokenId) {
        const res = await getSignatures(parseInt(deed.tokenId));
        setIsSigned(res.notary);
      }
    } catch {
      showToast("Failed to fetch notary signatures", "error");
    }
  };

  useEffect(() => {
    checkSignatures();
  }, []);

  const handleSign = async () => {
    console.log("Signing deed (Notary):", deed.tokenId);

    try {
      if (!deed.tokenId) {
        showToast("TokenId not found", "error");
        return;
      }

      setLoading(true);

      const sign_response = await signProperty(parseInt(deed.tokenId));
      console.log("sign_response (on-chain): ", sign_response);

      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const message = JSON.stringify(deed.tokenId);
      const signature = await signer.signMessage(message);

      if (!deed._id) {
        showToast("Deed ID not found", "error");
        return;
      }

      const db_response = await signDeed(deed._id, "notary", signature);
      console.log("db_response (off-chain): ", db_response);

      showToast("Deed signed by Notary successfully", "success");
      setIsSigned(true);
    } catch (err) {
      console.error("Error signing deed (Notary):", err);
      showToast("Error signing", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleReject = () => {
    showToast(`Deed #${deed.deedNumber} rejected by Notary`, "info");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4 lg:ml-64">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl relative max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
              Notary Deed Details
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                #{deed.deedNumber}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                {deed.landType}
              </span>
              {deed.surveyPlanNumber ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Plan: {deed.surveyPlanNumber}
                </span>
              ) : null}
              {isSigned && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Signed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'map'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Map View
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Owner Information
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Full Name
                      </p>
                      <p className="text-gray-900 font-medium">{deed.ownerFullName}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        NIC Number
                      </p>
                      <p className="text-gray-900 font-mono">{deed.ownerNIC}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Phone Number
                      </p>
                      <p className="text-gray-900">{deed.ownerPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Property Information
                  </h3>
                  <div className="space-y-3">
                    {latestValuation && (
                      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Requested Value (ETH)
                          </p>
                          <p className="text-lg font-medium text-blue-700">
                            {latestValuation.requestedValue ? formatToETH(latestValuation.requestedValue) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Estimated Value (ETH)
                          </p>
                          <p className="text-lg font-medium text-purple-700">
                            {latestValuation.estimatedValue ? formatToETH(latestValuation.estimatedValue) : "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          District
                        </p>
                        <p className="text-gray-900 font-medium">{deed.district || "N/A"}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Division
                        </p>
                        <p className="text-gray-900 font-medium">{deed.division || "N/A"}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Land Area
                      </p>
                      <p className="text-gray-900 font-medium">
                        {deed.landArea ? `${deed.landArea} ${deed.landSizeUnit || ""}` : "N/A"}
                      </p>
                    </div>
                    {deed.landTitleNumber && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Land Title Number
                        </p>
                        <p className="text-gray-900 font-mono">{deed.landTitleNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Owner Address
                    </p>
                    <p className="text-gray-900 leading-relaxed">{deed.ownerAddress}</p>
                  </div>
                  {deed.landAddress && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Property Address
                      </p>
                      <p className="text-gray-900 leading-relaxed">{deed.landAddress}</p>
                    </div>
                  )}
                  {deed.boundaries && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Boundaries
                      </p>
                      <p className="text-gray-900 leading-relaxed">{deed.boundaries}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[calc(95vh-280px)] w-full">
              {loadingPlan ? (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <svg className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={4} className="opacity-25" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M4 12a8 8 0 018-8" />
                    </svg>
                    <p className="text-gray-600">Loading survey plan...</p>
                  </div>
                </div>
              ) : mapCoords.length > 0 ? (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  minZoom={3}
                  maxZoom={24}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                    maxZoom={24}
                    maxNativeZoom={19}
                  />
                  <FitBounds coords={mapCoords} />
                  {mapCoords.map((coord, index) => (
                    <Marker key={index} position={coord}>
                      <Popup>
                        <div className="text-xs">
                          <strong>Point {index + 1}</strong><br/>
                          Lat: {coord[0].toFixed(6)}<br/>
                          Lng: {coord[1].toFixed(6)}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {mapCoords.length > 2 && (
                    <Polygon
                      positions={mapCoords}
                      pathOptions={{ color: planPoints.length > 0 ? "green" : "#3b82f6", fillOpacity: 0.3, weight: 2 }}
                    />
                  )}
                  {planSides && mapCoords.length >= 4 && (
                    <>
                      {planSides.North && renderSide(planSides.North, "N", "#ef4444")}
                      {planSides.East && renderSide(planSides.East, "E", "#3b82f6")}
                      {planSides.South && renderSide(planSides.South, "S", "#f97316")}
                      {planSides.West && renderSide(planSides.West, "W", "#8b5cf6")}
                    </>
                  )}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">No location data available</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSign}
              disabled={isSigned || loading}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform shadow-lg text-sm sm:text-base
                ${isSigned
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={4} className="opacity-25" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M4 12a8 8 0 018-8" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSigned ? "Already Signed" : "Sign as Notary"}
              </div>
            </button>
            
            <button
              onClick={handleReject}
              disabled={isSigned}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform shadow-lg text-sm sm:text-base
                ${isSigned
                  ? "bg-gray-300 cursor-not-allowed text-white"
                  : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {isSigned ? "Cannot Reject" : "Reject"}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotaryDeedPopup;
