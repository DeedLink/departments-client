import React from "react";
import { Search, Filter, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";

interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "all" | "verified" | "pending" | "rejected";
  onStatusFilterChange: (filter: "all" | "verified" | "pending" | "rejected") => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
  certificateTypes: string[];
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  certificateTypes,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by title, description, or certificate ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onStatusFilterChange("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => onStatusFilterChange("verified")}
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
              onClick={() => onStatusFilterChange("pending")}
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
              onClick={() => onStatusFilterChange("rejected")}
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
              onChange={(e) => onTypeFilterChange(e.target.value)}
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
  );
};

export default SearchAndFilters;

