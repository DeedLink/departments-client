import { useEffect, useState, useRef } from "react";
import { User, Mail, Shield, Calendar, FileText, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Award, Wallet, Camera, ArrowRight } from "lucide-react";
import { useLogin } from "../../contexts/LoginContext";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import { useLoader } from "../../contexts/LoaderContext";
import { useNavigate } from "react-router-dom";
import { compressAddress, calculateCertificateAnalytics } from "../../utils/functions";
import { uploadProfilePicture, IPFS_MICROSERVICE_URL, getAllCertificates } from "../../api/api";
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
  const { user, setUser } = useLogin();
  const { account } = useWallet();
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalaticsType>(sampleAnalatics);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const fetchCertificates = async () => {
    if (account) {
      try {
        setLoading(true);
        showLoader();
        const allCertificates = await getAllCertificates();
        const filteredCertificates = Array.isArray(allCertificates) 
          ? allCertificates.filter((cert: any) => 
              cert.createdBy?.toLowerCase() === account.toLowerCase() ||
              cert.notaryWalletAddress?.toLowerCase() === account.toLowerCase()
            )
          : [];
        const calculatedAnalytics = calculateCertificateAnalytics(filteredCertificates);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthCerts = filteredCertificates.filter((cert: any) => {
          if (!cert.createdAt) return false;
          const certDate = new Date(cert.createdAt);
          return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear;
        }).length;

        const lastMonthCerts = filteredCertificates.filter((cert: any) => {
          if (!cert.createdAt) return false;
          const certDate = new Date(cert.createdAt);
          return certDate.getMonth() === lastMonth && certDate.getFullYear() === lastMonthYear;
        }).length;

        const monthlyGrowth = lastMonthCerts > 0 
          ? Math.round(((currentMonthCerts - lastMonthCerts) / lastMonthCerts) * 100)
          : (currentMonthCerts > 0 ? 100 : 0);

        setAnalytics({ ...calculatedAnalytics, monthlyGrowth });
      } catch (error: any) {
        console.error("Error fetching certificates:", error);
        showToast("Failed to load certificates", "error");
        setAnalytics(calculateCertificateAnalytics([]));
      } finally {
        setLoading(false);
        hideLoader();
      }
    } else {
      setAnalytics(calculateCertificateAnalytics([]));
      setLoading(false);
    }
  };

  const profileImage = objectUrl
    ? objectUrl
    : uploadedUrl
    ? `${IPFS_MICROSERVICE_URL}/file/${uploadedUrl}`
    : user.profilePicture
    ? `${IPFS_MICROSERVICE_URL}/file/${user.profilePicture}`
    : "";

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      showToast("Please select an image file", "error");
      return;
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setFile(selectedFile);
    setObjectUrl(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    showLoader();
    try {
      const res = await uploadProfilePicture(file);
      console.log(res);
      setUploadedUrl(res.dp);
      const updatedUser = { ...res.user, profilePicture: res.dp || res.user.profilePicture };
      setUser(updatedUser);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setFile(null);
      setObjectUrl("");
      showToast("Profile Picture Updated Successfully", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to upload profile picture", "error");
    } finally {
      setIsUploading(false);
      hideLoader();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [account]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}</h1>
              <p className="text-emerald-700 font-medium">Licensed Notary</p>
              <p className="text-gray-600 text-sm mt-1">Manage and verify assigned certificates</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span className="text-emerald-700 text-sm font-medium">Verified</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-emerald-600 px-6 py-4 border-b border-emerald-700">
                <h2 className="text-lg font-semibold text-white">Profile Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center mb-6">
                  <div className="relative mx-auto mb-4 w-24 h-24">
                    <div 
                      onClick={handleProfilePictureClick}
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden bg-emerald-600"
                    >
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.name.split(" ").map(n => n.charAt(0)).join("")
                      )}
                    </div>
                    <div 
                      onClick={handleProfilePictureClick}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg border-2 border-white"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file && (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Uploading..." : "Upload Picture"}
                    </button>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-emerald-700 font-medium">Licensed Notary</p>
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
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Wallet className="w-5 h-5 text-emerald-700" />
                    <div>
                      <p className="text-xs text-emerald-700 font-medium">Wallet Status</p>
                      <p className="text-sm font-bold text-emerald-800">Connected</p>
                      <p className="text-xs font-mono text-gray-600 mt-1">{compressAddress(account ?? "")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Loading analytics...</span>
                </div>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/notary/certificates")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalDeeds}</p>
                      <p className="text-sm text-gray-500">Total Certificates</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/notary/certificates")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.signedDeeds}</p>
                      <p className="text-sm text-gray-500">Verified</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/notary/certificates")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.rejectedDeeds}</p>
                      <p className="text-sm text-gray-500">Rejected</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/notary/certificates")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.pendingDeeds}</p>
                      <p className="text-sm text-gray-500">Pending Verification</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Monthly Growth</h3>
                  {analytics.monthlyGrowth >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${analytics.monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {analytics.monthlyGrowth >= 0 ? '+' : ''}{analytics.monthlyGrowth}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Compared to last month</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-emerald-600">{analytics.completionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">Certificate verification rate</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Avg Processing</h3>
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-emerald-600">{analytics.avgProcessingTime}</p>
                <p className="text-sm text-gray-500 mt-1">Days per certificate</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/notary/certificates")}
                  className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">View All Certificates</p>
                      <p className="text-xs text-gray-600">Manage certificates</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/notary/deeds")}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">View Deeds</p>
                      <p className="text-xs text-gray-600">Notarize deeds</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotaryHome;
