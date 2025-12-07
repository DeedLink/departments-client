import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { getCertificatesByTokenId } from "../../../api/api";
import { verifyOwnerDeath, getDeathVerification, executeWill, getWill, hasActiveWill } from "../../../web3.0/lastWillIntegration";
import { useToast } from "../../../contexts/ToastContext";
import WillDetails from "./WillDetails";
import DeathVerificationDisplay from "./DeathVerification";
import VerifyDeathForm from "./VerifyDeathForm";
import ExecuteWillButton from "./ExecuteWillButton";

interface LastWillManagementProps {
  tokenId: number;
}

const LastWillManagement: React.FC<LastWillManagementProps> = ({ tokenId }) => {
  const [willDetails, setWillDetails] = useState<any>(null);
  const [deathVerification, setDeathVerification] = useState<any>(null);
  const [loadingWill, setLoadingWill] = useState(false);
  const [deathCertHash, setDeathCertHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { showToast } = useToast();

  const loadWillData = async (tokenId: number) => {
    if (!tokenId) return;
    try {
      setLoadingWill(true);

      const willExists = await hasActiveWill(tokenId);

      if (willExists) {
        const [will, deathVer] = await Promise.all([
          getWill(tokenId).catch(() => null),
          getDeathVerification(tokenId).catch(() => null),
        ]);

        setWillDetails(will);

        if (deathVer && deathVer.isVerified) {
          setDeathVerification(deathVer);
        } else {
          setDeathVerification(null);
        }

        try {
          const certRes = await getCertificatesByTokenId(tokenId);
          if (certRes && !will) {
            setWillDetails(certRes);
          }
        } catch (err) {
          console.log("Certificate not found in API, using blockchain data only");
        }
      } else {
        setWillDetails(null);
        setDeathVerification(null);

        try {
          const certRes = await getCertificatesByTokenId(tokenId);
          if (certRes) {
            setWillDetails(certRes);
          }
        } catch (err) {
          console.log("No certificate found in API");
        }
      }
    } catch (error: any) {
      console.error("Failed to load will data from blockchain:", error);
      showToast(error?.message || "Failed to load last will from blockchain", "error");
    } finally {
      setLoadingWill(false);
    }
  };

  useEffect(() => {
    if (tokenId) {
      loadWillData(tokenId);
    }
  }, [tokenId]);

  const handleVerifyDeath = async () => {
    if (!tokenId) return;
    if (!deathCertHash.trim()) {
      showToast("Please enter death certificate hash", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOwnerDeath(tokenId, deathCertHash.trim());
      showToast(result.message, "success");
      await loadWillData(tokenId);
      setDeathCertHash("");
    } catch (error: any) {
      showToast(error.message || "Failed to verify death", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExecuteWill = async () => {
    if (!tokenId) return;

    const confirmed = confirm(
      `Are you sure you want to execute this last will?\n\nThis will transfer the property to the beneficiary. This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsExecuting(true);
    try {
      const result = await executeWill(tokenId);
      showToast(result.message, "success");
      await loadWillData(tokenId);
    } catch (error: any) {
      showToast(error.message || "Failed to execute will", "error");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="mb-6 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-600" />
        Last Will Management
      </h3>

      {loadingWill ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading last will from blockchain...</p>
          </div>
        </div>
      ) : willDetails ? (
        <>
          <WillDetails willDetails={willDetails} />
          {deathVerification && (
            <DeathVerificationDisplay deathVerification={deathVerification} />
          )}
          {!deathVerification && (
            <VerifyDeathForm
              deathCertHash={deathCertHash}
              onDeathCertHashChange={setDeathCertHash}
              onVerify={handleVerifyDeath}
              isVerifying={isVerifying}
            />
          )}
          {deathVerification &&
            deathVerification.canExecute &&
            willDetails &&
            !willDetails.isExecuted && (
              <ExecuteWillButton
                onExecute={handleExecuteWill}
                isExecuting={isExecuting}
              />
            )}
        </>
      ) : (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">No last will found on blockchain for this token.</p>
        </div>
      )}
    </div>
  );
};

export default LastWillManagement;

