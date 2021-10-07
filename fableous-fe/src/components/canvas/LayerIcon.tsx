/* eslint-disable no-nested-ternary */
import { Icon, IconButton, Typography } from "@material-ui/core";
import { colors } from "../../colors";
import { ROLE_ICON, StudentRole } from "../../constant";
import { proto as pb } from "../../proto/message_pb";

export default function LayerIcon(props: {
  role: StudentRole;
  focusLayer: StudentRole | undefined;
  setFocusLayer: React.Dispatch<React.SetStateAction<StudentRole | undefined>>;
  onClick: () => void;
  joinedControllers: {
    [key in pb.ControllerRole]?: string | null;
  };
  needsHelp: boolean;
  isDone: boolean;
}) {
  const {
    role,
    focusLayer,
    setFocusLayer,
    onClick,
    joinedControllers,
    needsHelp,
    isDone,
  } = props;

  return (
    <div className="flex flex-col justify-center items-center relative">
      <IconButton
        style={{
          color:
            focusLayer === role
              ? colors.orange.main
              : !focusLayer && joinedControllers[role]
              ? colors.blue.main
              : colors.gray.main,
        }}
        disabled={!joinedControllers[role]}
        onClick={() => {
          setFocusLayer(focusLayer === role ? undefined : role);
          onClick();
        }}
      >
        <Icon fontSize="large">{ROLE_ICON[role].icon}</Icon>
      </IconButton>
      <Typography
        variant="subtitle2"
        className="-mt-4 font-bold pointer-events-none"
        style={{
          color:
            focusLayer === role
              ? colors.orange.main
              : !focusLayer && joinedControllers[role]
              ? colors.blue.main
              : colors.gray.main,
        }}
      >
        {ROLE_ICON[role].text}
      </Typography>
      {needsHelp && (
        <Icon
          className="absolute top-1 left-1 pointer-events-none"
          style={{ color: colors.blue.light }}
        >
          pan_tool
        </Icon>
      )}
      {isDone && (
        <Icon
          className="absolute top-1 right-1 pointer-events-none"
          style={{ color: colors.green }}
        >
          check_circle
        </Icon>
      )}
    </div>
  );
}
