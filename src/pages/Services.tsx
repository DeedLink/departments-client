import { ClipboardList, Clock, MessageSquare } from "lucide-react";
import React, { useState } from "react";


const Services: React.FC = () => {

    const [activeTab, setActiveTab] = useState<"activities" | "history" | "messages">("activities");
    

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Surveyor Services</h1>
                    <p className="text-black">Access and manage your blockchain-integrated field services</p>
                </div>

                <div className="flex justify-center gap-18 bg-white shadow-md rounded-b-2xl sticky top-0 z-40 w-full py-1">
                    {[
                        {id: "activities" , label: "Activities", icon: ClipboardList},
                        {id: "history" , label: "History", icon: Clock},
                        {id: "messages" , label: "Messages", icon: MessageSquare},

                    ].map((tab)=>{
                        const Icon = tab.icon;
                        const isActive = activeTab ===tab.id;

                        return(
                            <button key={tab.id} onClick={()=> setActiveTab(tab.id as any)}
                           className={`flex items-center rounded-lg px-2 py-1 transition-all duration-200 ${
                            isActive ? "bg-emerald-500 text-gray-50 shadow-lg scale-105":
                            "bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700"
                           } `}>
                            
                                <Icon size={18}/>
                                {tab.label}
                            </button>


                        )
                    })
                    }

                </div>

            
            </div>

        </div>
    )
}

export default Services;
