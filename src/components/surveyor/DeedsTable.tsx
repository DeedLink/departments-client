import { useState, useMemo } from "react";
import DeedPopup from "./DeedPopup";
import type { Deed } from "../../types/deed";
import { mockDeeds } from "../../constants/deeds";

const DeedsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const rowsPerPage = 10;

  const filteredDeeds = useMemo(() => {
    return mockDeeds.filter((deed) => {
      const matchesSearch =
        deed.ownerFullName.toLowerCase().includes(search.toLowerCase()) ||
        deed.deedNumber.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [search]);

  const totalPages = Math.ceil(filteredDeeds.length / rowsPerPage);
  const paginatedDeeds = filteredDeeds.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSign = (deed: Deed) => {
    console.log('Signing deed:', deed.deedNumber);
  };

  const handleReject = (deed: Deed) => {
    console.log('Rejecting deed:', deed.deedNumber);
  };

  const handleSignAndPass = (deed: Deed) => {
    console.log('Signing and passing deed:', deed.deedNumber);
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or deed number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />
      </div>

      <table className="w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Deed Number</th>
            <th className="p-2 border">Owner</th>
            <th className="p-2 border">Land Type</th>
            <th className="p-2 border">Value</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDeeds.map((deed) => (
            <tr key={deed.deedNumber} className="text-center">
              <td className="p-2 border">{deed.deedNumber}</td>
              <td className="p-2 border">{deed.ownerFullName}</td>
              <td className="p-2 border">{deed.landType}</td>
              <td className="p-2 border">{deed.value.toLocaleString()}</td>
              <td className="p-2 border">
                <button
                  onClick={() => setSelectedDeed(deed)}
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
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
    </div>
  );
};

export default DeedsTable;
