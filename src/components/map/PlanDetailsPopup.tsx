import { X, FileText, Calendar, MapPin, User, Hash } from "lucide-react";
import type { Plan } from "../../types/plan";
import type { Deed } from "../../types/deed";

interface PlanDetailsPopupProps {
  plan: Plan;
  deed?: Deed | null;
  loading?: boolean;
  onClose: () => void;
}

const PlanDetailsPopup = ({ plan, deed, loading = false, onClose }: PlanDetailsPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 lg:ml-64" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Plan Details</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Plan Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Plan ID</p>
                  <p className="text-sm font-mono text-gray-900">{plan.planId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deed Number</p>
                  <p className="text-sm font-mono text-gray-900">{plan.deedNumber}</p>
                </div>
                {plan.areaSize && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Area Size</p>
                    <p className="text-sm text-gray-900">
                      {plan.areaSize} {plan.areaType}
                    </p>
                  </div>
                )}
                {plan.status && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      plan.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      plan.status === "completed" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                )}
                {plan.createdAt && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created At
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(plan.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {plan.createdBy && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Created By
                    </p>
                    <p className="text-sm text-gray-900">{plan.createdBy}</p>
                  </div>
                )}
              </div>
            </div>

            {plan.sides && (plan.sides.North || plan.sides.South || plan.sides.East || plan.sides.West) && (
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Boundaries
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {plan.sides.North && (
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">North</p>
                      <p className="text-sm text-gray-900">{plan.sides.North}</p>
                    </div>
                  )}
                  {plan.sides.South && (
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">South</p>
                      <p className="text-sm text-gray-900">{plan.sides.South}</p>
                    </div>
                  )}
                  {plan.sides.East && (
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">East</p>
                      <p className="text-sm text-gray-900">{plan.sides.East}</p>
                    </div>
                  )}
                  {plan.sides.West && (
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">West</p>
                      <p className="text-sm text-gray-900">{plan.sides.West}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  Related Deed Information
                </h3>
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-sm text-gray-600">Loading deed details...</span>
                </div>
              </div>
            ) : deed ? (
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  Related Deed Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Owner</p>
                    <p className="text-sm text-gray-900">{deed.ownerFullName}</p>
                  </div>
                  {deed.landType && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Land Type</p>
                      <p className="text-sm text-gray-900">{deed.landType}</p>
                    </div>
                  )}
                  {deed.district && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">District</p>
                      <p className="text-sm text-gray-900">{deed.district}</p>
                    </div>
                  )}
                  {deed.division && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Division</p>
                      <p className="text-sm text-gray-900">{deed.division}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {plan.details && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Additional Details</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{plan.details}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailsPopup;

