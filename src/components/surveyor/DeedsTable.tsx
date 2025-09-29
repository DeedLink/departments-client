import { useState, useMemo, useEffect } from "react";
import { Search, Eye, Map, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { Deed } from "../../types/deed";
import SurveyPlan from "./SurveyPlan";
import { getDeedBySurveyorWalletAddress, getPlanByPlanNumber } from "../../api/api";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import DeedPopup from "./DeedPopup";

const DeedsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [surveyPoints, setSurveyPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [sidesOfTheDeed, setSidesOfTheDeed] = useState<Deed["sides"] | undefined>(undefined);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const { account } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchDeeds = async () => {
      try {
        const response = await getDeedBySurveyorWalletAddress(account || "");
        setDeeds(response);
        //console.log("deeds: ", response);
      } catch (error) {
        console.error("Error fetching deeds:", error);
      }
    };

    fetchDeeds();
  }, [account]);

  const filteredDeeds = useMemo(() => {
    return deeds.filter((deed) => {
      const matchesSearch =
        deed.ownerFullName.toLowerCase().includes(search.toLowerCase()) ||
        deed.deedNumber.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [search, account, deeds]);

  const totalPages = Math.ceil(filteredDeeds.length / rowsPerPage);
  const paginatedDeeds = filteredDeeds.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleOpenSurvey = async(deed: Deed) => {
    if (deed.surveyPlanNumber) {
      try{
        const res = await getPlanByPlanNumber(deed.surveyPlanNumber);
        if(res.success){
          setSurveyPoints(res.data.coordinates);
          setIsSurveyOpen(true);
          setSidesOfTheDeed(res.data.sides);
        }
      }
      catch{
        showToast("Error getting plan", "error");
      }
    } else {
      showToast("No survey plan available for this deed.", "error");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Searwhitech by name or deed number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
          />
        </div>
      </div>
      
      <div className="block md:hidden p-4 space-y-4">
        {paginatedDeeds.map((deed) => (
          <div key={deed.deedNumber} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-green-600 font-mono">{deed.deedNumber}</h3>
              <span className="text-xs text-gray-600 px-2 py-1 bg-gray-200 rounded-full">{deed.landType}</span>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p className="text-black"><span className="text-black font-medium">Owner:</span> {deed.ownerFullName}</p>
              <p className="text-black"><span className="text-black font-medium">Value:</span> LKR {deed.value.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedDeed(deed)}
                className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                Open Details
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenSurvey(deed)}
                  className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Map className="w-4 h-4" />
                  View Plan
                </button>
                <button
                  onClick={() => navigate(`/surveyor/plan/${deed.deedNumber}`)}
                  className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Survey
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto p-4">
        <table className="w-full">
          <thead className="">
            <tr className="border border-gray-200 bg-green-50">
              <th className="px-4 py-3 text-left font-medium text-black">Deed Number</th>
              <th className="px-4 py-3 text-left font-medium text-black">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-black">Land Type</th>
              <th className="px-4 py-3 text-left font-medium text-black">Value (LKR)</th>
              <th className="px-4 py-3 text-center font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedDeeds.map((deed) => (
              <tr key={deed.deedNumber} className="hover:bg-gray-50 hover:text-black text-black transition-colors">
                <td className="px-4 py-3 text-green-600 font-mono font-medium">{deed.deedNumber}</td>
                <td className="px-4 py-3">{deed.ownerFullName}</td>
                <td className="px-4 py-3">{deed.landType}</td>
                <td className="px-4 py-3font-mono">{deed.value.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setSelectedDeed(deed)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                      title="Open Details"
                    >
                      <Eye className="w-3 h-3" />
                      Open
                    </button>
                    <button
                      onClick={() => handleOpenSurvey(deed)}
                      className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                      title="View Survey Plan"
                    >
                      <Map className="w-3 h-3" />
                      Plan
                    </button>
                    <button
                      onClick={() => navigate(`/surveyor/plan/${deed.deedNumber}`)}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                      title="Create Survey"
                    >
                      <FileText className="w-3 h-3" />
                      Survey
                    </button>
                  </div>
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
          <p className="text-black text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}

      {totalPages > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-0 disabled:cursor-not-allowed text-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-black text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <span className="text-black text-xs">
                ({filteredDeeds.length} total)
              </span>
            </div>
            
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-0 disabled:cursor-not-allowed text-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <DeedPopup
        deed={selectedDeed}
        onClose={() => setSelectedDeed(null)}
      />

      <SurveyPlan
        points={surveyPoints}
        sides={sidesOfTheDeed}
        isOpen={isSurveyOpen}
        onClose={() => setIsSurveyOpen(false)}
      />
    </div>
  );
};

export default DeedsTable;