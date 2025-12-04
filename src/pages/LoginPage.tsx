import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Wallet, Shield, FileText, CheckCircle, TrendingUp, Globe, Zap, Users } from "lucide-react";
import { useWallet } from "../contexts/WalletContext";
import { compressAddress, isValidEmail, isValidPassword } from "../utils/functions";
import { useEffect, useState } from "react";
import { loginUser } from "../api/api";
import { useToast } from "../contexts/ToastContext";
import { useLogin } from "../contexts/LoginContext";
import { useLoader } from "../contexts/LoaderContext";

export default function LoginPage() {
  const { account, connect, disconnect } = useWallet();
  const { setToken, setUser } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();
    const timer = setTimeout(() => {
      hideLoader();
    }, 2000);

    return () => clearTimeout(timer);
  },[]);

  const handleLogin = async () => {
    try {
      if(!account) {
        showToast("Please connect your wallet first.", "error");
        return;
      }

      else if (!email || !password) {
        showToast("Please fill in all fields.", "error");
        return;
      }

      else if (isValidPassword(password) === false) {
        showToast("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.", "error");
        return;
      }

      else if (isValidEmail(email) === false) {
        showToast("Please enter a valid email address.", "error");
        return;
      }

      const res = await loginUser({ email, password, walletAddress: account || "" });
      console.log(res);
      if(res.user.role !== "surveyor" && res.user.role !==  "IVSL" && res.user.role !==  "notary") {
        showToast("Access denied. Not a department account.", "error");
        return;
      }
      setUser(res.user);
      setToken(res.token);
      showToast("Login successful!", "success");
      if(res.user.role === "surveyor"){
        navigate("/surveyor");
      }
      else if(res.user.role === "IVSL"){
        navigate("/ivsl");
      }
      else if(res.user.role === "notary"){
        navigate("/notary");
      }
    } catch (error) {
      showToast("Login failed. Please check your credentials.", "error");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-12 flex-col justify-center text-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold">Land Registry System</h1>
          </div>
          
          <p className="text-xl mb-12 text-white/90 leading-relaxed">
            A blockchain-integrated platform for secure land deed management, property valuation, and certificate verification.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Deed Management</h3>
                <p className="text-white/80 text-sm">Manage and track land deeds with blockchain verification for enhanced security and transparency.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Property Valuation</h3>
                <p className="text-white/80 text-sm">Comprehensive property assessment and valuation services with market analysis integration.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Certificate Verification</h3>
                <p className="text-white/80 text-sm">Verify and manage legal certificates with immutable blockchain records.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Blockchain Security</h3>
                <p className="text-white/80 text-sm">All transactions are secured on the blockchain with cryptographic verification.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Department Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>IPFS Storage</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Secure Login</h1>
          </div>

        <div className="px-8 pb-8 space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!(account && isValidPassword(password) && isValidEmail(email))}
            className={`w-full py-4 rounded-xl font-medium transition-all transform 
              bg-green-500 text-gray-700 hover:bg-green-600 hover:scale-[1.02]
              ${!(account && isValidPassword(password) && isValidEmail(email)) ? "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-gray-200" : "cursor-pointer"}`}
          >
            Login
          </button>

          <p className="text-center text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-emerald-600 font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
