import axios from "axios";
import { useState } from "react";

function contact() {

    const [recipient, setRecipient] = useState("");
    const [sendRole, setSendRole] = useState("");
    const [notary, setNotary] = useState("");
    const [ivslOfficer, setIvslOfficer] = useState("");
    const [admin, setAdmin] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    const [roles, setRoles] = useState<string[]>(["Admin", "Notary", "IVSL Officer"]);


    const handleSubmit = () => {

    }


    const fetchUsersByRole = async (selectedRole: string) => {
        try {
            const response = await axios.get(`https://api-deedlink-user-service.vercel.app/api/users/role/${selectedRole}`);
            console.log("Users with role", selectedRole, ":", response.data);
        } catch (error) {
            console.error("Error fetching users by role:", error);
        }
    }



    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Get in Touch</h1>
                    <p className="text-gray-700 text-justify"> We’re here to assist Surveyors, IVSL officers, and Notaries with any inquiries or support regarding property verification, title validation, and blockchain transaction updates.</p>
                </div>

                <div>
                    <form className="space-y-6 bg-white border border-gray-200 rounded w-2xl
                    shadow-sm p-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-gray-800 font-medium mb-1 block">Recipient Role</label>
                            <div className="flex flex-wrap gap-4">
                                {roles.map((role: string) => (
                                    <div key={role} onClick={() => { setRecipient(role); fetchUsersByRole(role); }} className={`cursor-pointer text-lg font-semibold px-4 py-2 rounded-xl border 
                                    transition-all duration-150 ease-in-out hover:scale-105
                                    ${recipient === role
                                            ? "bg-emerald-600 text-white border-emerald-600 text-2xl"
                                            : "bg-white text-gray-800 border-gray-300 hover:bg-emerald-50 hover:border-emerald-200 text-xl"
                                        }
                                    `}>
                                        {role}
                                    </div>
                                ))}


                            </div>
                        </div>

                        {recipient && (
                            <div className="mt-4">
                                <h2 className="text-lg font-semibold text-gray-800 mb-2">{recipient} List</h2>

                            </div>
                            {loading ? (
                            <p className="text-gray-500 italic">Loading users...</p>
                        ) : users.length > 0 ? (
                            <ul className="space-y-2">
                                {users.map((user, index) => (
                                    <li className="p-2 border rounded-lg hover:bg-emerald-50 transition-all" key={index}>
                                        <span className="font-medium"></span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        )}

                        <div>
                            <label className="text-gray-800 font-medium mb-1 block">Subject</label>
                            <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-gray-800 font-medium mb-1 block">Message</label>
                            <textarea name="subject" placeholder="Write your message here..." value={message} onChange={(e) => setMessage(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            ></textarea>
                        </div>

                        <button className="border border-gray-500 p-2 w-full rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:text-white
                    transition-all duration-200 ease-in-out font-semibold text-lg bg-emerald-600 px-6 py-2 hover:scale-105
               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                            Send
                        </button>
                    </form>
                </div>

                <p className="text-gray-600 text-justify pt-2">
                    For technical issues, account assistance, or process clarifications, please reach out to our support team at
                    <span className="font-semibold text-emerald-700"> support@realestatechain.lk </span>
                    or call us at <span className="font-semibold text-emerald-700"> +94 71 234 5678</span>.
                    We’ll ensure your concerns are handled promptly and securely.
                </p>
            </div>

        </div>

    )
}

export default contact;