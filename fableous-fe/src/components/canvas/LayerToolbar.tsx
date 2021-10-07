import { makeStyles, Paper } from "@material-ui/core";
import { StudentRole } from "../../constant";
import { proto as pb } from "../../proto/message_pb";
import LayerIcon from "./LayerIcon";

const useStyles = makeStyles(() => ({
  hideScrollbar: {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": {
      width: 0,
      height: 0,
    },
  },
}));

export default function LayerToolbar(props: {
  offsetHeight?: string;
  focusLayer: StudentRole | undefined;
  setFocusLayer: React.Dispatch<React.SetStateAction<StudentRole | undefined>>;
  joinedControllers: {
    [key in StudentRole]?: string;
  };
  helpControllers: {
    [key in StudentRole]: boolean;
  };
  setHelpControllers: React.Dispatch<
    React.SetStateAction<
      {
        [key in StudentRole]: boolean;
      }
    >
  >;
  doneControllers: {
    [key in StudentRole]: boolean;
  };
}) {
  const {
    offsetHeight,
    focusLayer,
    setFocusLayer,
    joinedControllers,
    helpControllers,
    setHelpControllers,
    doneControllers,
  } = props;

  const classes = useStyles();

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <div
        className={`overflow-y-scroll overflow-x-hidden  ${classes.hideScrollbar}`}
        style={{
          height: offsetHeight || "100%",
          maxHeight: "100%",
          maxWidth: "100px",
        }}
      >
        <Paper className="p-1 flex flex-col justify-evenly items-center min-h-full px-2 items-stretch">
          {[
            pb.ControllerRole.STORY,
            pb.ControllerRole.CHARACTER,
            pb.ControllerRole.BACKGROUND,
          ].map((role) => (
            <LayerIcon
              studentRole={role as StudentRole}
              focusLayer={focusLayer}
              setFocusLayer={setFocusLayer}
              onClick={() =>
                setHelpControllers({
                  ...helpControllers,
                  [role]: false,
                })
              }
              joinedControllers={joinedControllers}
              handleKickController={() => {}}
              needsHelp={helpControllers[role as StudentRole]}
              isDone={doneControllers[role as StudentRole]}
            />
          ))}
        </Paper>
      </div>
    </div>
  );
}

LayerToolbar.defaultProps = {
  offsetHeight: "100%",
};
