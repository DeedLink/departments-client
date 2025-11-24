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

