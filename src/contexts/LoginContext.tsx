import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "../types/types";
import { getItem, removeItem, setItem } from "../storage/storage";


type LoginContextType = {
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  getToken: () => string | null;
  getUser: () => User | null;
  logout: () => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [token, _setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, _setUser] = useState<User | null>(getItem("session", "user"));

  const setToken = (newToken: string | null) => {
    _setToken(newToken);
    if (newToken) {
      setItem("session", "token", newToken);
    } else {
      removeItem("session", "token");
    }
  };

  const setUser = (newUser: User | null) => {
    _setUser(newUser);
    if (newUser) {
      setItem("session", "user", newUser);
    } else {
      removeItem("session", "user");
    }
  };

  const getToken = () => getItem("session", "token") as string;
  const getUser = () => getItem("session", "user") as User;

  const logout = () => {
    setToken(null);
    setUser(null);
    closeLogin();
  };

  const openLogin = () => {
    setIsOpen(true);
    document.body.classList.add("no-scroll");
  };

  const closeLogin = () => {
    setIsOpen(false);
    document.body.classList.remove("no-scroll");
  };

  return (
    <LoginContext.Provider
      value={{
        isOpen,
        openLogin,
        closeLogin,
        token,
        user,
        setToken,
        setUser,
        getToken,
        getUser,
        logout,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error("useLogin must be used within LoginProvider");
  return context;
};
