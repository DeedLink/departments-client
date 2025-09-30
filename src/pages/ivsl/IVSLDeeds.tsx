import { useEffect } from "react";
import { useLoader } from "../../contexts/LoaderContext";
import IVSLDeedsTable from "../../components/ivsl/IVSLDeedsTable";

const IVSLDeeds = () => {
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
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">IVSL Deeds</h1>
          <p className="text-black">Review and approve property deed valuations</p>
        </div>
        <IVSLDeedsTable />
      </div>
    </div>
  );
};

export default IVSLDeeds;