import { BrowserProvider } from "ethers";

let pendingConnection: Promise<{ provider: BrowserProvider; signer: any; account: string } | null> | null = null;

export async function connectWallet() {
  if (!(window as any).ethereum) {
    alert("Please install MetaMask!");
    return null;
  }

  // Return existing promise if connection is already pending
  if (pendingConnection) {
    return pendingConnection;
  }

  // Create new connection promise
  pendingConnection = (async () => {
    try {
      const ethereum = (window as any).ethereum;
      // Select provider explicitly to avoid selectExtension error
      const selectedProvider = ethereum.providers?.find((p: any) => p.isMetaMask) || ethereum.providers?.[0] || ethereum;
      
      // Check if accounts are already available (doesn't trigger request)
      let accounts = await selectedProvider.request({ method: "eth_accounts" });
      
      // Only request if no accounts available
      if (!accounts || accounts.length === 0) {
        try {
          accounts = await selectedProvider.request({ method: "eth_requestAccounts" });
        } catch (requestErr: any) {
          // If request is pending, wait a bit and check accounts again
          if (requestErr.code === -32002) {
            console.warn("Connection request already pending, waiting...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            accounts = await selectedProvider.request({ method: "eth_accounts" });
          } else {
            throw requestErr;
          }
        }
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      // Create provider after accounts are available
      const provider = new BrowserProvider(selectedProvider);
      const signer = await provider.getSigner();

      return { provider, signer, account: accounts[0] };
    } catch (err: any) {
      console.error("Wallet connection failed", err);
      return null;
    } finally {
      // Clear pending connection after completion
      pendingConnection = null;
    }
  })();

  return pendingConnection;
}

export async function getSignature(message: string) {
  const wallet = await connectWallet();
  if (!wallet) throw new Error("Wallet not connected");
  const signature = await wallet.signer.signMessage(message);
  return signature;
}