import { createContext, useContext, useState, type ReactNode } from "react";

type SignupContextType = {
  isOpen: boolean;
  openSignup: () => void;
  closeSignup: () => void;
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export const SignupProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSignup = () => {
    setIsOpen(true);
    document.body.classList.add("no-scroll");
  };

  const closeSignup = () => {
    setIsOpen(false);
    document.body.classList.remove("no-scroll");
  };

  return (
    <SignupContext.Provider value={{ isOpen, openSignup, closeSignup }}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) throw new Error("useSignup must be used within SignupProvider");
  return context;
};
