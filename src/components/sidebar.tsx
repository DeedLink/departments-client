import { Menu, X } from "lucide-react";
import { useLogin } from "../contexts/LoginContext";
import { useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useLogin();
  const { pathname } = useLocation();

  const navItems = [
    { name: "Survey Home", href: "/surveyor" },
    { name: "About", href: "#" },
    { name: "Services", href: "#" },
    { name: "Contact", href: "#" },
  ];

  if (
    !user ||
    user.role !== "surveyor" ||
    user.kycStatus !== "verified" ||
    !user.walletAddress ||
    pathname === "/" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-3 text-white bg-black fixed top-4 left-4 z-50 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`
          bg-blue text-white z-40 transition-all duration-300
          lg:relative lg:block
          ${isOpen ?
            'fixed lg:relative top-0 left-0 h-full w-64 translate-x-0' : 
            'fixed lg:relative top-0 left-0 h-full w-64 -translate-x-full lg:translate-x-0'
          }
        `}
      >
        <div className={`h-full`}>
          <div className="p-6 text-2xl font-bold border-b border-gray-700">
            My Sidebar
          </div>
          <ul className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className="block px-4 py-2 rounded-lg hover:bg-green-500 active:bg-red-600 whitespace-nowrap"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;