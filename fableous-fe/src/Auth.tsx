import { useState } from "react";

export const TOKEN_KEY = "token";

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
