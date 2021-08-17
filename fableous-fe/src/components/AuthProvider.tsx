import { createContext, ReactNode, useState } from "react";

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
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const { children } = props;

  return (
    <AuthContext.Provider
      value={[
        token,
        token !== "",
        (t: string) => {
          localStorage.setItem(TOKEN_KEY, t);
          setToken(t);
        },
        () => {
          localStorage.setItem(TOKEN_KEY, "");
          setToken("");
        },
      ]}
    >
      {children}
    </AuthContext.Provider>
  );
}
