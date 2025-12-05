import { Menu, X, Home, FileText, Settings, Phone, LogOut, Map } from "lucide-react";
import { useLogin } from "../contexts/LoginContext";
import { useLocation, useNavigate } from "react-router-dom";
import { compressAddress } from "../utils/functions";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useLogin();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { name: "Survey Home", href: "/surveyor", icon: Home, role: "surveyor" },
    { name: "Deeds", href: "/surveyor/deeds", icon: FileText, role: "surveyor" },
    { name: "Plans Map", href: "/plans/map", icon: Map, role: "surveyor" },
    { name: "IVSL Home", href: "/ivsl", icon: Home, role: "IVSL" },
    { name: "Deeds", href: "/ivsl/deeds", icon: FileText, role: "IVSL" },
    { name: "Plans Map", href: "/plans/map", icon: Map, role: "IVSL" },
    { name: "Notary Home", href: "/notary", icon: Home, role: "notary" },
    { name: "Deeds", href: "/notary/deeds", icon: FileText, role: "notary" },
    { name: "Certificates", href: "/notary/certificates", icon: FileText, role: "notary" },
    { name: "Plans Map", href: "/plans/map", icon: Map, role: "notary" },
    { name: "Services", href: "/services", icon: Settings, role: "all" },
    { name: "Contact", href: "/contact", icon: Phone, role: "all" },
  ];

  if (
    !user ||
    user.kycStatus !== "verified" ||
    !user.walletAddress ||
    pathname === "/" ||
    pathname === "/signup"
  ) {
    return null;
  }

  const filteredNavItems = navItems.filter(
    (item) => item.role === "all" || item.role === user.role
  );

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-3 text-white bg-gray-800 hover:bg-gray-700 fixed top-4 left-4 z-50 rounded-lg border border-gray-600 transition-colors shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`
          bg-gray-800 border-r border-gray-700 text-white z-40 transition-all duration-300 shadow-2xl
          lg:relative lg:block
          ${isOpen
            ? "fixed lg:relative top-0 left-0 h-full w-64 translate-x-0"
            : "fixed lg:relative top-0 left-0 h-full w-64 -translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-700 ml-12 lg:ml-0">
            <h2 className="text-xl font-bold capitalize text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              {user.role}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Licensed Professional</p>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <nav className="flex flex-col p-4 space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-green-600 text-white shadow-lg"
                        : "hover:bg-gray-700 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </a>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-700">
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Wallet Status</div>
                <div className="text-sm font-medium text-green-400">Connected</div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {compressAddress(user.walletAddress)}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
