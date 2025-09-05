import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { WalletProvider } from "./contexts/WalletContext";
import { LoginProvider } from "./contexts/LoginContext";

export default function App() {
  return (
    <div className="font-spectral w-full min-h-screen h-full bg-black">
      <LoginProvider>
        <WalletProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </WalletProvider>
      </LoginProvider>
    </div>
  );
}
