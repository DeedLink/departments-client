import React from "react";
import { FileText } from "lucide-react";

const EmptyState: React.FC = () => {
  return (
    <div className="p-12 text-center">
      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-700 text-lg font-semibold mb-1">No certificates found</p>
      <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
    </div>
  );
};

export default EmptyState;

