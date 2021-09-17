import { forwardRef, MutableRefObject, useState } from "react";
import Paper from "@material-ui/core/Paper";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import MicIcon from "@material-ui/icons/Mic";
import PaletteIcon from "@material-ui/icons/Palette";
import UndoIcon from "@material-ui/icons/Undo";
import BrushIcon from "@material-ui/icons/Brush";
import FormatColorFillIcon from "@material-ui/icons/FormatColorFill";
import {
  Button,
  ClickAwayListener,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import EraserIcon from "../EraserIcon";
import { ControllerRole, ToolMode } from "../../constant";
import { ImperativeCanvasRef } from "./data";

interface CanvasToolbarProps {
  role: ControllerRole;
  toolMode: ToolMode;
  setToolMode: React.Dispatch<React.SetStateAction<ToolMode>>;
  toolColor: string;
  setToolColor: React.Dispatch<React.SetStateAction<string>>;
  // eslint-disable-next-line react/no-unused-prop-types
  toolWidth: number;
  // eslint-disable-next-line react/no-unused-prop-types
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

// TODO to make toolbar height same as canvas, extract logic to calculate canvas width upwards to container
// may consider using useContainRatio hook
const CanvasToolbar = forwardRef<ImperativeCanvasRef, CanvasToolbarProps>(
  (props: CanvasToolbarProps, ref) => {
    const { role, toolMode, setToolMode, toolColor, setToolColor } = props;
    const imperativeCanvasRef = ref as MutableRefObject<ImperativeCanvasRef>;
    const [prevColor, setPrevColor] = useState(toolColor);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);

    const setToolColorRememberPrev = (nextColor: string) => {
      setToolColor((prev) => {
        if (prev !== ERASE_COLOR) {
          setPrevColor(prev);
        }
        return nextColor;
      });
    };

    return (
      <Paper className="h-full p-1 flex flex-col justify-around items-center">
        {[ControllerRole.Character, ControllerRole.Background].includes(
          role
        ) && (
          <>
            {/* TODO add UI to adjust tool width */}
            <IconButton
              onClick={() => {
                if (toolColor === ERASE_COLOR) {
                  setToolColor(prevColor);
                }
                setToolMode(ToolMode.Paint);
              }}
              color={
                toolMode === ToolMode.Paint && toolColor !== "#00000000"
                  ? "secondary"
                  : "primary"
              }
            >
              <BrushIcon fontSize="large" />
            </IconButton>
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
            <ClickAwayListener onClickAway={() => setIsColorPickerOpen(false)}>
              <Tooltip
                interactive
                classes={{
                  tooltip: "max-w-md",
                }}
                PopperProps={{
                  disablePortal: true,
                }}
                onClose={() => setIsColorPickerOpen(false)}
                open={isColorPickerOpen}
                arrow
                placement="right"
                leaveTouchDelay={60000}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                title={
                  <div className="flex">
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
                {/* TODO show in toolbar current color */}
                <IconButton
                  onClick={() => setIsColorPickerOpen((prev) => !prev)}
                  color="primary"
                >
                  <PaletteIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            </ClickAwayListener>
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
            {/* TODO think about better UI e.g. tooltip for recording audio */}
            <IconButton
              onClick={() => {
                setToolMode(ToolMode.Audio);
                setIsRecordingAudio((prev) => !prev);
                // need to exec func directly from imperativeCanvasRef
                // to get up-to-date callback
                imperativeCanvasRef.current.runAudio();
              }}
              color={isRecordingAudio ? "secondary" : "primary"}
            >
              <MicIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={imperativeCanvasRef.current.runUndo}
              color="primary"
            >
              <UndoIcon fontSize="large" />
            </IconButton>
          </>
        )}
      </Paper>
    );
  }
);

export default CanvasToolbar;
