export type Certificate = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  parties?: { name: string; role: string; contact: string }[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  verified?: boolean;
  rejected?: boolean;
  verifiedAt?: string;
};
