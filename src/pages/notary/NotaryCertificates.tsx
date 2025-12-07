import React, { useEffect, useState, useMemo } from "react";
import { getAllCertificates, verifyCertificate } from "../../api/api";
import { verifyOwnerDeath, getDeathVerification, executeWill, getWill } from "../../web3.0/lastWillIntegration";
import { useToast } from "../../contexts/ToastContext";
import { shortAddress } from "../../utils/formatCurrency";
import { Search, Filter, CheckCircle2, XCircle, Clock, FileText, Shield, ChevronLeft, ChevronRight, Eye, X, AlertCircle, User, Calendar, Hash } from "lucide-react";

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
  verified?: boolean;
  rejected?: boolean;
  verifiedAt?: string;
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending" | "rejected">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const rowsPerPage = 5;

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await getAllCertificates();
      const list = Array.isArray(res) ? res : [];
      setCertificates(list);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load certificates");
      showToast("Failed to load certificates", "error");
    } finally {
      setLoading(false);
    }
  };

  const certificateTypes = useMemo(() => {
    const types = new Set(certificates.map(cert => cert.type));
    return Array.from(types);
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch = cert.title.toLowerCase().includes(search.toLowerCase()) ||
        cert.description?.toLowerCase().includes(search.toLowerCase()) ||
        cert._id.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (statusFilter === "verified") {
        if (cert.verified !== true) return false;
      } else if (statusFilter === "pending") {
        if (cert.verified === true || cert.rejected === true) return false;
      } else if (statusFilter === "rejected") {
        if (cert.rejected !== true) return false;
      }
      
      if (typeFilter !== "all" && cert.type !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [search, certificates, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredCertificates.length / rowsPerPage);
  const paginatedCertificates = filteredCertificates.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading certificates...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 font-semibold">{error}</p>
          <button
            onClick={fetchCertificates}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Certificate Management</h1>
          <p className="text-gray-600">Review, verify, and manage assigned certificates</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, description, or certificate ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        statusFilter === "all"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => setStatusFilter("verified")}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-l border-r border-gray-300 ${
                        statusFilter === "verified"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </div>
                    </button>
                    <button
                      onClick={() => setStatusFilter("pending")}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-r border-gray-300 ${
                        statusFilter === "pending"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Pending
                      </div>
                    </button>
                    <button
                      onClick={() => setStatusFilter("rejected")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        statusFilter === "rejected"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </div>
                    </button>
                  </div>
                </div>
                {certificateTypes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="all">All Types</option>
                      {certificateTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredCertificates.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-semibold mb-1">No certificates found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
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
                    {paginatedCertificates.map((cert) => {
                      const isVerified = cert.verified === true;
                      const isRejected = cert.rejected === true;
                      const createdDate = cert.createdAt ? new Date(cert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                      
                      return (
                        <tr key={cert._id} className="hover:bg-emerald-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-emerald-700 font-mono font-semibold text-sm">{cert._id.slice(0, 12)}...</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{cert.title}</div>
                            {cert.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{cert.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                              {cert.type.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {createdDate}
                          </td>
                          <td className="px-6 py-4 text-center min-w-[140px]">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 px-3 py-1.5 rounded-full">
                                <XCircle className="w-3.5 h-3.5" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedCert(cert)}
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

              <div className="block md:hidden p-4 space-y-4">
                {paginatedCertificates.map((cert) => {
                  const isVerified = cert.verified === true;
                  const isRejected = cert.rejected === true;
                  const createdDate = cert.createdAt ? new Date(cert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                  
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
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Type</span>
                          <span className="text-sm font-medium text-gray-900">{cert.type.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
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
                        onClick={() => setSelectedCert(cert)}
                        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>

              {totalPages > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{(page - 1) * rowsPerPage + 1}</span> to <span className="font-semibold">{Math.min(page * rowsPerPage, filteredCertificates.length)}</span> of <span className="font-semibold">{filteredCertificates.length}</span> certificates
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 flex items-center gap-2 transition-colors font-medium"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 flex items-center gap-2 transition-colors font-medium"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {selectedCert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 lg:ml-64" onClick={() => {
          setSelectedCert(null);
          setDeathVerification(null);
          setWillDetails(null);
          setDeathCertHash("");
        }}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-emerald-600 px-6 py-4 border-b border-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCert.title}</h2>
                  <p className="text-emerald-100 text-sm mt-1 capitalize">{selectedCert.type.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCert(null);
                    setDeathVerification(null);
                    setWillDetails(null);
                    setDeathCertHash("");
                  }}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
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
                      <p className="text-sm font-mono text-gray-900">{selectedCert._id}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created By</p>
                      <p className="text-sm text-gray-900">{selectedCert.createdBy || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created At</p>
                      <p className="text-sm text-gray-900">{selectedCert.createdAt ? new Date(selectedCert.createdAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Updated At</p>
                      <p className="text-sm text-gray-900">{selectedCert.updatedAt ? new Date(selectedCert.updatedAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {selectedCert.verified ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified {selectedCert.verifiedAt ? `on ${new Date(selectedCert.verifiedAt).toLocaleDateString()}` : ''}
                    </span>
                  ) : selectedCert.rejected ? (
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
              {selectedCert.description && (
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedCert.description}</p>
                </div>
              )}
              
              {selectedCert.parties && selectedCert.parties.length > 0 && (
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Involved Parties
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCert.parties.map((p, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-600 mt-1">Role: {p.role}</p>
                        <p className="text-xs text-gray-600">Contact: {p.contact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedCert.data && Object.keys(selectedCert.data).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Data</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-auto">
                    <pre className="text-xs text-gray-700 font-mono">{JSON.stringify(selectedCert.data, null, 2)}</pre>
                  </div>
                </div>
              )}
              {selectedCert.type === "last_will" && selectedCert.tokenId && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Last Will Management
                  </h3>
                  
                  {willDetails && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Will Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Beneficiary</p>
                          <p className="text-sm text-blue-900 font-medium font-mono">{shortAddress(willDetails.beneficiary)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Status</p>
                          <p className="text-sm text-blue-900">{willDetails.isActive ? "Active" : "Inactive"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Executed</p>
                          <p className="text-sm text-blue-900">{willDetails.isExecuted ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Created At</p>
                          <p className="text-sm text-blue-900">{willDetails.createdAt ? new Date(willDetails.createdAt * 1000).toLocaleString() : "N/A"}</p>
                        </div>
                        {willDetails.executionDate > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Execution Date</p>
                            <p className="text-sm text-blue-900">{new Date(willDetails.executionDate * 1000).toLocaleString()}</p>
                          </div>
                        )}
                        {willDetails.ipfsHash && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">IPFS Hash</p>
                            <p className="text-sm text-blue-900 font-mono break-all">{willDetails.ipfsHash}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Witness Status</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <p className="text-xs text-blue-700 mb-1">Witness 1</p>
                            <p className="text-xs font-mono text-blue-900 mb-1">{shortAddress(willDetails.witness1)}</p>
                            <p className={`text-xs font-semibold ${
                              willDetails.witness1Status === 1 ? "text-green-700" :
                              willDetails.witness1Status === 2 ? "text-red-700" :
                              "text-yellow-700"
                            }`}>
                              {willDetails.witness1Status === 1 ? "Approved" :
                               willDetails.witness1Status === 2 ? "Rejected" :
                               "Pending"}
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <p className="text-xs text-blue-700 mb-1">Witness 2</p>
                            <p className="text-xs font-mono text-blue-900 mb-1">{shortAddress(willDetails.witness2)}</p>
                            <p className={`text-xs font-semibold ${
                              willDetails.witness2Status === 1 ? "text-green-700" :
                              willDetails.witness2Status === 2 ? "text-red-700" :
                              "text-yellow-700"
                            }`}>
                              {willDetails.witness2Status === 1 ? "Approved" :
                               willDetails.witness2Status === 2 ? "Rejected" :
                               "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {deathVerification && (
                    <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Death Verification Status
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Verified At</p>
                          <p className="text-sm text-amber-900">{new Date(deathVerification.verifiedAt * 1000).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Verified By</p>
                          <p className="text-sm font-mono text-amber-900">{shortAddress(deathVerification.verifiedBy)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Certificate Hash</p>
                          <p className="text-sm font-mono text-amber-900 break-all">{deathVerification.deathCertificateHash}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Waiting Period Ends</p>
                          <p className="text-sm text-amber-900">{new Date(deathVerification.waitingPeriodEnd * 1000).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className={`mt-3 pt-3 border-t border-amber-300 ${deathVerification.canExecute ? 'text-emerald-700' : 'text-amber-700'}`}>
                        <p className={`text-sm font-semibold flex items-center gap-2 ${deathVerification.canExecute ? 'text-emerald-700' : 'text-amber-700'}`}>
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
                  )}

                  {!deathVerification && (
                    <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Verify Owner Death
                      </h4>
                      <p className="text-sm text-red-800 mb-3">To execute this last will, you must first verify the owner's death with a death certificate.</p>
                      <input
                        type="text"
                        value={deathCertHash}
                        onChange={(e) => setDeathCertHash(e.target.value)}
                        placeholder="Enter death certificate hash (IPFS hash or document hash)"
                        className="w-full px-4 py-2 border border-red-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        onClick={handleVerifyDeath}
                        disabled={isVerifying || !deathCertHash.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {isVerifying ? "Verifying..." : "Verify Death"}
                      </button>
                    </div>
                  )}

                  {deathVerification && deathVerification.canExecute && willDetails && !willDetails.isExecuted && (
                    <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Execute Last Will
                      </h4>
                      <p className="text-sm text-emerald-800 mb-3">The waiting period has ended. You can now execute this last will to transfer the property to the beneficiary.</p>
                      <button
                        onClick={handleExecuteWill}
                        disabled={isExecuting}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {isExecuting ? "Executing..." : "Execute Last Will"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedCert(null);
                  setDeathVerification(null);
                  setWillDetails(null);
                  setDeathCertHash("");
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
              {selectedCert.type !== "last_will" && !selectedCert.verified && (
                <button
                  onClick={() => handleVerify(selectedCert._id)}
                  disabled={isVerifyingCert || selectedCert.rejected}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {isVerifyingCert ? (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default NotaryCertificates;
