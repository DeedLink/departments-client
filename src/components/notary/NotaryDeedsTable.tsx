import { useState, useMemo, useEffect } from "react";
import { Search, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { Deed } from "../../types/deed";
import { getDeedBySurveyorWalletAddress } from "../../api/api";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import NotaryDeedPopup from "./NotaryDeedPopup";
import NotaryPlan from "./NotaryPlan";

const NotaryDeedsTable = () => {
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
        if (!account) return;
        const response = await getDeedBySurveyorWalletAddress("0x976ea74026e726554db657fa54763abd0c3a0aa9");
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

      <div className="hidden md:block overflow-x-auto p-4">
        <table className="w-full">
          <thead>
            <tr className="border border-gray-200 bg-green-50">
              <th className="px-4 py-3 text-left font-medium text-black">
                Deed Number
              </th>
              <th className="px-4 py-3 text-left font-medium text-black">
                Owner
              </th>
              <th className="px-4 py-3 text-left font-medium text-black">
                Land Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-black">
                Value (LKR)
              </th>
              <th className="px-4 py-3 text-center font-medium text-black">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedDeeds.map((deed) => (
              <tr
                key={deed.deedNumber}
                className="hover:bg-gray-50 text-black transition-colors"
              >
                <td className="px-4 py-3 text-green-600 font-mono font-medium">
                  {deed.deedNumber}
                </td>
                <td className="px-4 py-3">{deed.ownerFullName}</td>
                <td className="px-4 py-3">{deed.landType}</td>
                <td className="px-4 py-3 font-mono">
                  {deed.value.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => setSelectedDeed(deed)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                  >
                    <Eye className="w-3 h-3" /> Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDeeds.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No deeds found</p>
          <p className="text-black text-sm mt-1">
            Try adjusting your search criteria
          </p>
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
          <span className="text-black text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <NotaryDeedPopup deed={selectedDeed} onClose={() => setSelectedDeed(null)} />
      <NotaryPlan
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        points={points}
        sides={sides}
      />
    </div>
  );
};

export default NotaryDeedsTable;
