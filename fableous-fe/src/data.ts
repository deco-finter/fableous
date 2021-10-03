import { Achievement } from "./components/achievement/achievement";
import { TextShapeMap } from "./components/canvas/data";
import { proto as pb } from "./proto/message_pb";

export interface WSMessage {
  role: pb.ControllerRole;
  type: pb.WSMessageType;
  // TODO change type of data to all possible message data types
  data: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    id?: number;
    text?: string;
    color?: string;
    width?: number;
  };
}

// for WSMessageType.Control
export interface WSControlMessageData {
  classroomToken?: string;
  classroomId?: string;
  sessionId?: string;
  currentPage?: number;
  nextPage?: boolean;
  help?: boolean;
  done?: boolean;
}

// for WSMessageType.Join
export interface WSJoinMessageData {
  role: pb.ControllerRole;
  name?: string;
  joining: boolean;
}

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
