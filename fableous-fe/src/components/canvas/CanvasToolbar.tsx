import Paper from "@material-ui/core/Paper";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import MicIcon from "@material-ui/icons/Mic";
import PaletteIcon from "@material-ui/icons/Palette";
import UndoIcon from "@material-ui/icons/Undo";
import BrushIcon from "@material-ui/icons/Brush";
import FormatColorFillIcon from "@material-ui/icons/FormatColorFill";
import EraserIcon from "../EraserIcon";
import { ControllerRole } from "../../constant";

interface CanvasToolbarProps {
  role: ControllerRole;
}

export default function CanvasToolbar(props: CanvasToolbarProps) {
  const { role } = props;

  return (
    <Paper className="h-full p-1 flex flex-col justify-around items-center">
      {[ControllerRole.Character, ControllerRole.Background].includes(role) && (
        <>
          <BrushIcon fontSize="large" color="secondary" />
          <EraserIcon fontSize="medium" color="primary" />
          <FormatColorFillIcon fontSize="large" color="primary" />
          <PaletteIcon fontSize="large" color="primary" />
          <UndoIcon fontSize="large" color="primary" />
        </>
      )}
      {role === ControllerRole.Story && (
        <>
          <TextFieldsIcon fontSize="large" color="secondary" />
          <MicIcon fontSize="large" color="primary" />
          <UndoIcon fontSize="large" />
        </>
      )}
    </Paper>
  );
}
