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
import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
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

interface LayerIconProps {
  studentRole: StudentRole;
  focusLayer: StudentRole | undefined;
  setFocusLayer: React.Dispatch<React.SetStateAction<StudentRole | undefined>>;
  onClick: () => void;
  joinedControllers: {
    [key in pb.ControllerRole]?: string | null;
  };
  handleClearController: (role: StudentRole) => void;
  handleKickController: (role: StudentRole) => void;
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
    handleClearController,
    handleKickController,
    needsHelp,
    isDone,
  } = props;

  const [kicking, setKicking] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const notifyLayerFocus = (role: StudentRole) => {
    enqueueSnackbar(
      `Focusing on ${ROLE_ICON[role].text}'s drawing. Click on layer icon again to unfocus.`,
      {
        variant: "info",
      }
    );
  };

  const currentController = joinedControllers[studentRole];
  useEffect(() => {
    setKicking(false);
    setFocusLayer(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentController]);

  const classes = useStyles();

  return (
    <>
      <ToolbarTooltip
        tooltipTitle={
          <div className="flex">
            <Button
              className={classes.clearButton}
              startIcon={<Icon>delete</Icon>}
              onClick={() => handleClearController(studentRole)}
            >
              Clear
            </Button>
            {joinedControllers[studentRole] && (
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
              setFocusLayer(() => {
                if (focusLayer === studentRole) {
                  return undefined;
                }
                notifyLayerFocus(studentRole as StudentRole);
                return studentRole;
              });
              onClick();
            }}
          >
            <Icon fontSize="large">{ROLE_ICON[studentRole].icon}</Icon>
          </IconButton>
          <Typography
            variant="subtitle1"
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
            onClick={() => {
              handleKickController(studentRole);
              setKicking(false);
            }}
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
