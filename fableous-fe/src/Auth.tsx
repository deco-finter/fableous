import { useCallback, useEffect, useState } from "react";

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

interface Auth {
  isAuthenticated: () => boolean;
  getToken: () => string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  logout: () => void;
}

export default function useAuth(): Auth {
  const [token, setToken] = useState<string>(
    localStorage.getItem(TOKEN_KEY) || ""
  );

  const isAuthenticated = useCallback(() => token !== "", [token]);

  const getToken = useCallback(() => token, [token]);

  const logout = () => {
    setToken("");
    localStorage.removeItem(TOKEN_KEY);
  };

  useEffect(() => {
    localStorage.setItem(TOKEN_KEY, token);
  }, [token]);

  return {
    isAuthenticated,
    getToken,
    setToken,
    logout,
  };
}
