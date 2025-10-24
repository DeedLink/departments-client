import { Link } from "react-router-dom";
import { User, Mail, Lock, Wallet, KeyIcon } from "lucide-react";
import { useWallet } from "../contexts/WalletContext";
import { compressAddress, isValidPassword } from "../utils/functions";
import { useLoader } from "../contexts/LoaderContext";
import { useEffect, useState } from "react";
import { setPasswordForUnsetDepartmentUser } from "../api/api";
import { getSignature } from "../web3.0/wallet";
import { useToast } from "../contexts/ToastContext";

export default function SignupPage() {
  const { account, connect, disconnect } = useWallet();
  const { showLoader, hideLoader } = useLoader();
  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ confirmPassword, setConfirmPassword ] = useState("");
  const [ otp, setOtp ] = useState("");
  const { showToast } = useToast();


  useEffect(() => {
    showLoader();
    const timer = setTimeout(() => {
      hideLoader();
    }, 2000);

    return () => clearTimeout(timer);
  },[]);

  const handleSetPassword = async () => {
    try {
      showLoader();
      if (isValidPassword(password) === false) {
        showToast("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.", "error");
        return;
      }
      const signature = account ? await getSignature(`Setting password for wallet: ${account}`) : undefined;
      const response = await setPasswordForUnsetDepartmentUser(
        email,
        account?.toLocaleLowerCase() || undefined,
        signature,
        password,
        confirmPassword,
        otp
      );

      console.log("Account created:", response);
      showToast("Account created successfully! Please sign in.", "success");
    } catch (error) {
      console.error("Error setting password:", error);
      showToast("Failed to create account. Please try again.", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="p-8 text-center">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
        </div>

        <div className="px-8 pb-8 space-y-4">

          <div className="group">
            {account ? (
              <button
                onClick={disconnect}
                className="w-full bg-emerald-500 hover:bg-red-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] group"
              >
                <Wallet className="w-5 h-5" />
                <span className="group-hover:hidden">{compressAddress(account)}</span>
                <span className="hidden group-hover:inline">Disconnect</span>
              </button>
            ) : (
              <button
                onClick={connect}
                className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </button>
            )}
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="relative">
            <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            onClick={handleSetPassword}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-medium transition-all transform hover:scale-[1.02]"
          >
            Create Account
          </button>

          <p className="text-center text-gray-600 pt-2">
            Already have an account?{" "}
            <Link to="/" className="text-emerald-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

