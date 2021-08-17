import { useState } from "react";

const TOKEN_KEY = "token";

// const auth = {
//   saveToken: (token: AxiosResponse<any>) => {
//     localStorage.setItem(TOKEN_KEY, token.headers.authorization);
//   },
//   getToken: () => {
//     return localStorage.getItem(TOKEN_KEY) || "";
//   },
//   clearToken: () => {
//     localStorage.removeItem(TOKEN_KEY);
//   },
//   isAuthenticated: () => {
//     return !!auth.getToken();
//   },
// };

export default function useAuth(): [boolean, string, (token: string) => void] {
  const [token, setToken] = useState<string>(
    localStorage.getItem(TOKEN_KEY) || ""
  );

  const saveToken = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  return [token !== "", token, saveToken];
}
