import axios, { AxiosRequestConfig } from "axios";
import { configure } from "axios-hooks";

const baseAPI =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_BACKENDURL
    : "";

const baseWS =
  process.env.NODE_ENV === "development"
    ? `${process.env.REACT_APP_BACKENDWS}`
    : `wss://${window.location.hostname}`;

const apiClient = axios.create({
  baseURL: baseAPI,
});
apiClient.interceptors.request.use((req: AxiosRequestConfig) => {
  // TODO change this to func from Auth.tsx
  req.headers.Authorization = `Bearer ${localStorage.getItem("authorization")}`;
  return req;
}, Promise.reject);

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

export const restAPI = {
  // TODO move to classroom category
  hub: {
    postSessionInfo: (classroomId: string) => ({
      url: `/api/classroom/${classroomId}/session`,
      method: "post",
    }),
  },
  classroom: {
    getOnGoingSession: (classroomId: string) => ({
      url: `/api/classroom/${classroomId}/session/ongoing`,
      method: "get",
    }),
  },
} as ApiEndpoints;

export const wsAPI = {
  hub: {
    main: (classroomId: string) => {
      // TODO change this to func from Auth.tsx
      const token = localStorage.getItem("authorization");
      return `${baseWS}/ws/hub?token=${token}&classroom_id=${classroomId}`;
    },
  },
  controller: {
    main: (classroomToken: string, role: string, name: string) => {
      return `${baseWS}/ws/controller?classroom_token=${classroomToken}&role=${role}&name=${name}`;
    },
  },
};
