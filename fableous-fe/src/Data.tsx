export interface WSMessage {
  role: ControllerRole;
  type: WSMessageType;
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

export enum WSMessageType {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
  Cursor = "CURSOR",
  Connect = "CONNECT",
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
