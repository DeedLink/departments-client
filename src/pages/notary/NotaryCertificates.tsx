import React, { useEffect, useState } from "react";
import { getAllCertificates, verifyCertificate } from "../../api/api";
import { verifyOwnerDeath, getDeathVerification, executeWill, getWill } from "../../web3.0/lastWillIntegration";
import { useToast } from "../../contexts/ToastContext";

type Party = {
  name: string;
  role: string;
  contact: string;
};

type Certificate = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  parties?: Party[];
  data?: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  tokenId?: number;
};

type DeathVerification = {
  isVerified: boolean;
  verifiedAt: number;
  verifiedBy: string;
  deathCertificateHash: string;
  waitingPeriodEnd: number;
  canExecute: boolean;
};

const NotaryCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deathVerification, setDeathVerification] = useState<DeathVerification | null>(null);
  const [willDetails, setWillDetails] = useState<any>(null);
  const [deathCertHash, setDeathCertHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isVerifyingCert, setIsVerifyingCert] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await getAllCertificates();
      const list = Array.isArray(res) ? res : Array.isArray(res) ? res : [];
      setCertificates(list);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const loadWillData = async (tokenId: number) => {
    if (!tokenId) return;
    try {
      const [will, deathVer] = await Promise.all([
        getWill(tokenId).catch(() => null),
        getDeathVerification(tokenId).catch(() => null)
      ]);
      setWillDetails(will);
      if (deathVer && deathVer.isVerified) {
        setDeathVerification(deathVer);
      }
    } catch (error) {
      console.error("Failed to load will data:", error);
    }
  };

  useEffect(() => {
    if (selectedCert && selectedCert.type === "last_will" && selectedCert.tokenId) {
      loadWillData(selectedCert.tokenId);
    } else {
      setWillDetails(null);
      setDeathVerification(null);
    }
  }, [selectedCert]);

  const handleVerifyDeath = async () => {
    if (!selectedCert?.tokenId) return;
    if (!deathCertHash.trim()) {
      showToast("Please enter death certificate hash", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOwnerDeath(selectedCert.tokenId, deathCertHash.trim());
      showToast(result.message, "success");
      await loadWillData(selectedCert.tokenId);
      setDeathCertHash("");
    } catch (error: any) {
      showToast(error.message || "Failed to verify death", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExecuteWill = async () => {
    if (!selectedCert?.tokenId) return;
    
    const confirmed = confirm(
      `Are you sure you want to execute this last will?\n\nThis will transfer the property to the beneficiary. This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsExecuting(true);
    try {
      const result = await executeWill(selectedCert.tokenId);
      showToast(result.message, "success");
      await loadWillData(selectedCert.tokenId);
    } catch (error: any) {
      showToast(error.message || "Failed to execute will", "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleVerify = async (certificateId: string) => {
    setIsVerifyingCert(true);
    try {
      const result = await verifyCertificate(certificateId);
      showToast("Certificate verified successfully", "success");
      await fetchCertificates();
      if (selectedCert?._id === certificateId) {
        setSelectedCert({ ...selectedCert, ...result });
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to verify certificate", "error");
    } finally {
      setIsVerifyingCert(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-gray-700">Loading certificates...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Assigned Certificates</h1>
      {certificates.length === 0 ? (
        <p className="text-gray-600">No certificates found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white shadow-md rounded-2xl p-4 border hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedCert(cert)}
            >
              <h2 className="text-lg font-semibold text-gray-800">{cert.title}</h2>
              <p className="text-sm text-gray-600 capitalize mt-1">Type: {cert.type.replaceAll("_", " ")}</p>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{cert.description}</p>
              <p className="text-xs text-gray-400 mt-3">
                Created: {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
      {selectedCert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{selectedCert.title}</h2>
            <p className="text-gray-600 mb-4 capitalize">Type: {selectedCert.type.replaceAll("_", " ")}</p>
            <div className="mb-6 border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Basic Information</h3>
              <p className="text-gray-700 mb-2"><span className="font-medium">Certificate ID:</span> {selectedCert._id}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Created By:</span> {selectedCert.createdBy || "N/A"}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Created At:</span> {selectedCert.createdAt ? new Date(selectedCert.createdAt).toLocaleString() : "N/A"}</p>
              <p className="text-gray-700"><span className="font-medium">Updated At:</span> {selectedCert.updatedAt ? new Date(selectedCert.updatedAt).toLocaleString() : "N/A"}</p>
            </div>
            {selectedCert.description && (
              <div className="mb-6 border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-700">{selectedCert.description}</p>
              </div>
            )}
            {selectedCert.parties && selectedCert.parties.length > 0 && (
              <div className="mb-6 border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Involved Parties</h3>
                <ul className="space-y-2">
                  {selectedCert.parties.map((p, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      <span className="font-medium">{p.name}</span> — {p.role} ({p.contact})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedCert.data && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Data</h3>
                <div className="bg-gray-100 rounded-lg p-3 max-h-72 overflow-auto">
                  <pre className="text-xs text-gray-700">{JSON.stringify(selectedCert.data, null, 2)}</pre>
                </div>
              </div>
            )}
            {selectedCert.type === "last_will" && selectedCert.tokenId && (
              <div className="mb-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Last Will Management</h3>
                
                {willDetails && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700"><span className="font-medium">Beneficiary:</span> {willDetails.beneficiary}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium">Status:</span> {willDetails.isActive ? "Active" : "Inactive"}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium">Executed:</span> {willDetails.isExecuted ? "Yes" : "No"}</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Witnesses:</span> {
                        willDetails.witness1Status === 1 && willDetails.witness2Status === 1 
                          ? "Both signed" 
                          : "Pending signatures"
                      }
                    </p>
                  </div>
                )}

                {deathVerification && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">Death Verification Status</h4>
                    <p className="text-sm text-yellow-800"><span className="font-medium">Verified:</span> Yes</p>
                    <p className="text-sm text-yellow-800"><span className="font-medium">Verified At:</span> {new Date(deathVerification.verifiedAt * 1000).toLocaleString()}</p>
                    <p className="text-sm text-yellow-800"><span className="font-medium">Verified By:</span> {deathVerification.verifiedBy.slice(0, 10)}...{deathVerification.verifiedBy.slice(-8)}</p>
                    <p className="text-sm text-yellow-800"><span className="font-medium">Certificate Hash:</span> {deathVerification.deathCertificateHash}</p>
                    <p className="text-sm text-yellow-800"><span className="font-medium">Waiting Period Ends:</span> {new Date(deathVerification.waitingPeriodEnd * 1000).toLocaleString()}</p>
                    <p className={`text-sm font-semibold mt-2 ${deathVerification.canExecute ? 'text-green-700' : 'text-yellow-700'}`}>
                      {deathVerification.canExecute ? "✅ Ready to Execute" : "⏳ Waiting Period Active"}
                    </p>
                  </div>
                )}

                {!deathVerification && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Verify Owner Death</h4>
                    <p className="text-sm text-red-800 mb-3">To execute this last will, you must first verify the owner's death with a death certificate.</p>
                    <input
                      type="text"
                      value={deathCertHash}
                      onChange={(e) => setDeathCertHash(e.target.value)}
                      placeholder="Enter death certificate hash (IPFS hash or document hash)"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg mb-3 text-sm"
                    />
                    <button
                      onClick={handleVerifyDeath}
                      disabled={isVerifying || !deathCertHash.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? "Verifying..." : "Verify Death"}
                    </button>
                  </div>
                )}

                {deathVerification && deathVerification.canExecute && willDetails && !willDetails.isExecuted && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Execute Last Will</h4>
                    <p className="text-sm text-green-800 mb-3">The waiting period has ended. You can now execute this last will to transfer the property to the beneficiary.</p>
                    <button
                      onClick={handleExecuteWill}
                      disabled={isExecuting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isExecuting ? "Executing..." : "Execute Last Will"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedCert(null);
                  setDeathVerification(null);
                  setWillDetails(null);
                  setDeathCertHash("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
              {selectedCert.type !== "last_will" && (
                <button
                  onClick={() => handleVerify(selectedCert._id)}
                  disabled={isVerifyingCert}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingCert ? "Verifying..." : "Verify Certificate"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotaryCertificates;
