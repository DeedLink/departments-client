import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { Certificate } from "./types";

interface CertificateModalFooterProps {
  certificate: Certificate;
  onClose: () => void;
  onVerify: (certificateId: string) => void;
  isVerifying: boolean;
}

const CertificateModalFooter: React.FC<CertificateModalFooterProps> = ({
  certificate,
  onClose,
  onVerify,
  isVerifying,
}) => {
  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
      <button
        onClick={onClose}
        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
      >
        Close
      </button>
      {certificate.type !== "last_will" && !certificate.verified && (
        <button
          onClick={() => onVerify(certificate._id)}
          disabled={isVerifying || certificate.rejected}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Verify Certificate
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CertificateModalFooter;

