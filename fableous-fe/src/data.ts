import { Achievement } from "./components/achievement/achievement";
import { TextShapeMap } from "./components/canvas/data";
import { proto as pb } from "./proto/message_pb";

export interface APIResponse<T> {
  code?: number;
  data?: T;
  error?: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface Register {
  name: string;
  email: string;
  password: string;
  password2: string;
}

export interface User {
  name: string;
  email: string;
}

export interface Classroom {
  id: string;
  name: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  pages: number;
  nameStory: string;
  nameCharacter: string;
  nameBackground: string;
  completed: boolean;
  createdAt: string;
}

export interface ControllerJoin {
  name: string;
  token: string;
  role: pb.ControllerRole;
}
export interface Manifest {
  texts: TextShapeMap;
  audios: string[];
  achievements: Achievement;
}

export interface Story {
  title: string;
  description: string;
  pages: number;
}
