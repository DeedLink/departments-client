import { useState, useMemo, useEffect } from "react";
import { Search, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { Deed } from "../../types/deed";
import { getDeedByIVSLWalletAddress, getPlanByPlanNumber } from "../../api/api";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import IVSLDeedPopup from "./IVSLDeedPopup";
import { formatToETH } from "../../utils/formatCurrency";
import IVSLPlan from "./IVSLPlan";

const IVSLDeedsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const { account } = useWallet();
  const { showToast } = useToast();
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [sides, setSides] = useState();
  const [points, setPoints] = useState([]);

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchDeeds = async () => {
      try {
        const response = await getDeedByIVSLWalletAddress(account || "");
        setDeeds(response);
      } catch {
        showToast("Failed to load deeds", "error");
      }
    };
    fetchDeeds();
  }, [account]);

  const filteredDeeds = useMemo(() => {
    return deeds.filter((deed) =>
      deed.ownerFullName.toLowerCase().includes(search.toLowerCase()) ||
      deed.deedNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, deeds]);

  const totalPages = Math.ceil(filteredDeeds.length / rowsPerPage);
  const paginatedDeeds = filteredDeeds.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewPlan = async (deed: Deed) => {
    if (!deed.surveyPlanNumber) {
      showToast("No survey plan available for this deed.", "error");
      return;
    }
    try {
      const res = await getPlanByPlanNumber(deed.surveyPlanNumber);
      if (res.success) {
        showToast(`Survey plan fetched with ${res.data.coordinates.length} points`, "success");
        setPoints(res.data.coordinates);
        setSides(res.data.sides);
        setIsPlanOpen(true);
      }
    } catch {
      showToast("Error fetching survey plan", "error");
    }
  };

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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by owner or deed number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto p-4">
        <table className="w-full">
          <thead>
            <tr className="border border-gray-200 bg-green-50">
              <th className="px-4 py-3 text-left font-medium text-black">Deed Number</th>
              <th className="px-4 py-3 text-left font-medium text-black">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-black">Land Type</th>
              <th className="px-4 py-3 text-left font-medium text-black">Requested (ETH)</th>
              <th className="px-4 py-3 text-left font-medium text-black">Estimated (ETH)</th>
              <th className="px-4 py-3 text-center font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedDeeds.map((deed) => {
              const latestValuation = getLatestValuation(deed);
              return (
                <tr key={deed.deedNumber} className="hover:bg-gray-50 text-black transition-colors">
                  <td className="px-4 py-3 text-green-600 font-mono font-medium">{deed.deedNumber}</td>
                  <td className="px-4 py-3">{deed.ownerFullName}</td>
                  <td className="px-4 py-3">{deed.landType}</td>
                  <td className="px-4 py-3 font-mono">{formatToETH(latestValuation?.requestedValue ?? null)}</td>
                  <td className="px-4 py-3 font-mono">{formatToETH(latestValuation?.estimatedValue ?? null)}</td>
                  <td className="px-4 py-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => setSelectedDeed(deed)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3 h-3" /> Open
                    </button>
                    <button
                      onClick={() => handleViewPlan(deed)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm"
                    >
                      View Plan
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
          return (
            <div key={deed.deedNumber} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-mono font-semibold text-green-600">#{deed.deedNumber}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDeed(deed)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                  >
                    <Eye className="w-4 h-4" /> Open
                  </button>
                  <button
                    onClick={() => handleViewPlan(deed)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm"
                  >
                    View Plan
                  </button>
                </div>
              </div>
              <p><span className="font-semibold">Owner:</span> {deed.ownerFullName}</p>
              <p><span className="font-semibold">Land Type:</span> {deed.landType}</p>
              <p><span className="font-semibold">Requested:</span> {formatToETH(latestValuation?.requestedValue ?? null)}</p>
              <p><span className="font-semibold">Estimated:</span> {formatToETH(latestValuation?.estimatedValue ?? null)}</p>
            </div>
          );
        })}
      </div>

      {filteredDeeds.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No deeds found</p>
          <p className="text-black text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}

      {totalPages > 0 && (
        <div className="p-4 border-t border-gray-200 flex justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-black text-sm font-medium">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <IVSLDeedPopup deed={selectedDeed} onClose={() => setSelectedDeed(null)} />
      <IVSLPlan isOpen={isPlanOpen} onClose={() => setIsPlanOpen(false)} points={points} sides={sides} />
    </div>
  );
};

export default IVSLDeedsTable;
