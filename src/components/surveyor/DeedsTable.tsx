import { useState, useMemo } from "react";
import DeedPopup from "./DeedPopup";

const mockDeeds: any[] = [
  { id: 1, user: "Alice", deedName: "Deed A", status: "Signed", date: "2025-09-01" },
  { id: 2, user: "Bob", deedName: "Deed B", status: "Not Signed", date: "2025-09-05" },
  { id: 3, user: "Charlie", deedName: "Deed C", status: "Rejected", date: "2025-09-10" },
  { id: 4, user: "Alice", deedName: "Deed D", status: "Signed", date: "2025-09-12" },
  { id: 5, user: "Bob", deedName: "Deed E", status: "Not Signed", date: "2025-09-14" },
];

const DeedsTable = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Signed" | "Not Signed" | "Rejected">("All");
  const [page, setPage] = useState(1);
  const [selectedDeed, setSelectedDeed] = useState<any | null>(null); // popup state
  const rowsPerPage = 3;

  const filteredDeeds = useMemo(() => {
    return mockDeeds.filter((deed) => {
      const matchesSearch =
        deed.user.toLowerCase().includes(search.toLowerCase()) ||
        deed.deedName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : deed.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredDeeds.length / rowsPerPage);
  const paginatedDeeds = filteredDeeds.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by user or deed..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border px-3 py-2 rounded w-full md:w-1/4"
        >
          <option value="All">All Status</option>
          <option value="Signed">Signed</option>
          <option value="Not Signed">Not Signed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <table className="w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">User</th>
            <th className="p-2 border">Deed</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDeeds.map((deed) => (
            <tr key={deed.id} className="text-center">
              <td className="p-2 border">{deed.id}</td>
              <td className="p-2 border">{deed.user}</td>
              <td className="p-2 border">{deed.deedName}</td>
              <td
                className={`p-2 border font-medium ${
                  deed.status === "Signed"
                    ? "text-green-600"
                    : deed.status === "Rejected"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {deed.status}
              </td>
              <td className="p-2 border">{deed.date}</td>
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

      <DeedPopup deed={selectedDeed} onClose={() => setSelectedDeed(null)} />
    </div>
  );
};

export default DeedsTable;
