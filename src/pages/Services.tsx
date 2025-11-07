import { ClipboardList, Clock, MessageSquare } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLogin } from "../contexts/LoginContext";
import axios from "axios";


const Services: React.FC = () => {

    const [activeTab, setActiveTab] = useState<"activities" | "history" | "messages">("activities");
    const [messageFilterMode, setMessageFilterMode] = useState<"all" | "read" | "unread" | "sent">("all");
    const [_messages, setMessages] = useState([]);


    const messageModes = [

        { id: "all", label: "All" },
        { id: "read", label: "Read" },
        { id: "unread", label: "Unread" },
        { id: "sent", label: "Sent" },
    ];

    const { user } = useLogin();

    useEffect(() => {

        if (!user) return;

        const fetchSentMessages = async () => {
            try {
                const response = await axios.get(`https://api-deedlink-notification-service.vercel.app/api/notifications/sentMessages/${user.email}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Error fetching user messages: ", error);
            }
        };

        fetchSentMessages();
    }, [user]);


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

                {
                    activeTab === "messages" ?
                        (
                            <div className="w-full border z-40 rounded-lg bg-gradient-to-r from-gray-50 to-emerald-50 border-emerald-100 p-2xl mt-6 h-screen">
                                <div className="flex justify-end gap-2 rounded-2xl sticky top-0 z-40 w-full p-3">

                                    {
                                        messageModes.map((mode) => {

                                            const isActiveMessageMode = messageFilterMode === mode.id;
                                            return (


                                                <button key={mode.id} onClick={() => setMessageFilterMode(mode.id as any)}
                                                    className={`flex items-center rounded-md px-2 py-1  transition-all duration-200 ${isActiveMessageMode ? "bg-blue-500 text-gray-50 shadow-lg scale-105" :
                                                        "bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700"}`}>
                                                    {mode.label}
                                                </button>

                                            )


                                        })



                                    }



                                </div>

                                {
                                    messageFilterMode === "all" ? (
                                        <div>

                                        </div>
                                    ) : messageFilterMode === "read" ? (
                                        <></>
                                    ) : messageFilterMode === "unread" ? (
                                        <></>
                                    ) : messageFilterMode === "sent" ? (

                                        <div>

                                            <h2 className="text-xl text-gray-700 font-semibold pl-2 pt-1 mb-3">Your Sent Messages</h2>

                                            <div className="m-3 pt-5">
                                                <div>

                                                </div>
                                            </div>


                                        </div>
                                    ) : null
                                }
                                <div>

                                </div>

                            </div>

                        ) : activeTab === "history" ?

                            (
                                <div className="w-full border z-40 rounded-lg bg-gradient-to-r from-gray-50 to-emerald-50 border-emerald-100 p-2xl mt-6 h-screen">
                                    <div className="p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-sm flex justify-end">


                                    </div>
                                </div>

                            ) : activeTab === "activities" ?
                                (
                                    <div className="w-full border z-40 rounded-lg bg-gradient-to-r from-gray-50 to-emerald-50 border-emerald-100 p-2xl mt-6 h-screen">
                                        <div className="p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-sm flex justify-end">



                                        </div>
                                    </div>

                                ) : null

                }


            </div>

        </div>
    )
}

export default Services;
