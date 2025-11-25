import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import type { Deed } from "../../types/deed";
import { signProperty, getSignatures } from "../../web3.0/contractService";
import { estimateValuation, signDeed, getNearbyLandSales } from "../../api/api";
import { BrowserProvider } from "ethers";
import { formatToETH, parseETHString } from "../../utils/formatCurrency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Props = {
  deed: Deed | null;
  onClose: () => void;
};

const IVSLDeedPopup = ({ deed, onClose }: Props) => {
  if (!deed) return null;

  const { showToast } = useToast();
  const [isIVSLSigned, setIsIVSLSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nearbySales, setNearbySales] = useState<any>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  const callGetSignatures = async () => {
    try {
      if (deed.tokenId) {
        const res = await getSignatures(parseInt(deed.tokenId));
        setIsIVSLSigned(res.ivsl);
      }
    } catch {
      showToast("Failed to fetch signatures", "error");
    }
  };

  useEffect(() => {
    callGetSignatures();
    loadNearbySales();
  }, [deed?._id, radiusKm]);

  const loadNearbySales = async () => {
    if (!deed?._id) return;
    setLoadingSales(true);
    try {
      const data = await getNearbyLandSales(deed._id, radiusKm);
      setNearbySales(data);
    } catch (error) {
      console.error("Failed to load nearby sales:", error);
      setNearbySales(null);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleSign = async () => {
    console.log("Signing deed (IVSL):", deed.tokenId);

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

      const db_response = await signDeed(deed._id, "ivsl", signature);
      console.log("db_response (off-chain): ", db_response);

      showToast("Deed signed by IVSL successfully", "success");
      setIsIVSLSigned(true);
    } catch (err) {
      console.error("Error signing deed (IVSL):", err);
      showToast("Error signing", "error");
    } finally {
      setLoading(false);
    }
  };


  const updateEstimation = async () => {
    if (deed._id) {
      const numeric = parseETHString(ivslEstimatedValue);
      const res = await estimateValuation(deed._id, numeric, true);
      console.log(res);
      showToast("Estimation updated", "success");
    } else {
      showToast("Deed not found", "error");
    }
  };


  const handleReject = () => {
    showToast(`Deed #${deed.deedNumber} rejected by IVSL`, "info");
    onClose();
  };

  const latestValuation = deed.valuation && deed.valuation.length > 0
    ? deed.valuation.slice().sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  const [ ivslEstimatedValue, setIVSLEstimatedValue] = useState(latestValuation ? formatToETH(latestValuation.estimatedValue) : "0 ETH");

  const chartData = nearbySales ? Object.entries(nearbySales.salesByType || {})
    .filter(([_, data]: [string, any]) => data.count > 0)
    .map(([type, data]: [string, any]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      average: parseFloat(formatToETH(data.averageAmount).replace(' ETH', '')) || 0,
      count: data.count,
      total: parseFloat(formatToETH(data.totalAmount).replace(' ETH', '')) || 0
    })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4 lg:ml-64">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm sm:max-w-xl md:max-w-2xl relative max-h-[95vh] overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Deed Details (IVSL)</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                #{deed.deedNumber}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {deed.landType}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-280px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Owner Information</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                  <p className="text-gray-900 font-medium">{deed.ownerFullName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">NIC Number</p>
                  <p className="text-gray-900 font-mono">{deed.ownerNIC}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                  <p className="text-gray-900">{deed.ownerPhone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Property Information</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requested Value (ETH)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatToETH(latestValuation?.requestedValue ?? null)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estimated Value (ETH)</p>
                  <input
                    type="text"
                    onChange={(e) => setIVSLEstimatedValue(e.target.value)}
                    value={ivslEstimatedValue}
                    className="text-2xl font-bold text-green-700 w-full border-b border-gray-300 focus:outline-none"
                  />
                  <div className="flex items-center w-full justify-end mt-2">
                    <button className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl p-1 rounded-xl" onClick={updateEstimation}>Update</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">District</p>
                    <p className="text-gray-900 font-medium">{deed.district}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Division</p>
                    <p className="text-gray-900 font-medium">{deed.division}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Owner Address</p>
                <p className="text-gray-900 leading-relaxed">{deed.ownerAddress}</p>
              </div>
            </div>

            <div className="lg:col-span-2 mt-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Nearby Land Sales Analysis</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Radius (km):</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={loadNearbySales}
                      disabled={loadingSales}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loadingSales ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                </div>

                {loadingSales ? (
                  <div className="text-center py-8 text-gray-500">Loading nearby sales data...</div>
                ) : nearbySales && chartData.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Nearby Properties Found</p>
                        <p className="text-2xl font-bold text-blue-600">{nearbySales.nearbyDeedsCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Search Radius</p>
                        <p className="text-2xl font-bold text-indigo-600">{radiusKm} km</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Average Sale Price by Transaction Type</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} fontSize={11} />
                          <YAxis label={{ value: 'ETH', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(4)} ETH`} />
                          <Legend />
                          <Bar dataKey="average" fill="#3b82f6" name="Average Price (ETH)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Number of Sales by Type</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: any) => {
                              const entry = chartData[props.index];
                              return entry ? `${entry.type}: ${entry.count}` : '';
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Transaction Details by Type</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {Object.entries(nearbySales.salesByType || {})
                          .filter(([_, data]: [string, any]) => data.count > 0)
                          .map(([type, data]: [string, any]) => (
                            <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <p className="text-xs text-gray-500">{data.count} transaction(s)</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">
                                  {formatToETH(data.averageAmount)}
                                </p>
                                <p className="text-xs text-gray-500">avg</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : nearbySales ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No nearby land sales found within {radiusKm} km radius.</p>
                    <p className="text-sm mt-2">Try increasing the search radius.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Unable to load nearby sales data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSign}
            disabled={isIVSLSigned || loading}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform shadow-lg text-sm sm:text-base
              ${isIVSLSigned
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
              }`}
          >
            {loading ? "Signing..." : isIVSLSigned ? "Already Signed" : "Sign as IVSL"}
          </button>

          <button
            onClick={handleReject}
            disabled={isIVSLSigned}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform shadow-lg text-sm sm:text-base
              ${isIVSLSigned
                ? "bg-gray-300 cursor-not-allowed text-white"
                : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
              }`}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IVSLDeedPopup;
