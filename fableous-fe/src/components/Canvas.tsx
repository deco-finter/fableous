/* eslint-disable */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import { ControllerRole, DrawingMode, WSMessage, WSMessageType } from "../Data";

const ASPECT_RATIO = 9 / 16;

const Canvas = (props: {
  wsRef: MutableRefObject<WebSocket | undefined>;
  role: ControllerRole;
  layer: ControllerRole;
}) => {
  const { layer, role, wsRef } = props;
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [allowDrawing, setAllowDrawing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState([0, 0]);
  const [mode, setMode] = useState<DrawingMode>(DrawingMode.None);

  const translateXY = (x: number, y: number) => {
    const bound = canvasRef.current.getBoundingClientRect();
    return [x - bound.x, y - bound.y];
  };

  const scaleDownXY = (x: number, y: number) => {
    return [x / canvasRef.current.width, y / canvasRef.current.height];
  };

  const scaleUpXY = (x: number, y: number) => {
    return [x * canvasRef.current.width, y * canvasRef.current.height];
  };

  const paint = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (role !== ControllerRole.Hub) {
        const [normX1, normY1] = scaleDownXY(x1, y1);
        const [normX2, normY2] = scaleDownXY(x2, y2);
        wsRef.current?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Paint,
            data: { x1: normX1, y1: normY1, x2: normX2, y2: normY2 },
          })
        );
      }
    },
    [role, wsRef]
  );

  const fill = useCallback(
    (startX: number, startY: number) => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;

      const { width, height } = canvasRef.current;
      const image = ctx.getImageData(0, 0, width, height);
      const startPixel = (startY * width + startX) * 4;
      const startColor = [
        image.data[startPixel],
        image.data[startPixel + 1],
        image.data[startPixel + 2],
        image.data[startPixel + 3],
      ];
      const setPixel = (pixel: number, color: number[]) => {
        [
          image.data[pixel],
          image.data[pixel + 1],
          image.data[pixel + 2],
          image.data[pixel + 3],
        ] = color;
      };
      const checkPixel = (pixel: number, color: number[]) => {
        return (
          image.data[pixel] === color[0] &&
          image.data[pixel + 1] === color[1] &&
          image.data[pixel + 2] === color[2] &&
          image.data[pixel + 3] === color[3]
        );
      };
      let color = [255, 0, 0, 255];
      let stack = [[startX, startY]];
      if (checkPixel(startPixel, color)) return;
      while (stack.length) {
        let [x, y] = stack.pop()!;
        let pixel = (y * width + x) * 4;
        while (y-- > 0 && checkPixel(pixel, startColor)) {
          pixel -= width * 4;
        }
        pixel += width * 4;
        y++;
        let expandLeft = false;
        let expandRight = false;
        while (y++ < height - 1 && checkPixel(pixel, startColor)) {
          setPixel(pixel, color);
          if (x > 0) {
            if (checkPixel(pixel - 4, startColor) && !expandLeft) {
              stack.push([x - 1, y]);
              expandLeft = true;
            } else {
              expandLeft = false;
            }
          }
          if (x < width) {
            if (checkPixel(pixel + 4, startColor) && !expandRight) {
              stack.push([x + 1, y]);
              expandRight = true;
            } else {
              expandRight = false;
            }
          }
          pixel += width * 4;
        }
      }
      ctx.putImageData(image, 0, 0);

      const [normX, normY] = scaleDownXY(startX, startY);
      if (role !== ControllerRole.Hub) {
        wsRef.current?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Fill,
            data: { x: normX, y: normY },
          })
        );
      }
    },
    [role, wsRef]
  );

  const readMessage = useCallback(
    (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Paint:
            if (msg.role === layer) {
              const [x1, y1] = scaleUpXY(msg.data.x1 || 0, msg.data.y1 || 0);
              const [x2, y2] = scaleUpXY(msg.data.x2 || 0, msg.data.y2 || 0);
              paint(x1, y1, x2, y2);
            }
            break;
          case WSMessageType.Fill:
            if (msg.role === layer) {
              const [x, y] = scaleUpXY(msg.data.x1 || 0, msg.data.y1 || 0);
              fill(x, y);
            }
            break;
          default:
        }
      } catch (e) {
        console.log(e);
      }
    },
    [fill, paint, layer]
  );

  function onMouseDown(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    event.preventDefault();
    switch (mode) {
      case DrawingMode.Paint:
        setDrawing(true);
        setLastPos(translateXY(event.clientX, event.clientY));
        break;
      case DrawingMode.Fill:
        const [x, y] = translateXY(event.clientX, event.clientY);
        fill(x, y);
        break;
      default:
    }
  }

  function onMouseMove(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    event.preventDefault();
    switch (mode) {
      case DrawingMode.Paint:
        const [lastX, lastY] = lastPos;
        const [x, y] = translateXY(event.clientX, event.clientY);
        if (!drawing) return;
        if (
          Math.round(lastX) === Math.round(x) &&
          Math.round(lastY) === Math.round(y)
        )
          return;
        paint(lastX, lastY, x, y);
        setLastPos([x, y]);
        break;
      default:
    }
  }

  function onMouseUp(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    event.preventDefault();
    setDrawing(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetWidth * ASPECT_RATIO;
    setAllowDrawing(role !== ControllerRole.Hub);
    switch (role) {
      case ControllerRole.Story:
        setMode(DrawingMode.Paint);
        break;
      case ControllerRole.Character:
        setMode(DrawingMode.Paint);
        break;
      case ControllerRole.Background:
        setMode(DrawingMode.Paint);
        break;
      default:
        setMode(DrawingMode.None);
    }
    const ws = wsRef.current;
    ws?.addEventListener("message", readMessage);
    return () => ws?.removeEventListener("message", readMessage);
  }, [readMessage, role, wsRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          borderWidth: 4,
          width: "90vw",
        }}
      />
      {mode !== DrawingMode.None && (
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={mode}
            onChange={(e) => setMode(e.target.value as DrawingMode)}
          >
            <FormControlLabel
              value={DrawingMode.Paint}
              control={<Radio />}
              label="Paint"
            />
            <FormControlLabel
              value={DrawingMode.Fill}
              control={<Radio />}
              label="Fill"
            />
          </RadioGroup>
        </FormControl>
      )}
      {mode === DrawingMode.Paint && <div>Brush</div>}
      {mode === DrawingMode.Fill && <div>Bucket</div>}
    </>
  );
};

export default Canvas;
