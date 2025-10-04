import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import type { Deed } from "../../types/deed";
import { signProperty, getSignatures } from "../../web3.0/contractService";

type Props = {
  deed: Deed | null;
  onClose: () => void;
};

const NotaryDeedPopup = ({ deed, onClose }: Props) => {
  if (!deed) return null;

  const { showToast } = useToast();
  const [isSigned, setIsSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  const latestValuation = deed.valuation && deed.valuation.length > 0
    ? deed.valuation.slice().sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

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
    if (!deed.tokenId) {
      showToast("TokenId not found", "error");
      return;
    }
    setLoading(true);
    try {
      await signProperty(parseInt(deed.tokenId));
      showToast("Deed signed by Notary successfully", "success");
      setIsSigned(true);
    } catch {
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
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md lg:max-w-2xl relative max-h-[95vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 relative bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Notary Deed Details</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] space-y-2">
          <p className="text-gray-700"><strong>Owner:</strong> {deed.ownerFullName}</p>
          <p className="text-gray-700"><strong>NIC:</strong> {deed.ownerNIC}</p>
          <p className="text-gray-700">
            <strong>Requested Value:</strong> Rs. {latestValuation?.requestedValue?.toLocaleString() || "0"}
          </p>
          <p className="text-gray-700">
            <strong>Estimated Value:</strong> Rs. {latestValuation?.estimatedValue?.toLocaleString() || "0"}
          </p>
          <p className="text-gray-700"><strong>Land Type:</strong> {deed.landType}</p>
          <p className="text-gray-700"><strong>Deed Number:</strong> {deed.deedNumber}</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSign}
            disabled={isSigned || loading}
            className={`flex-1 px-6 py-2 rounded-lg font-semibold text-white 
              ${isSigned ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            {loading ? "Signing..." : isSigned ? "Already Signed" : "Sign as Notary"}
          </button>
          <button
            onClick={handleReject}
            disabled={isSigned}
            className="flex-1 px-6 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotaryDeedPopup;
