import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLogin } from "../contexts/LoginContext";
import { useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useLogin();
  const { pathname } = useLocation();

  const navItems = [
    { name: "Survey Home", href: "/surveyor/home" },
    { name: "About", href: "#" },
    { name: "Services", href: "#" },
    { name: "Contact", href: "#" },
  ];

  if(!user || user.role !== "surveyor" || user.kycStatus !== "verified" || !user.walletAddress || pathname === "/" || pathname === "/signup") {
    return null;
  };

  return (
    <div className="flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-3 text-white bg-black fixed top-4 left-4 z-50 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-black text-white transform transition-transform duration-300 z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-6 text-2xl font-bold border-b border-gray-700">
          My Sidebar
        </div>
        <ul className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className="block px-4 py-2 rounded-lg hover:bg-green-500 active:bg-red-600"
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        ></div>
      )}
    </div>
  );
};

export default Sidebar;
