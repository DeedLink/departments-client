import { useEffect, useState, useMemo } from "react";
import { useToast } from "../../contexts/ToastContext";
import { formatToETH } from "../../utils/formatCurrency";
import type { Deed } from "../../types/deed";
import { signProperty, getSignatures, getRolesOf } from "../../web3.0/contractService";
import { useWallet } from "../../contexts/WalletContext";
import { signDeed } from "../../api/api";
import { BrowserProvider } from "ethers";

type Props = {
  deed: Deed | null;
  onClose: () => void;
};

const DeedPopup = ({ deed, onClose }: Props) => {
  if (!deed) return null;

  const { showToast } = useToast();
  const [isSurveyorSigned, setIsSurveyorSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { account } = useWallet();

  const callGetSignatures = async () => {
    try {
      if (deed.tokenId) {
        const sigs = await getRolesOf(account || "");
        console.log(sigs);
        const res = await getSignatures(parseInt(deed.tokenId));
        console.log("signatures: ", res);
        setIsSurveyorSigned(res.surveyor);
      }
    } catch (err) {
      console.error("Error fetching signatures:", err);
      showToast("Failed to fetch signatures", "error");
    }
  };

  useEffect(() => {
    callGetSignatures();
    console.log("Survey Plan Number:", deed.surveyPlanNumber);
  }, []);

  const handleSign = async () => {
    if (!deed.surveyPlanNumber) {
      showToast("Survey plan is required to sign", "error");
      return;
    }

    console.log("Signing deed:", deed.tokenId);

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

      const db_response = await signDeed(deed._id, "survey", signature);
      console.log("db_response (off-chain): ", db_response);

      showToast("Deed signed successfully", "success");
      setIsSurveyorSigned(true);
    } catch (err) {
      console.error("Error signing deed:", err);
      showToast("Error signing", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    console.log("Rejecting deed:", deed.deedNumber);
    showToast(`Deed #${deed.deedNumber} rejected`, "info");
    onClose();
  };

  const getLatestValuation = (deed: Deed) => {
    if (!deed.valuation || deed.valuation.length === 0) return { requested: 0, estimated: 0 };
    const latest = [...deed.valuation].sort((a, b) => b.timestamp - a.timestamp)[0];
    return { requested: latest.requestedValue || 0, estimated: latest.estimatedValue || 0 };
  };

  const latestValuation = useMemo(() => getLatestValuation(deed), [deed]);

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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
              Deed Details
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                #{deed.deedNumber}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {deed.landType}
              </span>
              {deed.surveyPlanNumber ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Plan: {deed.surveyPlanNumber}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  No Plan
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-280px)]">
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
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Requested Value (ETH)
                      </p>
                      <p className="text-lg font-medium text-blue-700">
                        {formatToETH(latestValuation.requested)}
                      </p>
                  </div>
                  <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Estimated Value (ETH)
                      </p>
                      <p className="text-lg font-medium text-purple-700">
                        {formatToETH(latestValuation.estimated)}
                      </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      District
                    </p>
                    <p className="text-gray-900 font-medium">{deed.district}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Division
                    </p>
                    <p className="text-gray-900 font-medium">{deed.division}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Owner Address
                </p>
                <p className="text-gray-900 leading-relaxed">{deed.ownerAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSign}
              disabled={isSurveyorSigned || loading || !deed.surveyPlanNumber}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform shadow-lg text-sm sm:text-base
                ${isSurveyorSigned
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : !deed.surveyPlanNumber
                    ? "bg-gray-300 cursor-not-allowed text-white"
                    : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
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
                {isSurveyorSigned
                  ? "Already Signed"
                  : !deed.surveyPlanNumber
                    ? "Plan Required"
                    : "Sign"}
              </div>
            </button>
            
            <button
              onClick={handleReject}
              disabled={isSurveyorSigned}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform shadow-lg text-sm sm:text-base
                ${isSurveyorSigned
                  ? "bg-gray-300 cursor-not-allowed text-white"
                  : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {isSurveyorSigned ? "Cannot Reject" : "Reject"}
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeedPopup;
