import { forwardRef, MutableRefObject, useEffect, useState } from "react";
import Paper from "@material-ui/core/Paper";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import MicIcon from "@material-ui/icons/Mic";
import PaletteIcon from "@material-ui/icons/Palette";
import UndoIcon from "@material-ui/icons/Undo";
import BrushIcon from "@material-ui/icons/Brush";
import StopIcon from "@material-ui/icons/Stop";
import StopRoundedIcon from "@material-ui/icons/StopRounded";
import FormatColorFillIcon from "@material-ui/icons/FormatColorFill";
import { Button, IconButton, makeStyles, Typography } from "@material-ui/core";
import EraserIcon from "./EraserIcon";
import { ToolMode } from "../../constant";
import { ImperativeCanvasRef } from "./data";
import { proto as pb } from "../../proto/message_pb";
import BrushWidthIcon from "./BrushWidthIcon";
import ToolbarTooltip from "./ToolbarTooltip";
import { TutorialTargetId } from "../../tutorialTargetIds";
import { BRUSH_COLORS, BRUSH_WIDTHS } from "./constants";
import { colors } from "../../colors";

interface CanvasToolbarProps {
  role: pb.ControllerRole;
  offsetHeight?: string;
  toolMode: ToolMode;
  setToolMode: React.Dispatch<React.SetStateAction<ToolMode>>;
  toolColor: string;
  setToolColor: React.Dispatch<React.SetStateAction<string>>;
  toolNormWidth: number;
  setToolNormWidth: React.Dispatch<React.SetStateAction<number>>;
  isShown?: boolean;
}

