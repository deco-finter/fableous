/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
import { useEffect, useRef } from "react";
import { scaleUpXY } from "./helpers";
import { SCALE } from "./constants";
import { ToolMode } from "../../constant";

export interface Cursor {
  normX: number;
  normY: number;
  normWidth: number;
  toolMode: ToolMode;
}

interface CursorScreenProps {
  cursor: Cursor | undefined;
  name?: string;
  isShown?: boolean;
  offsetWidth: number;
  offsetHeight: number;
}

const CURSOR_COLOR = "gray";
const CURSOR_WIDTH = 3;
const CURSOR_ROLE_TEXT = "24px Arial";

/**
 * Shows cursor position of students
 */
const CursorScreen = (props: CursorScreenProps) => {
  const { cursor, name, isShown, offsetWidth, offsetHeight } = props;
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const cursorRef = useRef<Cursor>(cursor as Cursor);
  cursorRef.current = cursor as Cursor;

  const refreshCursor = () => {
    window.requestAnimationFrame(refreshCursor);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D;
    const { width, height } = canvasRef.current;
    ctx.clearRect(0, 0, width, height);
    if (!cursorRef.current) return;
    const { normX, normY, normWidth, toolMode } = cursorRef.current;
    const [x, y] = scaleUpXY(canvasRef, normX, normY);
    const [toolWidth] = scaleUpXY(canvasRef, normWidth, 0);
    switch (toolMode) {
      case ToolMode.Paint:
        const radius = toolWidth / 2;
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = CURSOR_WIDTH;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
        if (name) {
          ctx.font = CURSOR_ROLE_TEXT;
          ctx.fillStyle = CURSOR_COLOR;
          ctx.fillText(name, x + radius * 0.71 + 8, y + radius * 0.71 + 8);
        }
        break;
      case ToolMode.Fill:
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = CURSOR_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x - 16, y);
        ctx.lineTo(x + 16, y);
        ctx.moveTo(x, y - 16);
        ctx.lineTo(x, y + 16);
        ctx.closePath();
        ctx.stroke();
        if (name) {
          ctx.font = CURSOR_ROLE_TEXT;
          ctx.fillStyle = CURSOR_COLOR;
          ctx.fillText(name, x + 8, y + 18);
        }
        break;
      case ToolMode.Text:
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = CURSOR_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, y - 16);
        ctx.lineTo(x, y + 16);
        ctx.moveTo(x - 6, y - 16);
        ctx.lineTo(x + 6, y - 16);
        ctx.moveTo(x - 6, y + 16);
        ctx.lineTo(x + 6, y + 16);
        ctx.closePath();
        ctx.stroke();
        if (name) {
          ctx.font = CURSOR_ROLE_TEXT;
          ctx.fillStyle = CURSOR_COLOR;
          ctx.fillText(name, x + 8, y + 8);
        }
        break;
      default:
    }
  };

  // set canvas size onmount and when canvas appears or becomes hidden
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * SCALE;
    canvas.height = canvas.offsetHeight * SCALE;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "middle";
    }
  }, [canvasRef, isShown]);

  // start cursor layer animation
  useEffect(() => {
    window.requestAnimationFrame(refreshCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative place-self-center"
      style={{
        width: offsetWidth,
        // -1 so height can shrink
        height: offsetHeight - 1,
        maxHeight: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          borderRadius: "24px",
          width: "100%",
          height: "100%",
          touchAction: "none",
          msTouchAction: "none",
          msTouchSelect: "none",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
};

CursorScreen.defaultProps = {
  name: "",
  isShown: true,
};

export default CursorScreen;
