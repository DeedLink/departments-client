export type Party = {
  _id?: string;
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
  data?: {
    tokenId?: number;
    deedNumber?: string;
    estimatedValue?: number;
    stampDuty?: number;
    fixedFee?: number;
    totalFee?: number;
    txHash?: string;
    [key: string]: any;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  verified?: boolean;
  rejected?: boolean;
  verifiedAt?: string;
  __v?: number;
};

export type CertificatesResponse = {
  page: number;
  limit: number;
  results: Certificate[];
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

