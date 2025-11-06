import { label } from "framer-motion/client";
import { ClipboardList, Clock, MessageSquare } from "lucide-react";
import React, { useState } from "react";


const Services: React.FC = () => {

    const [activeTab, setActiveTab] = useState<"activities" | "history" | "messages">("activities");
    const [messageFilterMode, setMessageFilterMode] = useState <"all" | "read" | "unread">("all");

    const messageModes = [
        
        {id: "all" , label: "All"},
        {id: "read" , label: "Read"},
        {id: "unread" , label: "Unread"},
    ];


    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Surveyor Services</h1>
                    <p className="text-black">Access and manage your blockchain-integrated field services</p>
                </div>

                <div className="flex justify-start gap-3 bg-white shadow-md rounded-2xl sticky top-0 z-40 w-full p-3">
                    {[
                        { id: "activities", label: "Activities", icon: ClipboardList },
                        { id: "history", label: "History", icon: Clock },
                        { id: "messages", label: "Messages", icon: MessageSquare },

                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all duration-200 ${isActive ? "bg-emerald-500 text-gray-50 shadow-lg scale-105" :
                                    "bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700"
                                    } `}>

                                <Icon size={18} />
                                {tab.label}
                            </button>


                        )
                    })
                    }

                </div>
                <div className="w-full border rounded-lg bg-gradient-to-r from-gray-50 to-emerald-50 border-emerald-100 p-2xl mt-6 h-screen">
                    <div className="p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                        <div className="flex flex-row justify-end">
                            <div>
                                <button className="border rounded-lg bg-emerald-500 text-gray-50 shadow-lg">
                                    <a href="">All</a>
                                </button>
                            </div>
                        </div>



                    </div>
                </div>

            </div>

        </div>
    )
}

export default Services;
