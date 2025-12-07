import axios, { type AxiosResponse } from "axios";
import { getItem, setItem } from "../storage/storage";
import type { AuthResponse, KYCUploadResponse, LoginRequest, RegisterRequest, User, userStatusNotRegisteredResponse, userStatusResponse, VerifyKYCRequest } from "../types/types";
import type { Plan } from "../types/plan";

const USER_API_URL = import.meta.env.VITE_USER_API_URL || "http://localhost:5000/api/users";
const DEED_API_URL = import.meta.env.VITE_DEED_API_URL || "http://localhost:5001/api/deeds";
const CERTIFICATE_API_URL = import.meta.env.VITE_CERTIFICATE_SERVICE_URL || "http://localhost:4004/api/certificates";
export const IPFS_MICROSERVICE_URL = import.meta.env.VITE_IPFS_MICROSERVICE_URL || import.meta.env.VITE_PINATA_API_URL || "";

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

export const uploadProfilePicture = async (file: File): Promise<{ dp: string; user: User }> => {
  const formData = new FormData();
  formData.append("profilePicture", file);

  const res: AxiosResponse<{ dp: string; user: User }> = await api.post(
    "/profile-picture",
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

// Get deeds by surveyor wallet address (protected)
export const getDeedByNotaryorWalletAddress = async (walletAddress: string): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await deedApi.get(`/notary/${walletAddress}`);
  return res.data;
};

// Get deeds by surveyor wallet address (protected)
export const getDeedByIVSLWalletAddress = async (walletAddress: string): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await deedApi.get(`/ivsl/${walletAddress}`);
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

// Get latest plan for a deed (protected)
export const getLatestPlanByDeedId = async (deedId: string): Promise<any> => {
  try {
    const res = await deedApi.get(`/${deedId}/plan`, {
      validateStatus: (status) => {
        return status < 500;
      },
    });
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { success: false, message: 'Plan not found' };
    }
    throw error;
  }
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
  try {
    const res = await planApi.get(`/deed/${deedNumber}`, {
      validateStatus: (status) => {
        // Don't throw errors for 404s (plan not found is expected)
        return status < 500;
      },
    });
    // Return the response data, which will have success: false for 404s
    return res.data;
  } catch (error: any) {
    // Only catch non-404 errors
    if (error?.response?.status === 404) {
      return { success: false, message: 'Plan not found' };
    }
    throw error;
  }
};

// Get all plans by deed number (protected) - sorted by timestamp (latest first)
export const getAllPlansByDeedNumber = async (deedNumber: string): Promise<any> => {
  try {
    const res = await planApi.get(`/deed/${deedNumber}/all`, {
      validateStatus: (status) => {
        // Don't throw errors for 404s (plan not found is expected)
        return status < 500;
      },
    });
    // Return the response data, which will have success: false for 404s
    return res.data;
  } catch (error: any) {
    // Only catch non-404 errors
    if (error?.response?.status === 404) {
      return { success: false, message: 'No plans found', data: [] };
    }
    throw error;
  }
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

// Sign deed (protected)
export const signDeed = async (
  deedId: string,
  type: "survey" | "notary" | "ivsl",
  signature: string
): Promise<any> => {
  const res: AxiosResponse<any> = await deedApi.post(
    `/${deedId}/sign/${type}`,
    { signature }
  );
  return res.data;
};

// Estimate Valuation (IVSL)
export const estimateValuation = async (
  id: string,
  estimatedValue: number,
  isAccepted: boolean
): Promise<any> => {
  const res = await deedApi.post(`/ivsl/${id}`, {
    estimatedValue,
    isAccepted,
    mode: "estimate-requested",
  });
  return res.data;
};

// Set Password for Unset Department User
export const setPasswordForUnsetDepartmentUser = async (
  email?: string,
  walletAddress?: string,
  signature?: string,
  newPassword?: string,
  confirmPassword?: string,
  otp?: string
): Promise<AuthResponse> => {
  const res: AxiosResponse<AuthResponse> = await api.post(
    "/set-password-for-unset-department-user",
    {
      email,
      walletAddress,
      signature,
      newPassword,
      confirmPassword,
      otp,
    }
  );
  return res.data;
};

// Certificate related api calls will be added here later
// const API_BASE = import.meta.env.VITE_CERTIFICATE_SERVICE_URL || "http://localhost:4004/api/certificates";
const certificatesApi = axios.create({
  baseURL: CERTIFICATE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

certificatesApi.interceptors.request.use((config) => {
  const token = getItem("local", "token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAllCertificates = async (): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await certificatesApi.get(`/`);
  return res.data;
};

export const getCertificateById = async (certificateId: string): Promise<any> => {
  const res: AxiosResponse<any> = await certificatesApi.get(`/${certificateId}`);
  return res.data;
};

export const createCertificate = async (data: any): Promise<any> => {
  const res: AxiosResponse<any> = await certificatesApi.post(`/`, data);
  return res.data;
};

export const verifyCertificate = async (certificateId: string): Promise<any> => {
  const res: AxiosResponse<any> = await certificatesApi.post(`/${certificateId}/verify`);
  return res.data;
};

export const getNearbyLandSales = async (deedId: string, radiusKm: number = 10): Promise<any> => {
  const res: AxiosResponse<any> = await deedApi.get(`/${deedId}/nearby-sales?radiusKm=${radiusKm}`);
  return res.data;
};

export const getCertificatesByTokenId = async (tokenId: number): Promise<any> => {
  const res: AxiosResponse<any> = await certificatesApi.get(`/token/${tokenId}`);
  return res.data;
};