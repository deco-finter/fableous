import { forwardRef, MutableRefObject, useEffect, useState } from "react";
import Paper from "@material-ui/core/Paper";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import MicIcon from "@material-ui/icons/Mic";
import PaletteIcon from "@material-ui/icons/Palette";
import UndoIcon from "@material-ui/icons/Undo";
import BrushIcon from "@material-ui/icons/Brush";
import StopIcon from "@material-ui/icons/Stop";
import FormatColorFillIcon from "@material-ui/icons/FormatColorFill";
import { Button, IconButton, makeStyles, Typography } from "@material-ui/core";
import EraserIcon from "./EraserIcon";
import { ControllerRole, ToolMode } from "../../constant";
import { ImperativeCanvasRef } from "./data";
import BrushWidthIcon from "./BrushWidthIcon";
import CanvasToolbarTooltip from "./CanvasToolbarTooltip";

interface CanvasToolbarProps {
  role: ControllerRole;
  offsetHeight?: string;
  toolMode: ToolMode;
  setToolMode: React.Dispatch<React.SetStateAction<ToolMode>>;
  toolColor: string;
  setToolColor: React.Dispatch<React.SetStateAction<string>>;
  toolWidth: number;
  setToolWidth: React.Dispatch<React.SetStateAction<number>>;
}

const COLORS = [
  "#000000ff", // black
  "#ff0000ff", // red
  "#ffff00ff", // yellow
  "#00ff00ff", // green
  "#00ffffff", // cyan
  "#0000ffff", // blue
];
const ERASE_COLOR = "#00000000";
const BRUSH_WIDTHS = [4, 8, 12, 16, 20];
const ICON_STROKE_WIDTH_RATIO = 1 / 4;

const useStyles = makeStyles({
  hideScrollbar: {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": {
      width: 0,
      height: 0,
    },
  },
  unsetMaxWidth: {
    maxWidth: "none",
  },
});

