interface DeedPopupProps {
  deed:any | null;
  onClose: () => void;
}

const DeedPopup = ({ deed, onClose }: DeedPopupProps) => {
  if (!deed) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">Deed Details</h2>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">ID:</span> {deed.id}
          </p>
          <p>
            <span className="font-semibold">User:</span> {deed.user}
          </p>
          <p>
            <span className="font-semibold">Deed Name:</span> {deed.deedName}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`${
                deed.status === "Signed"
                  ? "text-green-600"
                  : deed.status === "Rejected"
                  ? "text-red-600"
                  : "text-yellow-600"
              } font-medium`}
            >
              {deed.status}
            </span>
          </p>
          <p>
            <span className="font-semibold">Date:</span> {deed.date}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Sign
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeedPopup;
