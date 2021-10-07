/* eslint-disable no-nested-ternary */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { useState } from "react";
import { colors } from "../../colors";
import { ROLE_ICON, StudentRole } from "../../constant";
import { proto as pb } from "../../proto/message_pb";
import ToolbarTooltip from "./ToolbarTooltip";

const useStyles = makeStyles(() => ({
  clearButton: {
    color: colors.warning,
    margin: 4,
  },
  kickButton: {
    color: colors.error,
    margin: 4,
  },
}));

interface LayerIconProps extends React.HTMLAttributes<HTMLDivElement> {
  studentRole: StudentRole;
  focusLayer: StudentRole | undefined;
  setFocusLayer: React.Dispatch<React.SetStateAction<StudentRole | undefined>>;
  onClick: () => void;
  joinedControllers: {
    [key in pb.ControllerRole]?: string | null;
  };
  handleKickController: (studentRole: StudentRole) => void;
  needsHelp: boolean;
  isDone: boolean;
}

export default function LayerIcon(props: LayerIconProps) {
  const {
    studentRole,
    focusLayer,
    setFocusLayer,
    onClick,
    joinedControllers,
    handleKickController,
    needsHelp,
    isDone,
  } = props;

  const [kicking, setKicking] = useState(false);

  const classes = useStyles();

  return (
    <>
      <ToolbarTooltip
        tooltipTitle={
          <div className="flex">
            <Button
              className={classes.clearButton}
              startIcon={<Icon>delete</Icon>}
            >
              Clear
            </Button>
            {joinedControllers[studentRole as StudentRole] && (
              <Button
                className={classes.kickButton}
                startIcon={<Icon>person_remove</Icon>}
                onClick={() => setKicking(true)}
              >
                Kick
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-col justify-center items-center relative">
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
              setFocusLayer(
                focusLayer === studentRole ? undefined : studentRole
              );
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
      </ToolbarTooltip>
      <Dialog open={kicking} onClose={() => setKicking(false)}>
        <DialogTitle>Kick student?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to kick{" "}
            <strong>{joinedControllers[studentRole]}</strong> playing as{" "}
            <strong>{ROLE_ICON[studentRole].text}</strong>? This will also clear
            their drawing.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKicking(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => handleKickController(studentRole)}
            style={{
              color: colors.error,
            }}
            startIcon={<Icon fontSize="small">person_remove</Icon>}
          >
            Kick
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
