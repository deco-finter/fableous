import axios, { AxiosRequestConfig } from "axios";
import { configure } from "axios-hooks";

const baseAPI = process.env.REACT_APP_BACKENDURL;

const apiClient = axios.create({
  baseURL: baseAPI,
});

configure({
  axios: apiClient,
});

// endpoints modelled as a two-level-depth dictionary for organization
// leaf node is a variadic argument function for flexibility
// interface is not unknown-depth dictionary cause not sure how to do that
interface ApiEndpoints {
  [category: string]: {
    [identifier: string]: (...args: any[]) => AxiosRequestConfig;
  };
}

export default {
  canvas: {
    getRandomTheme: () => ({
      url: "/random/theme",
      method: "get",
    }),
  },
} as ApiEndpoints;
