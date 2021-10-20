import { Styles } from "react-joyride";
import { colors } from "./colors";
import { proto as pb } from "./proto/message_pb";

export enum ToolMode {
  Paint = "PAINT",
  Fill = "FILL",
  Text = "TEXT",
  Audio = "AUDIO",
  None = "NONE",
}

export type StudentRole = Exclude<
  pb.ControllerRole,
  pb.ControllerRole.NONE | pb.ControllerRole.HUB
>;

export const ROLE_ICON = {
  [pb.ControllerRole.NONE]: {
    icon: "",
    text: "",
  },
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

export const TUTORIAL_STYLE: Styles = {
  options: {
    primaryColor: colors.orange.main,
    zIndex: 10000,
  },
  buttonNext: {
    borderRadius: 18,
  },
  tooltip: {
    borderRadius: 24,
  },
  spotlight: {
    borderRadius: 48,
  },
};
