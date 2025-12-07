import React from "react";
import { Shield } from "lucide-react";

interface ExecuteWillButtonProps {
  onExecute: () => void;
  isExecuting: boolean;
}

const ExecuteWillButton: React.FC<ExecuteWillButtonProps> = ({ onExecute, isExecuting }) => {
  return (
    <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
      <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Execute Last Will
      </h4>
      <p className="text-sm text-emerald-800 mb-3">
        The waiting period has ended. You can now execute this last will to transfer the property to
        the beneficiary.
      </p>
      <button
        onClick={onExecute}
        disabled={isExecuting}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {isExecuting ? "Executing..." : "Execute Last Will"}
      </button>
    </div>
  );
};

export default ExecuteWillButton;

