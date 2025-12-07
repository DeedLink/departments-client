import React from "react";
import { X } from "lucide-react";
import type { Certificate } from "./types";
import BasicInfoSection from "./BasicInfoSection";
import PartiesSection from "./PartiesSection";
import AdditionalDataSection from "./AdditionalDataSection";
import LastWillManagement from "./LastWillManagement";
import CertificateModalFooter from "./CertificateModalFooter";

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
  onVerify: (certificateId: string) => void;
  isVerifying: boolean;
}

const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  onVerify,
  isVerifying,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 lg:ml-64"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-600 px-6 py-4 border-b border-emerald-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{certificate.title}</h2>
              <p className="text-emerald-100 text-sm mt-1 capitalize">
                {certificate.type.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <BasicInfoSection certificate={certificate} />
          {certificate.description && (
            <div className="mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{certificate.description}</p>
            </div>
          )}
          {certificate.parties && certificate.parties.length > 0 && (
            <PartiesSection parties={certificate.parties} />
          )}
          {certificate.data && Object.keys(certificate.data).length > 0 && (
            <AdditionalDataSection data={certificate.data} />
          )}
          {certificate.type === "last_will" && certificate.tokenId && (
            <LastWillManagement tokenId={certificate.tokenId} />
          )}
        </div>

        <CertificateModalFooter
          certificate={certificate}
          onClose={onClose}
          onVerify={onVerify}
          isVerifying={isVerifying}
        />
      </div>
    </div>
  );
};

export default CertificateModal;

