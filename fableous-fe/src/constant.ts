import { proto as pb } from "./proto/message_pb";

export enum ToolMode {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
  None = "NONE",
}

export type StudentRole = Exclude<pb.ControllerRole, pb.ControllerRole.HUB>;

export const ROLE_ICON = {
  [pb.ControllerRole.STORY]: {
    icon: "textsms",
    text: "Story",
  },
  [pb.ControllerRole.CHARACTER]: {
    icon: "directions_run",
    text: "Character",
  },
  [pb.ControllerRole.BACKGROUND]: {
    icon: "image",
    text: "Background",
  },
  [pb.ControllerRole.HUB]: {
    icon: "web",
    text: "Background",
  },
};
