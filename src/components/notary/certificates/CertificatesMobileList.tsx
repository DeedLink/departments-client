import React from "react";
import { Eye } from "lucide-react";
import type { Certificate } from "./types";
import CertificateStatusBadge from "./CertificateStatusBadge";

interface CertificatesMobileListProps {
  certificates: Certificate[];
  onViewDetails: (cert: Certificate) => void;
}

const CertificatesMobileList: React.FC<CertificatesMobileListProps> = ({
  certificates,
  onViewDetails,
}) => {
  return (
    <div className="block md:hidden p-4 space-y-4">
      {certificates.map((cert) => {
        const createdDate = cert.createdAt
          ? new Date(cert.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A";

        return (
          <div
            key={cert._id}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="font-bold text-emerald-700 text-base mb-1">{cert.title}</h3>
                <p className="text-xs text-gray-500 font-mono">{cert._id.slice(0, 12)}...</p>
              </div>
              <CertificateStatusBadge verified={cert.verified} rejected={cert.rejected} size="sm" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-medium text-gray-900">
                  {cert.type.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-gray-900">{createdDate}</span>
              </div>
              {cert.description && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 line-clamp-2">{cert.description}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => onViewDetails(cert)}
              className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default CertificatesMobileList;