const CanvasToolbar = forwardRef<ImperativeCanvasRef, CanvasToolbarProps>(
  (props: CanvasToolbarProps, ref) => {
    const {
      role,
      toolMode,
      setToolMode,
      toolColor,
      setToolColor,
      toolWidth,
      setToolWidth,
      offsetHeight,
    } = props;
    const imperativeCanvasRef = ref as MutableRefObject<ImperativeCanvasRef>;
    const [prevColor, setPrevColor] = useState(toolColor);
    const [isWidthPickerOpen, setIsWidthPickerOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [recordingTimeElapsed, setRecordingTimeElapsed] = useState(0);

    const setToolColorRememberPrev = (nextColor: string) => {
      setToolColor((prev) => {
        if (prev !== ERASE_COLOR) {
          setPrevColor(prev);
        }
        return nextColor;
      });
    };

    const showMmSsFromSeconds = (seconds: number) =>
      new Date(seconds * 1000).toISOString().substr(14, 5);

    useEffect(() => {
      if (!isRecordingAudio) {
        setRecordingTimeElapsed(0);
        return () => {};
      }

      const interval = setInterval(
        () => setRecordingTimeElapsed((prev) => prev + 1),
        1000
      );
      return () => {
        clearInterval(interval);
      };
    }, [isRecordingAudio]);

    const classes = useStyles();

    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div
          className={`overflow-y-scroll overflow-x-hidden ${classes.hideScrollbar}`}
          style={{
            height: offsetHeight || "100%",
            maxHeight: "100%",
            maxWidth: "80px",
          }}
        >
          <Paper className="p-1 flex flex-col justify-evenly items-center min-h-full">
            {[ControllerRole.Character, ControllerRole.Background].includes(
              role
            ) && (
              <>
                <CanvasToolbarTooltip
                  isOpen={isWidthPickerOpen}
                  setIsOpen={setIsWidthPickerOpen}
                  tooltipTitle={
                    <div className="flex">
                      {BRUSH_WIDTHS.map((brushWidth) => (
                        <IconButton
                          onClick={() => {
                            setToolWidth(brushWidth);
                            setIsWidthPickerOpen(false);
                          }}
                          color="primary"
                          key={brushWidth}
                        >
                          <BrushWidthIcon
                            fontSize="medium"
                            strokeWidth={brushWidth * ICON_STROKE_WIDTH_RATIO}
                          />
                        </IconButton>
                      ))}
                    </div>
                  }
                >
                  <IconButton
                    className="relative"
                    onClick={() => {
                      if (toolColor === ERASE_COLOR) {
                        setToolColor(prevColor);
                      }
                      setToolMode(ToolMode.Paint);
                      setIsWidthPickerOpen((prev) => !prev);
                    }}
                    color={
                      toolMode === ToolMode.Paint && toolColor !== "#00000000"
                        ? "secondary"
                        : "primary"
                    }
                  >
                    <BrushIcon fontSize="large" />
                    <BrushWidthIcon
                      fontSize="small"
                      className="absolute bottom-1 right-1"
                      color={
                        toolMode === ToolMode.Paint && toolColor !== "#00000000"
                          ? "secondary"
                          : "primary"
                      }
                      strokeWidth={toolWidth * ICON_STROKE_WIDTH_RATIO}
                    />
                  </IconButton>
                </CanvasToolbarTooltip>
                <IconButton
                  onClick={() => {
                    setToolColorRememberPrev(ERASE_COLOR);
                    setToolMode(ToolMode.Paint);
                  }}
                  color={
                    toolMode === ToolMode.Paint && toolColor === "#00000000"
                      ? "secondary"
                      : "primary"
                  }
                >
                  <EraserIcon fontSize="medium" />
                </IconButton>
                <IconButton
                  onClick={() => {
                    if (toolColor === ERASE_COLOR) {
                      setToolColor(prevColor);
                    }
                    setToolMode(ToolMode.Fill);
                  }}
                  color={toolMode === ToolMode.Fill ? "secondary" : "primary"}
                >
                  <FormatColorFillIcon fontSize="large" />
                </IconButton>
                <CanvasToolbarTooltip
                  isOpen={isColorPickerOpen}
                  setIsOpen={setIsColorPickerOpen}
                  // cannot use tailwind classes due to using mui portal so tooltip works corrrectly eventhough overflow set in parent
                  tooltipTitle={
                    <div
                      style={{
                        display: "flex",
                      }}
                    >
                      {COLORS.map((color) => (
                        <Button
                          component="div"
                          onClick={() => {
                            setToolColorRememberPrev(color);
                            setIsColorPickerOpen(false);
                          }}
                          style={{
                            backgroundColor: color,
                            width: "50px",
                            height: "50px",
                            padding: 0,
                            marginLeft: "0.5rem",
                            minWidth: "auto",
                            borderRadius: 0,
                          }}
                          key={color}
                        />
                      ))}
                    </div>
                  }
                >
                  <IconButton
                    onClick={() => setIsColorPickerOpen((prev) => !prev)}
                    color="primary"
                    className="relative"
                  >
                    <PaletteIcon fontSize="large" />
                    <StopIcon
                      style={{
                        color:
                          toolColor === ERASE_COLOR ? prevColor : toolColor,
                      }}
                      fontSize="small"
                      className="absolute bottom-1 right-1"
                    />
                  </IconButton>
                </CanvasToolbarTooltip>
                <IconButton
                  onClick={imperativeCanvasRef.current.runUndo}
                  color="primary"
                >
                  <UndoIcon fontSize="large" />
                </IconButton>
              </>
            )}
            {role === ControllerRole.Story && (
              <>
                <IconButton
                  onClick={() => setToolMode(ToolMode.Text)}
                  color={toolMode === ToolMode.Text ? "secondary" : "primary"}
                >
                  <TextFieldsIcon fontSize="large" />
                </IconButton>
                <CanvasToolbarTooltip
                  isOpen={isRecordingAudio}
                  setIsOpen={setIsRecordingAudio}
                  tooltipTitle={
                    <Typography variant="body1">
                      {showMmSsFromSeconds(recordingTimeElapsed)}
                    </Typography>
                  }
                >
                  <IconButton
                    onClick={() => {
                      setToolMode(ToolMode.Audio);
                      setIsRecordingAudio((prev) => {
                        // need to exec func directly from imperativeCanvasRef
                        // to get up-to-date callback
                        imperativeCanvasRef.current.runAudio();
                        return !prev;
                      });
                    }}
                    color={
                      toolMode === ToolMode.Audio ? "secondary" : "primary"
                    }
                  >
                    {isRecordingAudio ? (
                      <StopIcon fontSize="large" />
                    ) : (
                      <MicIcon fontSize="large" />
                    )}
                  </IconButton>
                </CanvasToolbarTooltip>
                <IconButton
                  onClick={imperativeCanvasRef.current.runUndo}
                  color="primary"
                >
                  <UndoIcon fontSize="large" />
                </IconButton>
              </>
            )}
          </Paper>
        </div>
      </div>
    );
  }
);

CanvasToolbar.defaultProps = {
  offsetHeight: "100%",
};

export default CanvasToolbar;
