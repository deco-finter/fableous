import axios, { AxiosRequestConfig } from "axios";
import { configure } from "axios-hooks";
import { TOKEN_KEY } from "./components/AuthProvider";

const baseAPI =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_BACKENDURL
    : "";

const baseWS =
  process.env.NODE_ENV === "development"
    ? `${process.env.REACT_APP_BACKENDWS}`
    : `wss://${window.location.hostname}`;

const onIntercept = (req: AxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req.headers = {
      authorization: `Bearer ${token}`,
    };
  }
  return req;
};

const apiClient = axios.create();
apiClient.defaults.baseURL = baseAPI;
apiClient.interceptors.request.use(onIntercept, Promise.reject);

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
  canvas: {
    getRandomTheme: () => ({
      url: "/random/theme",
      method: "get",
    }),
  },
  auth: {
    register: () => ({
      url: "/api/auth/register",
      method: "post",
    }),
    login: () => ({
      url: "/api/auth/login",
      method: "post",
    }),
  },
  classroom: {
    getList: () => ({
      url: "/api/classroom",
      method: "get",
    }),
    getOne: (id: string) => ({
      url: `/api/classroom/${id}`,
      method: "get",
    }),
    create: () => ({
      url: "/api/classroom",
      method: "post",
    }),
    update: (id: string) => ({
      url: `/api/classroom/${id}`,
      method: "put",
    }),
    delete: (id: string) => ({
      url: `/api/classroom/${id}`,
      method: "delete",
    }),
  },
  session: {
    getOngoing: (classroomId: string) => ({
      url: `/api/classroom/${classroomId}/session/ongoing`,
      method: "get",
    }),
    delete: (classroomId: string, sessionId: string) => ({
      url: `/api/classroom/${classroomId}/session/${sessionId}`,
      method: "delete",
    }),
  },
} as ApiEndpoints;

export const wsAPI = {
  hub: {
    main: (classroomId: string) => {
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
