import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { shortAddress } from "../../../utils/formatCurrency";
import type { DeathVerification } from "./types";

interface DeathVerificationDisplayProps {
  deathVerification: DeathVerification;
}

const DeathVerificationDisplay: React.FC<DeathVerificationDisplayProps> = ({ deathVerification }) => {
  return (
    <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" />
        Death Verification Status
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Verified At</p>
          <p className="text-sm text-amber-900">
            {new Date(deathVerification.verifiedAt * 1000).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Verified By</p>
          <p className="text-sm font-mono text-amber-900">
            {shortAddress(deathVerification.verifiedBy)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Certificate Hash</p>
          <p className="text-sm font-mono text-amber-900 break-all">
            {deathVerification.deathCertificateHash}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Waiting Period Ends</p>
          <p className="text-sm text-amber-900">
            {new Date(deathVerification.waitingPeriodEnd * 1000).toLocaleString()}
          </p>
        </div>
      </div>
      <div
        className={`mt-3 pt-3 border-t border-amber-300 ${
          deathVerification.canExecute ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        <p
          className={`text-sm font-semibold flex items-center gap-2 ${
            deathVerification.canExecute ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {deathVerification.canExecute ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Ready to Execute
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Waiting Period Active
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default DeathVerificationDisplay;

