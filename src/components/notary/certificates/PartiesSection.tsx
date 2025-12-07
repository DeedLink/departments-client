import React from "react";
import { User } from "lucide-react";
import type { Party } from "./types";

interface PartiesSectionProps {
  parties: Party[];
}

const PartiesSection: React.FC<PartiesSectionProps> = ({ parties }) => {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <User className="w-5 h-5 text-emerald-600" />
        Involved Parties
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {parties.map((p, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-600 mt-1">Role: {p.role}</p>
            <p className="text-xs text-gray-600">Contact: {p.contact}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartiesSection;

