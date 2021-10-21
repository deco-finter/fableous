import { Button } from "@material-ui/core";
import { colors } from "../../colors";

export default function ColorPaletteIcon(props: {
  color: string;
  toolColor: string;
  onClick: () => void;
}) {
  const { color, toolColor, onClick } = props;
  return (
    <Button
      component="div"
      onClick={onClick}
      style={{
        backgroundColor: color,
        width: "38px",
        height: "38px",
        padding: 0,
        margin: 4,
        minWidth: "auto",
        borderRadius: 4,
        border: `${toolColor === color ? 2 : 1}px solid ${
          toolColor === color ? colors.orange.main : "#AAA8"
        }`,
      }}
      key={color}
    />
  );
}
