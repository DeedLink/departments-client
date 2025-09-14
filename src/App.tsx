import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { WalletProvider } from "./contexts/WalletContext";
import { LoginProvider } from "./contexts/LoginContext";
import SurveyorHome from "./pages/surveyor/SurveyorHome";
import { ToastProvider } from "./contexts/ToastContext";
import Sidebar from "./components/sidebar";

export default function App() {
  return (
    <div className="font-spectral w-full min-h-screen h-full bg-black">
      <ToastProvider>
        <LoginProvider>
          <WalletProvider>
            <Sidebar/>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/surveyor" element={<SurveyorHome />} />
            </Routes>
          </WalletProvider>
        </LoginProvider>
      </ToastProvider>
    </div>
  );
}
