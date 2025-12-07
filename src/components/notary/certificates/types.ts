export type Party = {
  name: string;
  role: string;
  contact: string;
};

export type Certificate = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  parties?: Party[];
  data?: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  tokenId?: number;
  verified?: boolean;
  rejected?: boolean;
  verifiedAt?: string;
};

export type DeathVerification = {
  isVerified: boolean;
  verifiedAt: number;
  verifiedBy: string;
  deathCertificateHash: string;
  waitingPeriodEnd: number;
  canExecute: boolean;
};

export type WillDetails = {
  beneficiary: string;
  witness1: string;
  witness2: string;
  createdAt: number;
  executionDate: number;
  isActive: boolean;
  isExecuted: boolean;
  ipfsHash: string;
  witness1Status: number;
  witness2Status: number;
};

