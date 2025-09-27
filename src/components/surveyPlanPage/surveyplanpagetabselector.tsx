import { Calculator, FileText, Map } from "lucide-react"

const SurveyPlanPageTabSelector=({setActiveTab, activeTab}: {setActiveTab: (e: "map" | "details" | "summary")=> void, activeTab: "map" | "details" | "summary"})=>{
    return(
        <div className="bg-gray-800 rounded-xl shadow-2xl mb-4 sm:mb-6 border border-gray-700">
          <div className="flex overflow-x-auto">
            {[
              { key: 'map', label: 'Boundary Map', icon: Map, shortLabel: 'Map' },
              { key: 'details', label: 'Plan Details', icon: FileText, shortLabel: 'Details' },
              { key: 'summary', label: 'Summary', icon: Calculator, shortLabel: 'Summary' }
            ].map(({ key, label, icon: Icon, shortLabel }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 min-w-0 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === key
                    ? 'text-green-400 border-b-2 border-green-400 bg-gray-750'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
    )
}

export default SurveyPlanPageTabSelector;