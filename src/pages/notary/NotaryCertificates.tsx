import React, { useEffect, useState, useMemo } from "react";
import { getAllCertificates, verifyCertificate } from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import type { Certificate } from "../../components/notary/certificates/types";
import LoadingState from "../../components/notary/certificates/LoadingState";
import ErrorState from "../../components/notary/certificates/ErrorState";
import SearchAndFilters from "../../components/notary/certificates/SearchAndFilters";
import CertificatesTable from "../../components/notary/certificates/CertificatesTable";
import CertificatesMobileList from "../../components/notary/certificates/CertificatesMobileList";
import Pagination from "../../components/notary/certificates/Pagination";
import CertificateModal from "../../components/notary/certificates/CertificateModal";
import EmptyState from "../../components/notary/certificates/EmptyState";

const NotaryCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    const types = new Set(certificates.map((cert) => cert.type));
    return Array.from(types);
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch =
        cert.title.toLowerCase().includes(search.toLowerCase()) ||
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
  const paginatedCertificates = filteredCertificates.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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

  const handleCloseModal = () => {
    setSelectedCert(null);
  };

  if (loading) return <LoadingState />;

  if (error) return <ErrorState error={error} onRetry={fetchCertificates} />;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Certificate Management
          </h1>
          <p className="text-gray-600">Review, verify, and manage assigned certificates</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <SearchAndFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              certificateTypes={certificateTypes}
            />
          </div>

          {filteredCertificates.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <CertificatesTable
                certificates={paginatedCertificates}
                onViewDetails={setSelectedCert}
              />
              <CertificatesMobileList
                certificates={paginatedCertificates}
                onViewDetails={setSelectedCert}
              />

              {totalPages > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filteredCertificates.length}
                  itemsPerPage={rowsPerPage}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={handleCloseModal}
          onVerify={handleVerify}
          isVerifying={isVerifyingCert}
        />
      )}
    </div>
  );
};

export default NotaryCertificates;
