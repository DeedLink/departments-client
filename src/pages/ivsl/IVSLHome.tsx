import { useEffect, useState, useRef } from "react";
import { User, Mail, Wallet, Shield, Calendar, FileText, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Award, Camera } from "lucide-react";
import { useLogin } from "../../contexts/LoginContext";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../contexts/ToastContext";
import { useLoader } from "../../contexts/LoaderContext";
import { compressAddress, calculateIVSLAnalytics } from "../../utils/functions";
import { getDeedByIVSLWalletAddress, uploadProfilePicture, IPFS_MICROSERVICE_URL } from "../../api/api";
import { type AnalaticsType } from "../../types/analatics";

const sampleAnalatics: AnalaticsType = {
  totalDeeds: 0,
  signedDeeds: 0,
  rejectedDeeds: 0,
  pendingDeeds: 0,
  monthlyGrowth: 0,
  completionRate: 0,
  avgProcessingTime: 0
}

const IVSLHome = () => {
  const { user, setUser } = useLogin();
  const { account } = useWallet();
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();
  const [analytics, setAnalytics] = useState<AnalaticsType>(sampleAnalatics);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if(!user) return null;

  const fetchRelatedDeeds = async () => {
    if(account){
      try {
        const res = await getDeedByIVSLWalletAddress(account);
        console.log(res);
        setAnalytics(calculateIVSLAnalytics(res));
      } catch (error) {
        console.error("Error fetching IVSL deeds:", error);
      }
    }
  }

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
    console.log("IVSL Dashboard loaded");
    fetchRelatedDeeds();
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

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
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
              <p className="text-purple-700 font-medium">IVSL Valuation Officer</p>
              <p className="text-gray-600 text-sm mt-1">Manage property valuations and assessments</p>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700 text-sm font-medium">Verified</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="relative mx-auto mb-4 w-24 h-24">
                    <div 
                      onClick={handleProfilePictureClick}
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600"
                    >
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.name.split(' ').map(n => n.charAt(0)).join('')
                      )}
                    </div>
                    <div 
                      onClick={handleProfilePictureClick}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg"
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
                      className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Uploading..." : "Upload Picture"}
                    </button>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-purple-600 font-medium">Valuation Officer</p>
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
                      <p className="text-xs text-gray-500 font-medium">NIC Number</p>
                      <p className="text-sm font-medium text-gray-900">{user.nic}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-purple-600 font-medium">Wallet Status</p>
                      <p className="text-sm font-bold text-purple-700">Connected</p>
                      <p className="text-xs font-mono text-gray-600 mt-1">
                        {compressAddress(account ?? "")}
                      </p>
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
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalDeeds}</p>
                    <p className="text-sm text-gray-500">Total Deeds</p>
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
                    <p className="text-sm text-gray-500">Accepted</p>
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
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
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
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{analytics.completionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">Valuation completion rate</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Avg Processing</h3>
                  <Clock className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-3xl font-bold text-indigo-600">{analytics.avgProcessingTime}</p>
                <p className="text-sm text-gray-500 mt-1">Days per valuation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { action: "Accepted valuation", deed: "DEED-2024-045", time: "2 hours ago", status: "completed" },
                    { action: "Estimated property value", deed: "DEED-2024-044", time: "5 hours ago", status: "pending" },
                    { action: "Rejected valuation request", deed: "DEED-2024-043", time: "1 day ago", status: "rejected" },
                    { action: "Completed valuation assessment", deed: "DEED-2024-042", time: "2 days ago", status: "completed" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'completed' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.deed} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVSLHome;

