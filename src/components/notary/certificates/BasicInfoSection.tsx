import React from "react";
import { FileText, Hash, User, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Certificate } from "./types";

interface BasicInfoSectionProps {
  certificate: Certificate;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ certificate }) => {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-emerald-600" />
        Basic Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <Hash className="w-4 h-4 text-gray-400 mt-1" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Certificate ID</p>
            <p className="text-sm font-mono text-gray-900">{certificate._id}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-gray-400 mt-1" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created By</p>
            <p className="text-sm text-gray-900">{certificate.createdBy || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-1" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created At</p>
            <p className="text-sm text-gray-900">
              {certificate.createdAt ? new Date(certificate.createdAt).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-1" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Updated At</p>
            <p className="text-sm text-gray-900">
              {certificate.updatedAt ? new Date(certificate.updatedAt).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        {certificate.verified ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Verified{" "}
            {certificate.verifiedAt
              ? `on ${new Date(certificate.verifiedAt).toLocaleDateString()}`
              : ""}
          </span>
        ) : certificate.rejected ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 bg-red-100 border border-red-300 px-3 py-1.5 rounded-full">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            Pending Verification
          </span>
        )}
      </div>
    </div>
  );
};

export default BasicInfoSection;

