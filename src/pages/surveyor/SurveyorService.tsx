
import { CheckCircle, Clock, MessageSquare, Upload } from "lucide-react";


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

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Surveyor Services</h1>
                    <p className="text-black">Access and manage your blockchain-integrated field services</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 sm:mb-0">Activity & History</h2>
                </div>
            </div>

        </div>
    )
}

export default SurveyorServices;
