import { ClipboardList, Clock, MessageSquare } from "lucide-react";
import React, { useState } from "react";
import { useLogin } from "../contexts/LoginContext";

const Services: React.FC = () => {

    const [activeTab, setActiveTab] = useState<"activities" | "history" | "messages">("activities");
    const {user} = useLogin();

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Surveyor Services</h1>
                    <p className="text-black">Access and manage your blockchain-integrated field services</p>
                </div>

                <div className="">
                    {[
                        {id: "activities" , label: "Activities", icon: ClipboardList},
                        {id: "history" , label: "History", icon: Clock},
                        {id: "messages" , label: "Messages", icon: MessageSquare},

                    ].map((tab)=>{
                        const icon = tab.icon;
                        const isActive = activeTab ===tab.id;

                        return(
                            
                        )
                    })
                    }
                </div>
            </div>

        </div>
    )
}

export default Services;
