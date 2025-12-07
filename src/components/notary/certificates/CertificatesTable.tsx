import React from "react";
import { Eye } from "lucide-react";
import type { Certificate } from "./types";
import CertificateStatusBadge from "./CertificateStatusBadge";

interface CertificatesTableProps {
  certificates: Certificate[];
  onViewDetails: (cert: Certificate) => void;
}

const CertificatesTable: React.FC<CertificatesTableProps> = ({
  certificates,
  onViewDetails,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-emerald-600 border-b-2 border-emerald-700">
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Certificate ID</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Title</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Created</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider min-w-[140px]">Status</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {certificates.map((cert) => {
            const createdDate = cert.createdAt
              ? new Date(cert.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A";

            return (
              <tr key={cert._id} className="hover:bg-emerald-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-emerald-700 font-mono font-semibold text-sm">
                    {cert._id.slice(0, 12)}...
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{cert.title}</div>
                  {cert.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {cert.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                    {cert.type.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {createdDate}
                </td>
                <td className="px-6 py-4 text-center min-w-[140px]">
                  <CertificateStatusBadge verified={cert.verified} rejected={cert.rejected} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onViewDetails(cert)}
                    className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CertificatesTable;

