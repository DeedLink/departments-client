import React, { createContext, useContext, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { connectWallet } from "../web3.0/wallet";
import { getItem, removeItem, setItem } from "../storage/storage";
import { useLogin } from "./LoginContext";

interface WalletContextProps {
  account: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(getItem("local", "account"));
  const [provider, setProvider] = useState<BrowserProvider | null>(getItem("local", "provider"));
  const [signer, setSigner] = useState<JsonRpcSigner | null>(getItem("local", "signer"));
  const { logout } = useLogin();

  const connect = async () => {
    const res = await connectWallet();
    if (res) {
      setAccount(res.account);
      setProvider(res.provider);
      setSigner(res.signer);
      setItem("local", "walletConnected", true);
      setItem("local", "account", res.account);
      setItem("local", "provider", res.provider);
      setItem("local", "signer", res.signer);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    removeItem("local", "walletConnected");
    removeItem("local", "account");
    removeItem("local", "provider");
    removeItem("local", "signer");
    logout();
  };

  return (
    <WalletContext.Provider value={{ account, provider, signer, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
};
