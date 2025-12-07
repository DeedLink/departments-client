import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-red-600 font-semibold">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default ErrorState;

