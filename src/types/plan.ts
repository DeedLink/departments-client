export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Plan {
  planId: string;
  deedNumber: string;
  createdBy: string;
  documentURI: string;
  coordinates: Coordinate[];
  areaSize: number;
  areaType: "Hectare" | "Acre" | "Square Meter" | "Square Kilometer" | "Square Mile" | "Square Foot" | "Square Yard";
  status: "active" | "inactive" | "completed";
  details?: string;
  signedBy?: string;
  createdAt?: Date;
}

export const defaultPlan: Plan = {
  planId: "",
  deedNumber: "",
  createdBy: "",
  documentURI: "",
  coordinates: [],
  areaSize: 0,
  areaType: "Square Meter",
  status: "active",
  details: "",
  signedBy: "",
  createdAt: new Date(),
};
