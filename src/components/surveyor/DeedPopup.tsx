import type { Deed } from "../../types/deed";

type Props = {
  deed: Deed | null;
  onClose: () => void;
  onSign: (deed: Deed) => void;
  onReject: (deed: Deed) => void;
  onSignAndPass: (deed: Deed) => void;
};

const DeedPopup = ({ deed, onClose, onSign, onReject, onSignAndPass }: Props) => {
  if (!deed) return null;

  const handleSign = () => {
    onSign(deed);
    onClose();
  };

  const handleReject = () => {
    onReject(deed);
    onClose();
  };

  const handleSignAndPass = () => {
    onSignAndPass(deed);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xl z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative max-h-screen overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">
          Deed Details ({deed.deedNumber})
        </h2>

        <div className="space-y-2 mb-6">
          <p>
            <strong>Owner:</strong> {deed.ownerFullName}
          </p>
          <p>
            <strong>NIC:</strong> {deed.ownerNIC}
          </p>
          <p>
            <strong>Address:</strong> {deed.ownerAddress}
          </p>
          <p>
            <strong>Phone:</strong> {deed.ownerPhone}
          </p>
          <p>
            <strong>Land Type:</strong> {deed.landType}
          </p>
          <p>
            <strong>Value:</strong> {deed.value.toLocaleString()}
          </p>
          <p>
            <strong>District:</strong> {deed.district}
          </p>
          <p>
            <strong>Division:</strong> {deed.division}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSign}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign
          </button>
          
          <button
            onClick={handleSignAndPass}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign and Pass
          </button>
          
          <button
            onClick={handleReject}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeedPopup;
