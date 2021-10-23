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

/**
 * Provides centralised auth info and helper functions to manage it.
 * Centralisation allows different components to stay up-to-date with auth status.
 */
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
