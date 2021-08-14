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

export interface WSControlMessageData {
  classroomToken?: string;
  classroomId?: string;
  sessionId?: string;
  nextPage?: boolean;
}

export enum WSMessageType {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
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
