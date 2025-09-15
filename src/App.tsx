import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { WalletProvider } from "./contexts/WalletContext";
import { LoginProvider } from "./contexts/LoginContext";
import SurveyorHome from "./pages/surveyor/SurveyorHome";
import { ToastProvider } from "./contexts/ToastContext";
import Sidebar from "./components/SideBar";
import { LoaderProvider } from "./contexts/LoaderContext";
import SurveyorDeeds from "./pages/surveyor/SurveyorDeeds";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="font-spectral w-full min-h-screen h-full" style={{ backgroundImage: `url('/images/bg.png')`, backgroundSize: 'cover' }}>
      <ToastProvider>
        <LoginProvider>
          <WalletProvider>
            <div className="flex min-h-screen">
              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
              {sidebarOpen && (
                <div
                  className="lg:hidden fixed inset-0 backdrop-blur-sm z-30"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <div className="flex-1 min-h-screen relative z-10">
                <LoaderProvider>
                  <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/surveyor" element={<SurveyorHome />} />
                    <Route path="/surveyor/deeds" element={<SurveyorDeeds />} />
                  </Routes>
                </LoaderProvider>
              </div>
            </div>
          </WalletProvider>
        </LoginProvider>
      </ToastProvider>
    </div>
  );
}
