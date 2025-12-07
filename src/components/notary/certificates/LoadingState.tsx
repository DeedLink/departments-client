import React from "react";

const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Loading certificates...</p>
      </div>
    </div>
  );
};

export default LoadingState;

