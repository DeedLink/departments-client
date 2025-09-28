import axios, { type AxiosResponse } from "axios";
import { getItem, setItem } from "../storage/storage";
import type { AuthResponse, KYCUploadResponse, LoginRequest, RegisterRequest, User, userStatusNotRegisteredResponse, userStatusResponse, VerifyKYCRequest } from "../types/types";
import type { Plan } from "../types/plan";

const USER_API_URL = import.meta.env.VITE_USER_API_URL || "http://localhost:5000/api/users";
const DEED_API_URL = import.meta.env.VITE_DEED_API_URL || "http://localhost:5001/api/deeds";

const api = axios.create({
  baseURL: USER_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getItem("local", "token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register user
export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res: AxiosResponse<AuthResponse> = await api.post("/register", data);
  setItem("local", "token", res.data.token);
  return res.data;
};

// Login user
export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const res: AxiosResponse<AuthResponse> = await api.post("/login", data);
  setItem("local", "token", res.data.token);
  return res.data;
};

// Get profile (protected)
export const getProfile = async (): Promise<User> => {
  const res: AxiosResponse<User> = await api.get("/profile");
  return res.data;
};

// Upload KYC documents (protected, multipart/form-data)
export const uploadKYC = async (
    id: string,
    nic: string,
    nicFrontSide: File | null,
    nicBackSide: File | null,
    userFrontImage: File | null
): Promise<KYCUploadResponse> => {
    const formData = new FormData();
    formData.append("nic", nic);
    formData.append("userId", id);
    if (nicFrontSide) formData.append("nicFrontSide", nicFrontSide);
    if (nicBackSide) formData.append("nicBackSide", nicBackSide);
    if (userFrontImage) formData.append("userFrontImage", userFrontImage);
    console.log("form data: ", formData.get("nicFrontSide"));

    const res: AxiosResponse<KYCUploadResponse> = await api.post(
        "/upload-kyc",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${getItem("local", "token") || ""}`,
            },
        }
    );

    return res.data;
};

// Verify KYC (registrar/admin only)
export const verifyKYC = async (
  id: string,
  data: VerifyKYCRequest
): Promise<{ message: string; user: User }> => {
  const res: AxiosResponse<{ message: string; user: User }> = await api.patch(
    `/${id}/verify-kyc`,
    data
  );
  return res.data;
};

// List pending KYC (registrar/admin only)
export const listPendingKYC = async (): Promise<User[]> => {
  const res: AxiosResponse<User[]> = await api.get("/pending-kyc");
  return res.data;
};

// Get user state by wallet address (public)
export const getUserState = async (walletAddress: string): Promise<userStatusResponse | userStatusNotRegisteredResponse> => {
  const res: AxiosResponse<userStatusResponse | userStatusNotRegisteredResponse> = await api.get(`/status/${walletAddress}`);
  return res.data;
};

// Get all users (only for testing)
export const getUsers = async (): Promise<User[]> => {
  const res: AxiosResponse<User[]> = await api.get("/");
  return res.data;
};

// Get Role
export const getRole = async (): Promise<{ role: string }> => {
  const res: AxiosResponse<{ role: string }> = await api.get(`/role`);
  return res.data;
}

// Deed related api calls
const deedApi = axios.create({
  baseURL: DEED_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

deedApi.interceptors.request.use((config) => {
  const token = getItem("local", "token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get deeds by owner ID (protected)
export const getDeedsByOwner = async (ownerId: string): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await deedApi.get(`/owner/${ownerId}`);
  return res.data;
};

// Get deed by ID (protected)
export const getDeedById = async (deedId: string): Promise<any> => {
  const res: AxiosResponse<any> = await deedApi.get(`/${deedId}`);
  return res.data;
};

// Get deeds by surveyor wallet address (protected)
export const getDeedBySurveyorWalletAddress = async (walletAddress: string): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await deedApi.get(`/surveyor/${walletAddress}`);
  return res.data;
};

// Update survey plan number (surveyor only)
export const updateSurveyPlanNumber = async (deedNumber: string, surveyPlanNumber: string): Promise<any> => {
  const res: AxiosResponse<any> = await deedApi.put(
    `/update-survey-number/${deedNumber}`,
    { surveyPlanNumber }
  );
  return res.data;
};

// Plan related api calls

const SURVEY_PLAN_API_URL = import.meta.env.VITE_SURVEY_PLAN_API_URL || "http://localhost:5003/api/plans";

const planApi = axios.create({
  baseURL: SURVEY_PLAN_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

planApi.interceptors.request.use((config) => {
  const token = getItem("local", "token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get plan by deed ID (protected)
export const getPlanByDeedNumber = async (deedNumber: string): Promise<any> => {
  const res = await planApi.get(`/deed/${deedNumber}`, {
    validateStatus: () => true,
  });
  return res.data;
};

// Get plan by plan number (protected)
export const getPlanByPlanNumber = async (planId: string): Promise<any> => {
  const res = await planApi.get(`/plan/${planId}`, {
    validateStatus: () => true,
  });
  return res.data;
};

// Get plans by surveyor wallet address (protected)
export const getPlanBySeurveyorWalletAddress = async (walletAddress: string): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await planApi.get(`/surveyor/${walletAddress}`);
  return res.data;
};

// Get all plans (admin only)
export const getAllPlans = async (): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await planApi.get(`/`);
  return res.data;
};

// Create a new plan (surveyor only)
export const createPlan = async (data: Plan): Promise<any> => {
  const res: AxiosResponse<any> = await planApi.post(`/`, data);
  return res.data;
};

// Update a plan (surveyor only)
export const updatePlan = async (planId: string, data: any): Promise<any> => {
  const res: AxiosResponse<any> = await planApi.put(`/${planId}`, data);
  return res.data;
};

// Delete a plan (admin only)
export const deletePlan = async (planId: string): Promise<{ message: string }> => {
  const res: AxiosResponse<{ message: string }> = await planApi.delete(`/${planId}`);
  return res.data;
};
