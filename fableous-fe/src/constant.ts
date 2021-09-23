export enum WSMessageType {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
  Checkpoint = "CHECKPOINT",
  Undo = "UNDO",
  Cursor = "CURSOR",
  Achievement = "ACHIEVEMENT",
  Connect = "CONNECT",
  Join = "JOIN",
  Control = "CONTROL",
  Ping = "PING",
  Image = "IMAGE",
  Manifest = "MANIFEST",
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

export const ROLE_ICON = {
  [ControllerRole.Story]: {
    icon: "textsms",
    text: "Story",
  },
  [ControllerRole.Character]: {
    icon: "directions_run",
    text: "Character",
  },
  [ControllerRole.Background]: {
    icon: "image",
    text: "Background",
  },
  [ControllerRole.Hub]: {
    icon: "web",
    text: "Background",
  },
};
