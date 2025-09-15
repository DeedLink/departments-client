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
    <div className="text-black p-6">
      <h1 className="text-2xl font-bold mb-4">Surveyor Deeds</h1>
      <DeedsTable />
    </div>
  );
};

export default SurveyorDeeds;
