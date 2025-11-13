import React, { useEffect, useState } from "react";
import { getAllCertificates } from "../../api/api";

type Party = {
  name: string;
  role: string;
  contact: string;
};

type Certificate = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  parties?: Party[];
  data?: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

const NotaryCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await getAllCertificates();
      const list = Array.isArray(res) ? res : Array.isArray(res) ? res : [];
      setCertificates(list);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id: string) => {
    alert(`Certificate ${id} verified successfully!`);
    setSelectedCert(null);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-gray-700">Loading certificates...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Assigned Certificates</h1>
      {certificates.length === 0 ? (
        <p className="text-gray-600">No certificates found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white shadow-md rounded-2xl p-4 border hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedCert(cert)}
            >
              <h2 className="text-lg font-semibold text-gray-800">{cert.title}</h2>
              <p className="text-sm text-gray-600 capitalize mt-1">Type: {cert.type.replaceAll("_", " ")}</p>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{cert.description}</p>
              <p className="text-xs text-gray-400 mt-3">
                Created: {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
      {selectedCert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{selectedCert.title}</h2>
            <p className="text-gray-600 mb-4 capitalize">Type: {selectedCert.type.replaceAll("_", " ")}</p>
            <div className="mb-6 border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Basic Information</h3>
              <p className="text-gray-700 mb-2"><span className="font-medium">Certificate ID:</span> {selectedCert._id}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Created By:</span> {selectedCert.createdBy || "N/A"}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Created At:</span> {selectedCert.createdAt ? new Date(selectedCert.createdAt).toLocaleString() : "N/A"}</p>
              <p className="text-gray-700"><span className="font-medium">Updated At:</span> {selectedCert.updatedAt ? new Date(selectedCert.updatedAt).toLocaleString() : "N/A"}</p>
            </div>
            {selectedCert.description && (
              <div className="mb-6 border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-700">{selectedCert.description}</p>
              </div>
            )}
            {selectedCert.parties && selectedCert.parties.length > 0 && (
              <div className="mb-6 border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Involved Parties</h3>
                <ul className="space-y-2">
                  {selectedCert.parties.map((p, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      <span className="font-medium">{p.name}</span> — {p.role} ({p.contact})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedCert.data && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Data</h3>
                <div className="bg-gray-100 rounded-lg p-3 max-h-72 overflow-auto">
                  <pre className="text-xs text-gray-700">{JSON.stringify(selectedCert.data, null, 2)}</pre>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => handleVerify(selectedCert._id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Verify Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotaryCertificates;
