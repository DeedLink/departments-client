import React from "react";
import { AlertCircle } from "lucide-react";

interface VerifyDeathFormProps {
  deathCertHash: string;
  onDeathCertHashChange: (value: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
}

const VerifyDeathForm: React.FC<VerifyDeathFormProps> = ({
  deathCertHash,
  onDeathCertHashChange,
  onVerify,
  isVerifying,
}) => {
  return (
    <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Verify Owner Death
      </h4>
      <p className="text-sm text-red-800 mb-3">
        To execute this last will, you must first verify the owner's death with a death certificate.
      </p>
      <input
        type="text"
        value={deathCertHash}
        onChange={(e) => onDeathCertHashChange(e.target.value)}
        placeholder="Enter death certificate hash (IPFS hash or document hash)"
        className="w-full px-4 py-2 border border-red-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />
      <button
        onClick={onVerify}
        disabled={isVerifying || !deathCertHash.trim()}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {isVerifying ? "Verifying..." : "Verify Death"}
      </button>
    </div>
  );
};

export default VerifyDeathForm;

