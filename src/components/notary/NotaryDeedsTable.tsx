import { useState, useMemo, useEffect } from "react";
import { Search, Eye, FileText, ChevronLeft, ChevronRight, CheckCircle2, Clock, Shield } from "lucide-react";
import type { Deed } from "../../types/deed";
import { getDeedByNotaryorWalletAddress } from "../../api/api";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import NotaryDeedPopup from "./NotaryDeedPopup";
import { formatToETH } from "../../utils/formatCurrency";

const NotaryDeedsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const { account } = useWallet();
  const { showToast } = useToast();

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchDeeds = async () => {
      try {
        if (!account) return;
        const response = await getDeedByNotaryorWalletAddress(account);
        setDeeds(response);
      } catch {
        showToast("Failed to load deeds for notary", "error");
      }
    };
    fetchDeeds();
  }, [account]);

  const filteredDeeds = useMemo(() => {
    return deeds.filter(
      (deed) =>
        deed.ownerFullName.toLowerCase().includes(search.toLowerCase()) ||
        deed.deedNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, deeds]);

  const totalPages = Math.ceil(filteredDeeds.length / rowsPerPage);
  const paginatedDeeds = filteredDeeds.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const getLatestValuation = (deed: Deed) => {
    if (deed.valuation && deed.valuation.length > 0) {
      return deed.valuation.slice().sort((a, b) => b.timestamp - a.timestamp)[0];
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by owner or deed number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-emerald-600 border-b-2 border-emerald-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Deed Number</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Owner</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Land Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Value (ETH)</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider min-w-[160px]">Verification Status</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedDeeds.map((deed) => {
              const latestValuation = getLatestValuation(deed);
              const isSigned = !!deed.notarySignature;
              const hasSurveyorSig = !!deed.surveySignature;
              const regDate = deed.registrationDate ? new Date(deed.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
              
              return (
                <tr key={deed.deedNumber} className="hover:bg-emerald-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-emerald-700 font-mono font-semibold text-sm">{deed.deedNumber}</span>
                      <span className="text-xs text-gray-500">{regDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{deed.ownerFullName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                      {deed.landType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono font-semibold text-gray-900">{formatToETH(latestValuation?.estimatedValue ?? null)}</span>
                      <span className="text-xs text-gray-500">Req: {formatToETH(latestValuation?.requestedValue ?? null)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center min-w-[160px]">
                    <div className="flex flex-col items-center gap-2">
                      {isSigned ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-full">
                          <Shield className="w-3.5 h-3.5" />
                          Notarized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {hasSurveyorSig ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Surveyor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            Surveyor
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedDeed(deed)}
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

      <div className="md:hidden p-4 flex flex-col gap-4">
        {paginatedDeeds.map((deed) => {
          const latestValuation = getLatestValuation(deed);
          const isSigned = !!deed.notarySignature;
          const hasSurveyorSig = !!deed.surveySignature;
          const regDate = deed.registrationDate ? new Date(deed.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
          
          return (
            <div key={deed.deedNumber} className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-emerald-700 font-mono text-base">{deed.deedNumber}</h3>
                  </div>
                  <p className="text-xs text-gray-500">Registered: {regDate}</p>
                </div>
                <span className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 px-2 py-1 rounded">{deed.landType}</span>
              </div>
              
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Owner</span>
                  <span className="text-sm font-semibold text-gray-900">{deed.ownerFullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Value</span>
                  <span className="text-sm font-mono font-semibold text-emerald-700">{formatToETH(latestValuation?.estimatedValue ?? null)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Requested Value</span>
                  <span className="text-sm font-mono text-gray-700">{formatToETH(latestValuation?.requestedValue ?? null)}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Verification Status</span>
                  {isSigned ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                      <Shield className="w-3 h-3" />
                      Notarized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasSurveyorSig ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Surveyor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      Surveyor
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedDeed(deed)}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {filteredDeeds.length === 0 && (
        <div className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold mb-1">No deeds found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search criteria or check back later</p>
        </div>
      )}

      {totalPages > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{(page - 1) * rowsPerPage + 1}</span> to <span className="font-semibold">{Math.min(page * rowsPerPage, filteredDeeds.length)}</span> of <span className="font-semibold">{filteredDeeds.length}</span> deeds
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

      <NotaryDeedPopup deed={selectedDeed} onClose={() => setSelectedDeed(null)} />
    </div>
  );
};

export default NotaryDeedsTable;
