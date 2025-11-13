import { useEffect, useState } from "react";
import { User, Mail, Shield, Calendar, FileText, CheckCircle, XCircle, Clock, TrendingUp, Award, Wallet } from "lucide-react";
import { useLogin } from "../../contexts/LoginContext";
import { useWallet } from "../../contexts/WalletContext";
import { compressAddress, calculateCertificateAnalytics } from "../../utils/functions";
//import { getCertificatesByNotaryWalletAddress } from "../../api/api";
import { type AnalaticsType } from "../../types/analatics";

const sampleAnalatics: AnalaticsType = {
  totalDeeds: 0,
  signedDeeds: 0,
  rejectedDeeds: 0,
  pendingDeeds: 0,
  monthlyGrowth: 0,
  completionRate: 0,
  avgProcessingTime: 0,
};

const NotaryHome = () => {
  const { user } = useLogin();
  const { account } = useWallet();
  const [analytics, setAnalytics] = useState<AnalaticsType>(sampleAnalatics);

  if (!user) return null;

  const fetchCertificates = async () => {
    if (account) {
      //const res = await getCertificatesByNotaryWalletAddress(account);
      setAnalytics(calculateCertificateAnalytics([]));
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}</h1>
              <p className="text-blue-700 font-medium">Licensed Notary</p>
              <p className="text-gray-600 text-sm mt-1">Manage and verify assigned certificates</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">Verified</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {user.name.split(" ").map(n => n.charAt(0)).join("")}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-blue-600 font-medium">Licensed Notary</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email Address</p>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Award className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">License Number</p>
                      <p className="text-sm font-medium text-gray-900">{user.nic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Wallet Status</p>
                      <p className="text-sm font-bold text-blue-700">Connected</p>
                      <p className="text-xs font-mono text-gray-600 mt-1">{compressAddress(account ?? "")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalDeeds}</p>
                    <p className="text-sm text-gray-500">Total Certificates</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.signedDeeds}</p>
                    <p className="text-sm text-gray-500">Verified</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.rejectedDeeds}</p>
                    <p className="text-sm text-gray-500">Rejected</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.pendingDeeds}</p>
                    <p className="text-sm text-gray-500">Pending Verification</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Monthly Growth</h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">+{analytics.monthlyGrowth}%</p>
                <p className="text-sm text-gray-500 mt-1">Compared to last month</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{analytics.completionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">Certificate verification rate</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Avg Processing</h3>
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{analytics.avgProcessingTime}</p>
                <p className="text-sm text-gray-500 mt-1">Days per certificate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotaryHome;
