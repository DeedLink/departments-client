import { useState } from "react";

function contact() {

    const [recipient, setRecipient] = useState("");
    const [sendRole,setSendRole] = useState("");
    const [subject,setSubject] = useState("");
    const [message,setMessage] = useState("");
    const [roles, setRoles] = useState<string[]>(["Admin", "Notary", "IVSL Officer"]);


    const handleSubmit = () => {

    }

    const handleChange = () => {

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
                                    <div key={role} onClick={() => setRecipient(role)} className={`cursor-pointer text-lg font-semibold px-4 py-2 rounded-xl border 
                                    transition-all duration-300 ease-in-out
                                    ${
                                    recipient === role
                                        ? "bg-emerald-600 text-white border-emerald-600 text-2xl"
                                        : "bg-white text-gray-800 border-gray-300 hover:bg-emerald-50 hover:border-emerald-200 text-xl"
                                    }
                                    `}>
                                        {role}
                                    </div>
                                ))}


                            </div>
                        </div>

                        <div>
                            <label className="text-gray-800 font-medium mb-1 block">Subject</label>
                            <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-gray-800 font-medium mb-1 block">Message</label>
                            <textarea name="subject" placeholder="Write your message here..." value={message} onChange={(e) => setMessage(e.target.value)} type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            ></textarea>
                        </div>
                        

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