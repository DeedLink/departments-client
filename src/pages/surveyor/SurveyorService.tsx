
import { CheckCircle, Clock, MessageSquare, Upload } from "lucide-react";
import { useState } from "react";


const activitiesData = [
    {
        id: 1,
        type: "Verification",
        title: "Verified Deed #D-001",
        time: "3 hours ago",
        icon: <CheckCircle className="text-green-500" size={20} />,
    },
    {
        id: 2,
        type: "Report",
        title: "Uploaded Report #R-011",
        time: "1 day ago",
        icon: <Upload className="text-blue-500" size={20} />,
    },
    {
        id: 3,
        type: "Communication",
        title: "Replied to Notary Silva",
        time: "1 day ago",
        icon: <MessageSquare className="text-purple-500" size={20} />,
    },
    {
        id: 4,
        type: "Verification",
        title: "Reviewed Request #REQ-12",
        time: "2 days ago",
        icon: <Clock className="text-orange-400" size={20} />,
    },
];

function SurveyorServices() {

    const [filter, setFilter] = useState("All");

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Surveyor Services</h1>
                    <p className="text-black">Access and manage your blockchain-integrated field services</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 sm:mb-0 py-2">Activity & History</h2>
                    <select className=" border border-emerald-300 rounded-xl px-3 py-2 text-gray-800 font-medium
                        bg-gradient-to-r from-emerald-50 to-green-50 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02]
                        focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-opacity-40" value={filter}
                        onChange={(e)=> setFilter(e.target.value)}>
                            
                        <option>All</option>
                        <option>Verification</option>
                        <option>Report</option>
                        <option>Communication</option>

                    </select>

                </div>
            </div>

        </div>
    )
}

export default SurveyorServices;