const ERASE_COLOR = "#00000000";
const ICON_STROKE_WIDTH_RATIO = 128;

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
      toolNormWidth,
      setToolNormWidth,
      offsetHeight,
      isShown = true,
    } = props;
    const imperativeCanvasRef = ref as MutableRefObject<ImperativeCanvasRef>;
    const [prevColor, setPrevColor] = useState(toolColor);
    const [isBrushWidthPickerOpen, setIsBrushWidthPickerOpen] = useState(false);
    const [isEraserWidthPickerOpen, setIsEraserWidthPickerOpen] =
      useState(false);
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

    useEffect(() => {
      if (!isShown) {
        setIsBrushWidthPickerOpen(false);
        setIsEraserWidthPickerOpen(false);
      }
    }, [isShown]);

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
            {[
              pb.ControllerRole.CHARACTER,
              pb.ControllerRole.BACKGROUND,
            ].includes(role) && (
              <>
                <ToolbarTooltip
                  isOpen={isBrushWidthPickerOpen}
                  setIsOpen={setIsBrushWidthPickerOpen}
                  tooltipTitle={
                    <div className="flex">
                      {BRUSH_WIDTHS.map((brushWidth) => (
                        <IconButton
                          onClick={() => {
                            setToolNormWidth(brushWidth);
                            setIsBrushWidthPickerOpen(false);
                          }}
                          color="secondary"
                          style={{
                            border: `2px solid ${
                              toolNormWidth === brushWidth
                                ? colors.orange.main
                                : "#0000"
                            }`,
                          }}
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
                    id={TutorialTargetId.BrushTool}
                    className="relative"
                    onClick={() => {
                      if (toolColor === ERASE_COLOR) {
                        setToolColor(prevColor);
                      }
                      setToolMode(ToolMode.Paint);
                      setIsBrushWidthPickerOpen((prev) => !prev);
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
                      strokeWidth={toolNormWidth * ICON_STROKE_WIDTH_RATIO}
                    />
                  </IconButton>
                </ToolbarTooltip>
                <ToolbarTooltip
                  isOpen={isEraserWidthPickerOpen}
                  setIsOpen={setIsEraserWidthPickerOpen}
                  tooltipTitle={
                    <div className="flex">
                      {BRUSH_WIDTHS.map((brushWidth) => (
                        <IconButton
                          onClick={() => {
                            setToolNormWidth(brushWidth);
                            setIsEraserWidthPickerOpen(false);
                          }}
                          color="secondary"
                          style={{
                            border: `2px solid ${
                              toolNormWidth === brushWidth
                                ? colors.orange.main
                                : "#0000"
                            }`,
                          }}
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
                    id={TutorialTargetId.EraseTool}
                    onClick={() => {
                      setToolColorRememberPrev(ERASE_COLOR);
                      setToolMode(ToolMode.Paint);
                      setIsEraserWidthPickerOpen((prev) => !prev);
                    }}
                    color={
                      toolMode === ToolMode.Paint && toolColor === "#00000000"
                        ? "secondary"
                        : "primary"
                    }
                  >
                    <EraserIcon fontSize="large" />
                  </IconButton>
                </ToolbarTooltip>
                <IconButton
                  id={TutorialTargetId.FillTool}
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
                <ToolbarTooltip
                  isOpen={isColorPickerOpen}
                  setIsOpen={setIsColorPickerOpen}
                  // cannot use tailwind classes due to using mui portal so tooltip works corrrectly eventhough overflow set in parent
                  tooltipTitle={
                    <>
                      <div
                        style={{
                          display: "flex",
                        }}
                      >
                        {BRUSH_COLORS.slice(0, BRUSH_COLORS.length / 2).map(
                          (color) => (
                            <Button
                              component="div"
                              onClick={() => {
                                setToolColorRememberPrev(color);
                                setIsColorPickerOpen(false);
                              }}
                              style={{
                                backgroundColor: color,
                                width: "38px",
                                height: "38px",
                                padding: 0,
                                margin: 4,
                                minWidth: "auto",
                                borderRadius: 4,
                                border: `${
                                  toolColor === color ? 2 : 1
                                }px solid ${
                                  toolColor === color
                                    ? colors.orange.main
                                    : "#AAA8"
                                }`,
                              }}
                              key={color}
                            />
                          )
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                        }}
                      >
                        {BRUSH_COLORS.slice(BRUSH_COLORS.length / 2).map(
                          (color) => (
                            <Button
                              component="div"
                              onClick={() => {
                                setToolColorRememberPrev(color);
                                setIsColorPickerOpen(false);
                              }}
                              style={{
                                backgroundColor: color,
                                width: "38px",
                                height: "38px",
                                padding: 0,
                                margin: 4,
                                minWidth: "auto",
                                borderRadius: 4,
                                border: `${
                                  toolColor === color ? 2 : 1
                                }px solid ${
                                  toolColor === color
                                    ? colors.orange.main
                                    : "#AAA8"
                                }`,
                              }}
                              key={color}
                            />
                          )
                        )}
                      </div>
                    </>
                  }
                >
                  <IconButton
                    id={TutorialTargetId.PaletteTool}
                    onClick={() => setIsColorPickerOpen((prev) => !prev)}
                    color="primary"
                    className="relative"
                  >
                    <PaletteIcon fontSize="large" />
                    <StopRoundedIcon
                      style={{
                        color:
                          toolColor === ERASE_COLOR ? prevColor : toolColor,
                      }}
                      fontSize="small"
                      className="absolute bottom-1 right-1"
                    />
                  </IconButton>
                </ToolbarTooltip>
              </>
            )}
            {role === pb.ControllerRole.STORY && (
              <>
                <IconButton
                  id={TutorialTargetId.TextTool}
                  onClick={() => setToolMode(ToolMode.Text)}
                  color={toolMode === ToolMode.Text ? "secondary" : "primary"}
                >
                  <TextFieldsIcon fontSize="large" />
                </IconButton>
                <div className="flex flex-col justify-center items-center relative">
                  <IconButton
                    id={TutorialTargetId.AudioTool}
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
                  {isRecordingAudio && (
                    <Typography
                      variant="subtitle2"
                      className="font-bold absolute pointer-events-none"
                      style={{
                        color: colors.orange.main,
                        bottom: -4,
                      }}
                    >
                      {showMmSsFromSeconds(recordingTimeElapsed)}
                    </Typography>
                  )}
                </div>
              </>
            )}
            <IconButton
              id={TutorialTargetId.UndoTool}
              onClick={imperativeCanvasRef.current.runUndo}
              color="primary"
            >
              <UndoIcon fontSize="large" />
            </IconButton>
          </Paper>
        </div>
      </div>
    );
  }
);

CanvasToolbar.defaultProps = {
  offsetHeight: "100%",
  isShown: true,
};

export default CanvasToolbar;
