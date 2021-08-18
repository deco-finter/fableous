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
