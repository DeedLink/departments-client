import React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface CertificateStatusBadgeProps {
  verified?: boolean;
  rejected?: boolean;
  size?: "sm" | "md";
}

const CertificateStatusBadge: React.FC<CertificateStatusBadgeProps> = ({
  verified,
  rejected,
  size = "md",
}) => {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSize = size === "sm" ? "text-xs" : "text-xs";
  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";

  if (verified) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${textSize} font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 ${padding} rounded-full`}>
        <CheckCircle2 className={iconSize} />
        Verified
      </span>
    );
  }

  if (rejected) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${textSize} font-semibold text-red-700 bg-red-100 border border-red-300 ${padding} rounded-full`}>
        <XCircle className={iconSize} />
        Rejected
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-semibold text-amber-700 bg-amber-100 border border-amber-300 ${padding} rounded-full`}>
      <Clock className={iconSize} />
      Pending
    </span>
  );
};

export default CertificateStatusBadge;

