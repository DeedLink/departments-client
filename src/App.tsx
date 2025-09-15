import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { WalletProvider } from "./contexts/WalletContext";
import { LoginProvider } from "./contexts/LoginContext";
import SurveyorHome from "./pages/surveyor/SurveyorHome";
import { ToastProvider } from "./contexts/ToastContext";
import Sidebar from "./components/sidebar";
import { useState } from "react";

export default function App() {
  const [sidebarwidth, _setSidebarWidth] = useState(250);

  return (
    <div className="font-spectral w-full min-h-screen h-full bg-black">
      <ToastProvider>
        <LoginProvider>
          <WalletProvider>
            <div className="flex items-center justify-between">
              <Sidebar sidebarwidth={sidebarwidth} />
              <div className="bg-white h-full min-h-screen" style={{ width: `calc(100% - ${sidebarwidth}px)` }}>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/surveyor" element={<SurveyorHome />} />
                </Routes>
              </div>
            </div>
          </WalletProvider>
        </LoginProvider>
      </ToastProvider>
    </div>
  );
}
