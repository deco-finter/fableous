import { AxiosResponse } from "axios";

const TOKEN_KEY = "token";

const auth = {
  saveToken: (token: AxiosResponse<any>) => {
    localStorage.setItem(TOKEN_KEY, token.headers.authorization);
  },
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY) || "";
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  isAuthenticated: () => {
    return !!auth.getToken();
  },
};

export default auth;
