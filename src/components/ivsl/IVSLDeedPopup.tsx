import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import type { Deed } from "../../types/deed";
import { signProperty, getSignatures } from "../../web3.0/contractService";
import { estimateValuation } from "../../api/api";

type Props = {
  deed: Deed | null;
  onClose: () => void;
};

const IVSLDeedPopup = ({ deed, onClose }: Props) => {
  if (!deed) return null;

  const { showToast } = useToast();
  const [isIVSLSigned, setIsIVSLSigned] = useState(false);
  const [loading, setLoading] = useState(false);

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
  }, []);

  const handleSign = async () => {
    if (!deed.tokenId) {
      showToast("TokenId not found", "error");
      return;
    }
    setLoading(true);
    try {
      await signProperty(parseInt(deed.tokenId));
      showToast("Deed signed by IVSL successfully", "success");
      setIsIVSLSigned(true);
    } catch {
      showToast("Error signing", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateEstimation = async () => {
    if (deed._id) {
      const res = await estimateValuation(deed._id, parseFloat(ivslEstimatedValue.replace(/,/g, "")), true);
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

    const [ ivslEstimatedValue, setIVSLEstimatedValue] = useState(latestValuation?.estimatedValue?.toLocaleString("en-LK") || "0");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4 lg:ml-64">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm sm:max-w-md lg:max-w-2xl relative max-h-[95vh] overflow-hidden">
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
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requested Value (LKR)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {latestValuation?.requestedValue?.toLocaleString("en-LK") || "0"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estimated Value (LKR)</p>
                  <input
                    type="number"
                    onChange={(e) => setIVSLEstimatedValue(e.target.value)}
                    value={ivslEstimatedValue.replace(/,/g, "")}
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
