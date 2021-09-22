import { MutableRefObject } from "react";
import { SCALE } from "./constants";

export const translateXY = (
  canvasRef: MutableRefObject<HTMLCanvasElement>,
  x: number,
  y: number
) => {
  const bound = canvasRef.current.getBoundingClientRect();
  return [(x - bound.x) * SCALE, (y - bound.y) * SCALE];
};

// wrap with useCallback() because dependency chain leads to being used at useEffect()
export const scaleDownXY = (
  canvasRef: MutableRefObject<HTMLCanvasElement>,
  x: number,
  y: number
) => {
  return [x / canvasRef.current.width, y / canvasRef.current.height];
};

export const scaleUpXY = (
  canvasRef: MutableRefObject<HTMLCanvasElement>,
  x: number,
  y: number
) => {
  return [x * canvasRef.current.width, y * canvasRef.current.height];
};

export const convHEXtoRGBA = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex
  );
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        parseInt(result[4], 16),
      ]
    : [0, 0, 0, 0];
};

export const getTextBounds = (
  canvasRef: MutableRefObject<HTMLCanvasElement>,
  x: number,
  y: number,
  text: string,
  fontSize: number
) => {
  const ctx = canvasRef.current.getContext("2d");
  if (ctx) {
    ctx.font = `${fontSize * SCALE}px Comic Sans MS`;
    const bounds = ctx.measureText(text);
    return [
      x - bounds.width / 2,
      y - (fontSize * SCALE) / 2,
      x + bounds.width / 2,
      y + (fontSize * SCALE) / 2,
    ];
  }
  return [0, 0, 0, 0];
};
