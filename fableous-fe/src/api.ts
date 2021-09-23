import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
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

const apiClient = axios.create();
apiClient.defaults.baseURL = baseAPI;
apiClient.interceptors.request.use((req: AxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req.headers = {
      authorization: `Bearer ${token}`,
    };
  }
  return req;
}, Promise.reject);

export const setupResponseInterceptor = (onTokenExpired: () => void) => {
  apiClient.interceptors.response.use(
    (resp: AxiosResponse) => resp,
    (err: any) => {
      if (
        err.response?.status === 401 &&
        err.response?.data?.error?.includes("token has expired")
      ) {
        onTokenExpired();
      }
      return Promise.reject(err);
    }
  );
};

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
  user: {
    get: () => ({
      url: "/api/user",
      method: "get",
    }),
    update: () => ({
      url: "/api/user",
      method: "put",
    }),
  },
  classroom: {
    getList: () => ({
      url: "/api/classroom/",
      method: "get",
    }),
    getOne: (id: string) => ({
      url: `/api/classroom/${id}`,
      method: "get",
    }),
    create: () => ({
      url: "/api/classroom/",
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
  gallery: {
    getAsset: (
      classroomId: string,
      sessionId: string,
      pageNumber: number,
      name: string
    ) =>
      restAPI.gallery.getAssetByPath(
        `${classroomId}/${sessionId}/${pageNumber}/${name}`
      ),
    getAssetByPath: (path: string) => ({
      url: `${baseAPI}/api/gallery/assets/${path}`,
      method: "get",
    }),
  },
  session: {
    getOngoing: (classroomId: string) => ({
      url: `/api/classroom/${classroomId}/session/ongoing`,
      method: "get",
    }),
    getList: (classroomId: string) => ({
      url: `/api/classroom/${classroomId}/session`,
      method: "get",
    }),
    getOne: (classroomId: string, sessionId: string) => ({
      url: `/api/classroom/${classroomId}/session/${sessionId}`,
      method: "get",
    }),
    create: (classroomId: string) => ({
      url: `/api/classroom/${classroomId}/session`,
      method: "post",
    }),
    update: (classroomId: string, sessionId: string) => ({
      url: `/api/classroom/${classroomId}/session/${sessionId}`,
      method: "put",
    }),
    delete: (classroomId: string, sessionId: string) => ({
      url: `/api/classroom/${classroomId}/session/${sessionId}`,
      method: "delete",
    }),
  },
  // @TODO: create POST for story saving
} as ApiEndpoints;

export const wsAPI = {
  hub: {
    main: (classroomId: string) => {
      const token = localStorage.getItem(TOKEN_KEY);
      return `${baseWS}/ws/hub?token=${token}&classroom_id=${classroomId}`;
    },
  },
  controller: {
    main: (classroomToken: string, role: string, name: string) => {
      return `${baseWS}/ws/controller?classroom_token=${classroomToken}&role=${role}&name=${name}`;
    },
  },
};
