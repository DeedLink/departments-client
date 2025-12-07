import React from "react";

interface AdditionalDataSectionProps {
  data: Record<string, any>;
}

const AdditionalDataSection: React.FC<AdditionalDataSectionProps> = ({ data }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Data</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-auto">
        <pre className="text-xs text-gray-700 font-mono">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AdditionalDataSection;

