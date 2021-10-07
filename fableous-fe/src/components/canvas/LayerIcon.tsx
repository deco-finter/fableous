/* eslint-disable no-nested-ternary */
import { Icon, IconButton, Typography } from "@material-ui/core";
import React from "react";
import { colors } from "../../colors";
import { ROLE_ICON, StudentRole } from "../../constant";
import { proto as pb } from "../../proto/message_pb";

interface LayerIconProps extends React.HTMLAttributes<HTMLDivElement> {
  studentRole: StudentRole;
  focusLayer: StudentRole | undefined;
  setFocusLayer: React.Dispatch<React.SetStateAction<StudentRole | undefined>>;
  onClick: () => void;
  joinedControllers: {
    [key in pb.ControllerRole]?: string | null;
  };
  needsHelp: boolean;
  isDone: boolean;
}

export default React.forwardRef(function LayerIcon(
  props: LayerIconProps,
  ref: React.LegacyRef<any>
) {
  const {
    studentRole,
    focusLayer,
    setFocusLayer,
    onClick,
    joinedControllers,
    needsHelp,
    isDone,
  } = props;

  return (
    <div
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      ref={ref}
      className="flex flex-col justify-center items-center relative"
    >
      <IconButton
        style={{
          color:
            focusLayer === studentRole
              ? colors.orange.main
              : !focusLayer && joinedControllers[studentRole]
              ? colors.blue.main
              : colors.gray.main,
        }}
        disabled={!joinedControllers[studentRole]}
        onClick={() => {
          setFocusLayer(focusLayer === studentRole ? undefined : studentRole);
          onClick();
        }}
      >
        <Icon fontSize="large">{ROLE_ICON[studentRole].icon}</Icon>
      </IconButton>
      <Typography
        variant="subtitle2"
        className="-mt-4 font-bold pointer-events-none"
        style={{
          color:
            focusLayer === studentRole
              ? colors.orange.main
              : !focusLayer && joinedControllers[studentRole]
              ? colors.blue.main
              : colors.gray.main,
        }}
      >
        {ROLE_ICON[studentRole].text}
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
});
