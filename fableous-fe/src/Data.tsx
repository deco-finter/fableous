export interface WSMessage {
  role: ControllerRole;
  type: WSMessageType;
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
}

// for WSMessageType.Join
export interface WSJoinMessageData {
  role: ControllerRole;
  name?: string;
  joining: boolean;
}

export enum WSMessageType {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
  Checkpoint = "CHECKPOINT",
  Undo = "UNDO",
  Cursor = "CURSOR",
  Connect = "CONNECT",
  Join = "JOIN",
  Control = "CONTROL",
  Ping = "PING",
}

export enum ToolMode {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
  None = "NONE",
}

export enum ControllerRole {
  Character = "CHARACTER",
  Background = "BACKGROUND",
  Story = "STORY",
  Hub = "HUB",
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
  completed: boolean;
  createdAt: string;
}

export interface ControllerJoin {
  name: string;
  token: string;
  role: ControllerRole;
}

export interface Story {
  title: string;
  description: string;
  pages: number;
}
