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
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xl z-50 p-4 lg:ml-64">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded-full"
        >
          ✕
        </button>

        <h2 className="text-lg sm:text-xl font-bold mb-4 pr-8">
          Deed Details ({deed.deedNumber})
        </h2>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Owner</p>
              <p className="text-gray-900">{deed.ownerFullName}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">NIC</p>
              <p className="text-gray-900">{deed.ownerNIC}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="font-semibold text-gray-700">Address</p>
              <p className="text-gray-900">{deed.ownerAddress}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Phone</p>
              <p className="text-gray-900">{deed.ownerPhone}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Land Type</p>
              <p className="text-gray-900">{deed.landType}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Value</p>
              <p className="text-gray-900 font-semibold">{deed.value.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">District</p>
              <p className="text-gray-900">{deed.district}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Division</p>
              <p className="text-gray-900">{deed.division}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleSign}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-sm"
          >
            Sign
          </button>
          
          <button
            onClick={handleSignAndPass}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-sm"
          >
            Sign & Pass
          </button>
          
          <button
            onClick={handleReject}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-sm"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeedPopup;
