/* eslint-disable no-param-reassign */
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
import Slider from "@material-ui/core/Slider";
import { ControllerRole, ToolMode, WSMessage, WSMessageType } from "../Data";

const ASPECT_RATIO = 9 / 16;
const SCALE = 2;

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
  const [toolColor, setToolColor] = useState("#000000ff");
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.None);
  const [toolWidth, setToolWidth] = useState(8);

  const translateXY = (x: number, y: number) => {
    const bound = canvasRef.current.getBoundingClientRect();
    return [(x - bound.x) * SCALE, (y - bound.y) * SCALE];
  };

  const scaleDownXY = (x: number, y: number) => {
    return [x / canvasRef.current.width, y / canvasRef.current.height];
  };

  const scaleUpXY = (x: number, y: number) => {
    return [x * canvasRef.current.width, y * canvasRef.current.height];
  };

  const convHEXtoRGBA = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      hex
    );
    console.log(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
          parseInt(result[4], 16),
        ]
      : [0, 0, 0, 0];
  };

  const placePaint = useCallback(
    (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      targetColor: string,
      targetWidth: number
    ) => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = targetWidth;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.stroke();
      if (role !== ControllerRole.Hub) {
        const [normX1, normY1] = scaleDownXY(x1, y1);
        const [normX2, normY2] = scaleDownXY(x2, y2);
        const [normWidth, i] = scaleDownXY(targetWidth || 0, 0);
        wsRef.current?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Paint,
            data: {
              x1: normX1,
              y1: normY1,
              x2: normX2,
              y2: normY2,
              color: targetColor,
              width: normWidth,
            },
          } as WSMessage)
        );
      }
    },
    [role, wsRef]
  );

  const placeFill = useCallback(
    (startX: number, startY: number, targetColor: string) => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      startX = Math.floor(startX);
      startY = Math.floor(startY);
      const { width, height } = canvasRef.current;
      const image = ctx.getImageData(0, 0, width, height);
      const startPixel = (startY * width + startX) * 4;
      const startColor = [
        image.data[startPixel],
        image.data[startPixel + 1],
        image.data[startPixel + 2],
        image.data[startPixel + 3],
      ];
      console.log(startX, startY);
      const setPixel = (pixel: number, rgb: number[]) => {
        [
          image.data[pixel],
          image.data[pixel + 1],
          image.data[pixel + 2],
          image.data[pixel + 3],
        ] = rgb;
      };
      const checkPixel = (pixel: number, rgb: number[]) => {
        return (
          image.data[pixel] === rgb[0] &&
          image.data[pixel + 1] === rgb[1] &&
          image.data[pixel + 2] === rgb[2] &&
          image.data[pixel + 3] === rgb[3]
        );
      };
      const colorRGB = convHEXtoRGBA(targetColor);
      const stack = [[startX, startY]];
      if (checkPixel(startPixel, colorRGB)) return;
      while (stack.length) {
        // eslint-disable-next-line prefer-const
        let [x, y] = stack.pop() || [startX, startY];
        let pixel = (y * width + x) * 4;
        while (y-- > 0 && checkPixel(pixel, startColor)) {
          pixel -= width * 4;
        }
        pixel += width * 4;
        y++;
        let expandLeft = false;
        let expandRight = false;
        while (y++ < height - 1 && checkPixel(pixel, startColor)) {
          setPixel(pixel, colorRGB);
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
      if (role !== ControllerRole.Hub) {
        const [normX, normY] = scaleDownXY(startX, startY);
        wsRef.current?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Fill,
            data: { x1: normX, y1: normY, color: targetColor },
          } as WSMessage)
        );
      }
    },
    [role, wsRef]
  );

  const placeText = useCallback(
    (x, y, message, fontSize) => {
      if (!message) return;
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.font = `${fontSize * SCALE}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(message, x, y);
      if (role !== ControllerRole.Hub) {
        const [normX, normY] = scaleDownXY(x, y);
        const [normFontSize, i] = scaleDownXY(fontSize, 0);
        wsRef.current?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Text,
            data: {
              x1: normX,
              y1: normY,
              width: normFontSize,
              text: message,
            },
          } as WSMessage)
        );
      }
    },
    [role, wsRef]
  );

  const readMessage = useCallback(
    (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        if (msg.role === layer || msg.type === WSMessageType.Control) {
          const [x1, y1] = scaleUpXY(msg.data.x1 || 0, msg.data.y1 || 0);
          const [x2, y2] = scaleUpXY(msg.data.x2 || 0, msg.data.y2 || 0);
          const [width, i] = scaleUpXY(msg.data.width || 0, 0);
          switch (msg.type) {
            case WSMessageType.Paint:
              placePaint(
                x1,
                y1,
                x2,
                y2,
                msg.data.color || "#000000ff",
                width || 8
              );
              break;
            case WSMessageType.Fill:
              placeFill(x1, y1, msg.data.color || "#000000ff");
              break;
            case WSMessageType.Text:
              placeText(x1, y1, msg.data.text || "", width || 0);
              break;
            default:
          }
        }
      } catch (e) {
        console.log(e);
      }
    },
    [placePaint, placeFill, placeText, layer]
  );

  function onMouseDown(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    event.preventDefault();
    const [x, y] = translateXY(event.clientX, event.clientY);
    switch (toolMode) {
      case ToolMode.Paint:
        setDrawing(true);
        placePaint(x, y, x, y, toolColor, toolWidth);
        setLastPos([x, y]);
        break;
      case ToolMode.Fill:
        placeFill(x, y, toolColor);
        break;
      case ToolMode.Text:
        // eslint-disable-next-line no-alert
        placeText(x, y, prompt("What do you want to write?"), 18); // TODO
        break;
      default:
    }
  }

  function onMouseMove(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    event.preventDefault();
    const [lastX, lastY] = lastPos;
    const [x, y] = translateXY(event.clientX, event.clientY);
    switch (toolMode) {
      case ToolMode.Paint:
        if (!drawing) return;
        if (
          Math.round(lastX) === Math.round(x) &&
          Math.round(lastY) === Math.round(y)
        )
          return;
        placePaint(lastX, lastY, x, y, toolColor, toolWidth);
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
    canvas.width = canvas.offsetWidth * SCALE;
    canvas.height = canvas.offsetWidth * ASPECT_RATIO * SCALE;
    setAllowDrawing(role !== ControllerRole.Hub);
    switch (role) {
      case ControllerRole.Story:
        setToolMode(ToolMode.Text);
        break;
      case ControllerRole.Character:
        setToolMode(ToolMode.Paint);
        break;
      case ControllerRole.Background:
        setToolMode(ToolMode.Paint);
        break;
      default:
        setToolMode(ToolMode.None);
    }
    const ws = wsRef.current;
    ws?.addEventListener("message", readMessage);
    return () => ws?.removeEventListener("message", readMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, wsRef]);

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
      {toolMode !== ToolMode.None && (
        <div>
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={toolMode}
              onChange={(e) => setToolMode(e.target.value as ToolMode)}
            >
              {role === ControllerRole.Story && (
                <>
                  <FormControlLabel
                    value={ToolMode.Text}
                    control={<Radio />}
                    label="Text"
                  />
                  <FormControlLabel
                    disabled
                    value={ToolMode.Audio}
                    control={<Radio />}
                    label="Audio"
                  />
                </>
              )}
              {(role === ControllerRole.Character ||
                role === ControllerRole.Background) && (
                <>
                  <FormControlLabel
                    value={ToolMode.Paint}
                    control={<Radio />}
                    label="Paint"
                  />
                  <FormControlLabel
                    value={ToolMode.Fill}
                    control={<Radio />}
                    label="Fill"
                  />
                </>
              )}
            </RadioGroup>
          </FormControl>
        </div>
      )}
      {toolMode === ToolMode.Paint && (
        <div>
          <Slider
            defaultValue={8}
            valueLabelDisplay="auto"
            value={toolWidth}
            onChange={(e, width) => setToolWidth(width as number)}
            step={4 * SCALE}
            marks
            min={4 * SCALE}
            max={32 * SCALE}
          />
        </div>
      )}
      {(toolMode === ToolMode.Fill || toolMode === ToolMode.Paint) && (
        <div>
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={toolColor}
              onChange={(e) => setToolColor(e.target.value)}
            >
              <FormControlLabel
                value="#000000ff"
                control={<Radio />}
                label="Black"
              />
              <FormControlLabel
                value="#ff0000ff"
                control={<Radio />}
                label="Red"
              />
              <FormControlLabel
                value="#00ff00ff"
                control={<Radio />}
                label="Green"
              />
              <FormControlLabel
                value="#0000ffff"
                control={<Radio />}
                label="Blue"
              />
              <FormControlLabel
                value="#00000000"
                control={<Radio />}
                label="Erase"
              />
            </RadioGroup>
          </FormControl>
        </div>
      )}
    </>
  );
};

export default Canvas;
