export interface WSMessage {
  role: ControllerRole;
  type: WSMessageType;
  data: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    text?: string;
    colour?: string;
    width?: number;
  };
}

export enum WSMessageType {
  Paint = "PAINT",
  Text = "TEXT",
  Audio = "AUDIO",
  Connect = "CONNECT",
  Control = "CONTROL",
  Ping = "PING",
}

export enum ControllerRole {
  Character = "CHARACTER",
  Background = "BACKGROUND",
  Story = "STORY",
  Hub = "HUB",
}
