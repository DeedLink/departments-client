import type { Deed } from "../../types/deed";

type Props = {
  deed: Deed | null;
  onClose: () => void;
};

const DeedPopup = ({ deed, onClose }: Props) => {
  if (!deed) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">
          Deed Details ({deed.deedNumber})
        </h2>

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
    </div>
  );
};

export default DeedPopup;
