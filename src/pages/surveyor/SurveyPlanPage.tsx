import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlanByDeedNumber } from "../../api/api";
import { useToast } from "../../contexts/ToastContext";

const SurveyPlanPage = () => {
  const { deedNumber } = useParams();
  const [plan, setPlan] = useState();
  const { showToast } = useToast();

  const fetchPlan = async()=>{
    try {
      if (deedNumber) {
        const res = await getPlanByDeedNumber(deedNumber);
        console.log(res);
        if (res.success) {
          setPlan(res.data);
        } else {
          //showToast(res.message || "Plan not found", "error");
        }
      } else {
        showToast("deedNumber missing", "error");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast("Plan not found", "error");
      } else {
        showToast("Error fetching plan", "error");
      }
    }
  }

  useEffect(()=>{
    fetchPlan();
  },[deedNumber]);
    

  return <div>{JSON.stringify(plan)}</div>;
}

export default SurveyPlanPage;
