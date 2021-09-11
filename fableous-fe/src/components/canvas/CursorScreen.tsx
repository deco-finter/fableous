/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
import { useCallback, useEffect, useRef } from "react";
import { scaleUpXY } from "./helpers";
import { ASPECT_RATIO, SCALE } from "./constants";
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
}

const CursorScreen = (props: CursorScreenProps) => {
  const { cursor, name, isShown } = props;
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  const refreshCursor = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D;
    const { width, height } = canvasRef.current;
    ctx.clearRect(0, 0, width, height);
    if (!cursor) return;
    const { normX, normY, normWidth, toolMode } = cursor;
    const [x, y] = scaleUpXY(canvasRef, normX, normY);
    const [toolWidth] = scaleUpXY(canvasRef, normWidth, 0);
    switch (toolMode) {
      case ToolMode.Paint:
        const radius = toolWidth / 2;
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
        if (name) {
          ctx.font = "18px Arial";
          ctx.fillStyle = "gray";
          ctx.fillText(name, x + radius * 0.71 + 8, y + radius * 0.71 + 8);
        }
        break;
      case ToolMode.Fill:
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 16, y);
        ctx.lineTo(x + 16, y);
        ctx.moveTo(x, y - 16);
        ctx.lineTo(x, y + 16);
        ctx.closePath();
        ctx.stroke();
        if (name) {
          ctx.font = "18px Arial";
          ctx.fillStyle = "gray";
          ctx.fillText(name, x + 8, y + 18);
        }
        break;
      case ToolMode.Text:
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
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
          ctx.font = "18px Arial";
          ctx.fillStyle = "gray";
          ctx.fillText(name, x + 8, y + 8);
        }
        break;
      default:
    }
  }, [cursor, name]);

  // set canvas size onmount and when canvas appears or becomes hidden
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * SCALE;
    canvas.height = canvas.width * ASPECT_RATIO;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "middle";
    }
  }, [canvasRef, isShown]);

  // start cursor layer animation
  useEffect(() => {
    window.requestAnimationFrame(refreshCursor);
  }, [refreshCursor]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          borderWidth: 4,
          borderColor: "blue",
          width: "100%",
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
    </>
  );
};

CursorScreen.defaultProps = {
  name: "",
  isShown: true,
};

export default CursorScreen;
