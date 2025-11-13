import { Calendar, FileText, Map, Save } from "lucide-react";
import type { Plan } from "../../types/plan";

const SurveyPlanPageHeader=({handleSave, isSaving, isNew, deedNumber, plan}: {handleSave: ()=>void, isSaving: boolean, isNew: boolean, deedNumber: string | undefined, plan:Plan})=>{
    const getFullPlanId = () => {
      if (!plan.planId) return '';
      return 'DeedLinkPlan-' + plan.planId;
    };
    
    return(
        <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isNew ? "Create New Survey Plan" : "Edit Survey Plan"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-green-500" />
                  Deed: {deedNumber}
                </span>
                {plan.planId && (
                  <span className="flex items-center gap-1">
                    <Map className="w-4 h-4 text-green-500" />
                    Plan: {getFullPlanId()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-green-500" />
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white px-4 sm:px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{isNew ? "Create Plan" : "Update Plan"}</span>
                  <span className="sm:hidden">{isNew ? "Create" : "Update"}</span>
                </>
              )}
            </button>
          </div>
        </div>
    )
}

export default SurveyPlanPageHeader;