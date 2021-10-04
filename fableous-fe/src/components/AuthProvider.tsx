import { createContext, ReactNode, useState } from "react";
import { getLocalStorage, setLocalStorage } from "../storage";

export const TOKEN_KEY = "token";

export type AuthContextType = [
  token: string,
  isAuthenticated: boolean,
  setToken: (token: string) => void,
  clearToken: () => void
];

export const AuthContext = createContext<AuthContextType>([
  "",
  false,
  (_) => {},
  () => {},
]);

export default function AuthProvider(props: { children: ReactNode }) {
  const [token, setToken] = useState(getLocalStorage(TOKEN_KEY) || "");
  const { children } = props;

  return (
    <AuthContext.Provider
      value={[
        token,
        token !== "",
        (t: string) => {
          setLocalStorage(TOKEN_KEY, t);
          setToken(t);
        },
        () => {
          setLocalStorage(TOKEN_KEY, "");
          setToken("");
        },
      ]}
    >
      {children}
    </AuthContext.Provider>
  );
}
