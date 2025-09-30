import { useEffect } from "react";
import { useLoader } from "../../contexts/LoaderContext";
import NotaryDeedsTable from "../../components/notary/NotaryDeedsTable";

const NotaryDeeds = () => {
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();
    const timer = setTimeout(() => {
      hideLoader();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Notary Deeds</h1>
          <p className="text-black">Review, verify, and sign property deeds</p>
        </div>
        <NotaryDeedsTable />
      </div>
    </div>
  );
};

export default NotaryDeeds;
