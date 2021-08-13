/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
import { useCallback, useEffect, useRef } from "react";
import { scaleUpXY } from "./helpers";
import { ASPECT_RATIO, SCALE } from "./constants";
import { ToolMode } from "../../Data";

export interface Cursor {
  normX: number;
  normY: number;
  normWidth: number;
  toolMode: ToolMode;
}

interface CursorScreenProps {
  cursor: Cursor | undefined;
}

const CursorScreen = (props: CursorScreenProps) => {
  const { cursor } = props;
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  const refreshCursor = useCallback(() => {
    if (!cursor) return;
    const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D;
    const { normX, normY, normWidth, toolMode } = cursor;
    const [x, y] = scaleUpXY(canvasRef, normX, normY);
    const [toolWidth] = scaleUpXY(canvasRef, normWidth, 0);
    const { width, height } = canvasRef.current;
    ctx.clearRect(0, 0, width, height);
    switch (toolMode) {
      case ToolMode.Paint:
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, toolWidth / 2, toolWidth / 2, 0, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
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
        break;
      default:
    }
  }, [canvasRef, cursor]);

  // setup on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * SCALE;
    canvas.height = canvas.offsetWidth * ASPECT_RATIO * SCALE;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    // only trigger once during componentMount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // cursor: "none",
        }}
      />
    </>
  );
};

export default CursorScreen;
