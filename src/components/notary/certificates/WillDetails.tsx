import React from "react";
import { shortAddress } from "../../../utils/formatCurrency";

interface WillDetailsProps {
  willDetails: {
    beneficiary: string;
    witness1: string;
    witness2: string;
    createdAt: number;
    executionDate: number;
    isActive: boolean;
    isExecuted: boolean;
    ipfsHash?: string;
    witness1Status: number;
    witness2Status: number;
  };
}

const WillDetails: React.FC<WillDetailsProps> = ({ willDetails }) => {
  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3">Will Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Beneficiary</p>
          <p className="text-sm text-blue-900 font-medium font-mono">
            {shortAddress(willDetails.beneficiary)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Status</p>
          <p className="text-sm text-blue-900">{willDetails.isActive ? "Active" : "Inactive"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Executed</p>
          <p className="text-sm text-blue-900">{willDetails.isExecuted ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Created At</p>
          <p className="text-sm text-blue-900">
            {willDetails.createdAt
              ? new Date(willDetails.createdAt * 1000).toLocaleString()
              : "N/A"}
          </p>
        </div>
        {willDetails.executionDate > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Execution Date</p>
            <p className="text-sm text-blue-900">
              {new Date(willDetails.executionDate * 1000).toLocaleString()}
            </p>
          </div>
        )}
        {willDetails.ipfsHash && (
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">IPFS Hash</p>
            <p className="text-sm text-blue-900 font-mono break-all">{willDetails.ipfsHash}</p>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-blue-300">
        <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Witness Status</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-2 rounded border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Witness 1</p>
            <p className="text-xs font-mono text-blue-900 mb-1">
              {shortAddress(willDetails.witness1)}
            </p>
            <p
              className={`text-xs font-semibold ${
                willDetails.witness1Status === 1
                  ? "text-green-700"
                  : willDetails.witness1Status === 2
                  ? "text-red-700"
                  : "text-yellow-700"
              }`}
            >
              {willDetails.witness1Status === 1
                ? "Signed"
                : willDetails.witness1Status === 2
                ? "Rejected"
                : "Pending"}
            </p>
          </div>
          <div className="bg-white p-2 rounded border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Witness 2</p>
            <p className="text-xs font-mono text-blue-900 mb-1">
              {shortAddress(willDetails.witness2)}
            </p>
            <p
              className={`text-xs font-semibold ${
                willDetails.witness2Status === 1
                  ? "text-green-700"
                  : willDetails.witness2Status === 2
                  ? "text-red-700"
                  : "text-yellow-700"
              }`}
            >
              {willDetails.witness2Status === 1
                ? "Signed"
                : willDetails.witness2Status === 2
                ? "Rejected"
                : "Pending"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WillDetails;

