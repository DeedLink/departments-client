import { Link } from "react-router-dom";
import { User, Mail, Lock, Wallet, KeyIcon, Shield, CheckCircle, Users, MapPin, Award } from "lucide-react";
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 p-6 flex-col justify-center text-white overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold mb-1 text-white">
              Join Our Platform
            </h1>
            <div className="w-16 h-0.5 bg-white/40 rounded-full"></div>
          </div>
          
          <p className="text-base mb-6 text-white/90 leading-relaxed">
            Create your department account to access secure land registry management, property valuation, and certificate services.
          </p>

          <div className="space-y-2.5 mb-6">
            <div className="bg-white/10 border border-white/20 rounded-lg p-3.5">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-0.5 text-white">For Department Users</h3>
                  <p className="text-white/80 text-xs leading-relaxed">Exclusive access for Surveyors, IVSL Officers, and Notaries.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-lg p-3.5">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-0.5 text-white">Survey Plan Management</h3>
                  <p className="text-white/80 text-xs leading-relaxed">Create, update, and manage survey plans with digital mapping.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-lg p-3.5">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-0.5 text-white">KYC Verification</h3>
                  <p className="text-white/80 text-xs leading-relaxed">Secure identity verification for authorized personnel only.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-lg p-3.5">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-0.5 text-white">Wallet Integration</h3>
                  <p className="text-white/80 text-xs leading-relaxed">Connect your blockchain wallet for secure authentication.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-sm mb-2.5 text-white">Account Requirements</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-white/90">
                <CheckCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>Valid department email address</span>
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <CheckCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>Blockchain wallet connection</span>
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <CheckCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>OTP verification from admin</span>
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <CheckCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>Strong password (8+ characters)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br p-4">
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
    </div>
  );
}

