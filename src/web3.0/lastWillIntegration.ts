import { ethers } from "ethers";
import { connectWallet } from "./wallet";
import LastWillABI from "./abis/LastWillRegistry.json";

const LAST_WILL_ADDRESS = import.meta.env.VITE_LASTWILL_REGISTRY_ADDRESS as string;

async function getSigner() {
  const wallet = await connectWallet();
  if (!wallet) throw new Error("Wallet not connected");
  return wallet.signer;
}

async function getLastWillContract() {
  const signer = await getSigner();
  return new ethers.Contract(LAST_WILL_ADDRESS, LastWillABI.abi, signer);
}

export async function createWill(
  tokenId: number,
  beneficiary: string,
  witness1: string,
  witness2: string,
  ipfsHash: string
) {
  try {
    const contract = await getLastWillContract();
    const tx = await contract.createWill(tokenId, beneficiary, witness1, witness2, ipfsHash);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      message: `Will created for token #${tokenId}`
    };
  } catch (error: any) {
    console.error("Error in createWill:", error);
    
    if (error?.reason) {
      throw new Error(error.reason);
    } else if (error?.message) {
      throw error;
    } else {
      throw new Error("Failed to create will on blockchain");
    }
  }
}

export async function witnessWill(tokenId: number, approve: boolean) {
  const contract = await getLastWillContract();
  const tx = await contract.witnessWill(tokenId, approve);
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
    message: `Will witnessed for token #${tokenId}`
  };
}

export async function revokeWill(tokenId: number) {
  const contract = await getLastWillContract();
  const tx = await contract.revokeWill(tokenId);
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
    message: `Will revoked for token #${tokenId}`
  };
}

export async function updateBeneficiary(tokenId: number, newBeneficiary: string) {
  const contract = await getLastWillContract();
  const tx = await contract.updateBeneficiary(tokenId, newBeneficiary);
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
    message: `Beneficiary updated for token #${tokenId}`
  };
}

export async function verifyOwnerDeath(tokenId: number, deathCertificateHash: string) {
  const contract = await getLastWillContract();
  const tx = await contract.verifyOwnerDeath(tokenId, deathCertificateHash);
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
    message: `Owner death verified for token #${tokenId}. Waiting period of 30 days begins.`
  };
}

export async function getDeathVerification(tokenId: number) {
  const contract = await getLastWillContract();
  const dv = await contract.getDeathVerification(tokenId);

  return {
    isVerified: dv[0],
    verifiedAt: Number(dv[1]),
    verifiedBy: dv[2],
    deathCertificateHash: dv[3],
    waitingPeriodEnd: Number(dv[4]),
    canExecute: dv[5]
  };
}

export async function isOwnerDeceased(tokenId: number) {
  const contract = await getLastWillContract();
  return await contract.isOwnerDeceased(tokenId);
}

export async function executeWill(tokenId: number) {
  const contract = await getLastWillContract();
  const tx = await contract.executeWill(tokenId);
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
    message: `Will executed for token #${tokenId}`
  };
}

export async function getWill(tokenId: number) {
  const contract = await getLastWillContract();
  const will = await contract.getWill(tokenId);

  return {
    beneficiary: will[0],
    witness1: will[1],
    witness2: will[2],
    createdAt: Number(will[3]),
    executionDate: Number(will[4]),
    isActive: will[5],
    isExecuted: will[6],
    ipfsHash: will[7],
    witness1Status: Number(will[8]),
    witness2Status: Number(will[9])
  };
}

export async function isWillReadyForExecution(tokenId: number) {
  const contract = await getLastWillContract();
  return await contract.isWillReadyForExecution(tokenId);
}

export async function hasActiveWill(tokenId: number) {
  try {
    const contract = await getLastWillContract();
    return await contract.hasActiveWill(tokenId);
  } catch (error) {
    console.error("Error checking active will:", error);
    return false;
  }
}

