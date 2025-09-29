export type Transaction = {
  from: string;
  to: string;
  amount: number;
  share: number;
  timestamp: number;
};

export type Owner = {
  address: string;
  share: number;
};

export type LocationPoint = {
  longitude: number;
  latitude: number;
};

export type Sides = {
  North?: string;
  South?: string;
  East?: string;
  West?: string;
};

export type DeedType = {
  deedType:
    | "Power of Attorney"
    | "Gift"
    | "Sale"
    | "Exchange"
    | "Lease"
    | "Mortgage"
    | "Partition Deed"
    | "Last Will"
    | "Trust Deed"
    | "Settlement Deed"
    | "Declaration of Trust"
    | "Agreement to Sell"
    | "Conditional Transfer"
    | "Transfer Deed"
    | "Deed of Assignment"
    | "Deed of Disclaimer"
    | "Deed of Rectification"
    | "Deed of Cancellation"
    | "Deed of Surrender"
    | "Deed of Release"
    | "Deed of Nomination"
    | "Affidavit"
    | "Court Order / Judgment"
    | "Other";
  deedNumber: string;
};

export type Deed = {
  _id?: string;

  title: Transaction[];
  owners: Owner[];
  deedType: DeedType;
  value: number;
  location: LocationPoint[];
  sides?: Sides;
  deedNumber: string;
  landType: "Paddy land" | "Highland" | String;
  timestamp: number;

  ownerFullName: string;
  ownerNIC: string;
  ownerAddress: string;
  ownerPhone: string;

  landTitleNumber: string;
  landAddress: string;
  landArea: number;
  landSizeUnit: "Perches" | "Acres" | "Hectares";
  surveyPlanNumber?: string;
  boundaries?: string;

  district: string;
  division: string;

  registrationDate: Date;

  surveySignature?: string;
  surveySignedBy?: string;
  notarySignature?: string;
  notarySignedBy?: string;

  tokenId?: string;
};
