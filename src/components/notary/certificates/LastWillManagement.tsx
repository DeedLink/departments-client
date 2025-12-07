import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { getCertificatesByTokenId } from "../../../api/api";
import { verifyOwnerDeath, getDeathVerification, executeWill, getWill, hasActiveWill, isWillReadyForExecution, witnessWill } from "../../../web3.0/lastWillIntegration";
import { useToast } from "../../../contexts/ToastContext";
import { useWallet } from "../../../contexts/WalletContext";
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
  const [isWitnessing, setIsWitnessing] = useState(false);
  const [isReadyForExecution, setIsReadyForExecution] = useState(false);
  const { showToast } = useToast();
  const { account } = useWallet();

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

        if (will) {
          setWillDetails(will);
        }

        if (deathVer && deathVer.isVerified) {
          setDeathVerification(deathVer);
        } else {
          setDeathVerification(null);
        }

        const ready = await isWillReadyForExecution(tokenId);
        setIsReadyForExecution(ready);

        try {
          const certRes = await getCertificatesByTokenId(tokenId);
          if (certRes && will) {
            setWillDetails({ ...will, certificateData: certRes });
          } else if (certRes && !will) {
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
      const ready = await isWillReadyForExecution(tokenId);
      setIsReadyForExecution(ready);
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
      setIsReadyForExecution(false);
    } catch (error: any) {
      showToast(error.message || "Failed to execute will", "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleWitnessSign = async (approve: boolean) => {
    if (!tokenId || !account) return;
    
    if (!window.confirm(
      approve 
        ? "Are you sure you want to approve this Last Will? This action cannot be undone."
        : "Are you sure you want to reject this Last Will? This action cannot be undone."
    )) {
      return;
    }

    setIsWitnessing(true);
    try {
      const result = await witnessWill(tokenId, approve);
      showToast(result.message, "success");
      await loadWillData(tokenId);
      const ready = await isWillReadyForExecution(tokenId);
      setIsReadyForExecution(ready);
    } catch (error: any) {
      showToast(error.message || error.reason || "Failed to witness will", "error");
    } finally {
      setIsWitnessing(false);
    }
  };

  const isCurrentUserWitness = () => {
    if (!willDetails || !account) return { isWitness: false, witnessNumber: 0, status: -1 };
    
    const accountLower = account.toLowerCase();
    const witness1Lower = willDetails.witness1?.toLowerCase();
    const witness2Lower = willDetails.witness2?.toLowerCase();
    
    if (witness1Lower && accountLower === witness1Lower) {
      return { isWitness: true, witnessNumber: 1, status: willDetails.witness1Status };
    }
    if (witness2Lower && accountLower === witness2Lower) {
      return { isWitness: true, witnessNumber: 2, status: willDetails.witness2Status };
    }
    
    return { isWitness: false, witnessNumber: 0, status: -1 };
  };

  const witnessInfo = isCurrentUserWitness();

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
          {witnessInfo.isWitness && witnessInfo.status === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
              <h4 className="text-lg font-bold text-yellow-900 mb-3">You are a Witness</h4>
              <p className="text-sm text-yellow-800 mb-4">
                You have been designated as Witness {witnessInfo.witnessNumber} for this Last Will. 
                Please review and sign the will to proceed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleWitnessSign(true)}
                  disabled={isWitnessing}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition"
                >
                  {isWitnessing ? "Signing..." : "Approve & Sign"}
                </button>
                <button
                  onClick={() => handleWitnessSign(false)}
                  disabled={isWitnessing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition"
                >
                  {isWitnessing ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          )}
          {witnessInfo.isWitness && witnessInfo.status !== 0 && (
            <div className={`mb-4 border-2 p-4 rounded-lg ${
              witnessInfo.status === 1 
                ? "bg-green-50 border-green-300" 
                : "bg-red-50 border-red-300"
            }`}>
              <h4 className={`text-lg font-bold mb-2 ${
                witnessInfo.status === 1 ? "text-green-900" : "text-red-900"
              }`}>
                Your Witness Status: {witnessInfo.status === 1 ? "Signed" : "Rejected"}
              </h4>
              <p className={`text-sm ${
                witnessInfo.status === 1 ? "text-green-800" : "text-red-800"
              }`}>
                {witnessInfo.status === 1 
                  ? "You have signed this Last Will. Waiting for the other witness to sign."
                  : "You have rejected this Last Will."}
              </p>
            </div>
          )}
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
          {willDetails &&
            !willDetails.isExecuted &&
            willDetails.witness1Status === 1 &&
            willDetails.witness2Status === 1 &&
            isReadyForExecution && (
              <ExecuteWillButton
                onExecute={handleExecuteWill}
                isExecuting={isExecuting}
              />
            )}
          {willDetails &&
            !willDetails.isExecuted &&
            (willDetails.witness1Status !== 1 || willDetails.witness2Status !== 1) && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Waiting for Witness Signatures
                </h4>
                <p className="text-sm text-yellow-800 mb-2">
                  Both witnesses must sign the will before it can be executed.
                </p>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>
                    Witness 1: {willDetails.witness1Status === 1 ? "✓ Signed" : willDetails.witness1Status === 2 ? "✗ Rejected" : "⏳ Pending"}
                  </p>
                  <p>
                    Witness 2: {willDetails.witness2Status === 1 ? "✓ Signed" : willDetails.witness2Status === 2 ? "✗ Rejected" : "⏳ Pending"}
                  </p>
                </div>
              </div>
            )}
          {willDetails &&
            !willDetails.isExecuted &&
            willDetails.witness1Status === 1 &&
            willDetails.witness2Status === 1 &&
            deathVerification &&
            !deathVerification.canExecute && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Waiting Period Active
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  Both witnesses have signed and death has been verified. The 30-day waiting period must complete before execution.
                </p>
                <p className="text-xs text-blue-700">
                  Waiting period ends: {new Date(deathVerification.waitingPeriodEnd * 1000).toLocaleString()}
                </p>
              </div>
            )}
          {willDetails &&
            !willDetails.isExecuted &&
            willDetails.witness1Status === 1 &&
            willDetails.witness2Status === 1 &&
            !deathVerification && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Ready for Death Verification
                </h4>
                <p className="text-sm text-green-800">
                  Both witnesses have signed. You can now verify the owner's death to proceed with execution.
                </p>
              </div>
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

