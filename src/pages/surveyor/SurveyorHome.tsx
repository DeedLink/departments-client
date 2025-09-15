import { useEffect } from "react";
import { useLoader } from "../../contexts/LoaderContext";

const SurveyorHome = () => {
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();
    const timer = setTimeout(() => {
      hideLoader();
    }, 2000);

    return () => clearTimeout(timer);
  },[]);

  return <div className="text-black">SurveyorHome</div>;
};

export default SurveyorHome;