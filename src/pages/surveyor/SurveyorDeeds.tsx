import { useEffect } from "react";
import { useLoader } from "../../contexts/LoaderContext";
import DeedsTable from "../../components/surveyor/DeedsTable";

const SurveyorDeeds = () => {
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();
    const timer = setTimeout(() => {
      hideLoader();
    }, 2000);

    return () => clearTimeout(timer);
  },[]);

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Surveyor Deeds</h1>
          <p className="text-gray-400">Manage and review property deed surveys</p>
        </div>
        <DeedsTable />
      </div>
    </div>
  );
};

export default SurveyorDeeds;