import { useState, useMemo, useEffect } from "react";
import DeedPopup from "./DeedPopup";
import type { Deed } from "../../types/deed";
import SurveyPlan from "./SurveyPlan";
import { getDeedBySurveyorWalletAddress } from "../../api/api";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

const DeedsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [surveyPoints, setSurveyPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [sidesOfTheDeed, setSidesOfTheDeed] = useState<Deed["sides"] | undefined>(undefined);
  const [ deeds, setDeeds ] = useState<Deed[]>([]);
  const { account } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchDeeds = async () => {
      try {
        const response = await getDeedBySurveyorWalletAddress(account || "");
        setDeeds(response);
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

  const handleSign = (deed: Deed) => {
    console.log("Signing deed:", deed.deedNumber);
  };

  const handleReject = (deed: Deed) => {
    console.log("Rejecting deed:", deed.deedNumber);
  };

  const handleSignAndPass = (deed: Deed) => {
    console.log("Signing and passing deed:", deed.deedNumber);
  };

  const handleOpenSurvey = (deed: Deed) => {
    if (deed.location && deed.location.length > 0) {
      setSurveyPoints(deed.location);
      setIsSurveyOpen(true);
      setSidesOfTheDeed(deed.sides);
    } else {
      showToast("No survey plan available for this deed.", "error");
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-white shadow rounded-lg">
      <div className="flex flex-col gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or deed number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full text-sm"
        />
      </div>
      
      <div className="block md:hidden space-y-3">
        {paginatedDeeds.map((deed) => (
          <div key={deed.deedNumber} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm">{deed.deedNumber}</h3>
              <span className="text-xs text-gray-500">{deed.landType}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-700 mb-3">
              <p><strong>Owner:</strong> {deed.ownerFullName}</p>
              <p><strong>Value:</strong> {deed.value.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedDeed(deed)}
                className="w-full px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                Open Details
              </button>
              <button
                onClick={() => handleOpenSurvey(deed)}
                className="w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
              >
                View Survey
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">Deed Number</th>
              <th className="p-3 border text-left">Owner</th>
              <th className="p-3 border text-left">Land Type</th>
              <th className="p-3 border text-left">Value</th>
              <th className="p-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDeeds.map((deed) => (
              <tr key={deed.deedNumber} className="hover:bg-gray-50">
                <td className="p-3 border">{deed.deedNumber}</td>
                <td className="p-3 border">{deed.ownerFullName}</td>
                <td className="p-3 border">{deed.landType}</td>
                <td className="p-3 border">{deed.value.toLocaleString()}</td>
                <td className="p-3 border">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setSelectedDeed(deed)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleOpenSurvey(deed)}
                      className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                    >
                      Plan
                    </button>
                    <button
                      onClick={() => navigate(`/surveyor/plan/${deed._id}`)}
                      className="px-3 py-1 rounded bg-yellow-600 text-white hover:bg-green-700 text-sm"
                    >
                      Survey
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="w-full sm:w-auto px-4 py-2 border rounded disabled:opacity-50 text-sm"
        >
          Previous
        </button>
        <span className="text-sm px-2">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="w-full sm:w-auto px-4 py-2 border rounded disabled:opacity-50 text-sm"
        >
          Next
        </button>
      </div>

      <DeedPopup
        deed={selectedDeed}
        onClose={() => setSelectedDeed(null)}
        onSign={handleSign}
        onReject={handleReject}
        onSignAndPass={handleSignAndPass}
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