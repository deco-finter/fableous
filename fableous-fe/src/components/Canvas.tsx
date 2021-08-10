import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";

const ASPECT_RATIO = 9 / 16;

const Canvas = (props: {
  wsRef: MutableRefObject<WebSocket | undefined>;
  role: ControllerRole;
  layer: ControllerRole;
}) => {
  const { layer, role, wsRef } = props;
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [lastPos, setLastPos] = useState([0, 0]);
  const [allowDrawing, setAllowDrawing] = useState(false);
  const [drawing, setDrawing] = useState(false);

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

  const drawSegment = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const [normX1, normY1] = scaleDownXY(x1, y1);
      const [normX2, normY2] = scaleDownXY(x2, y2);
      if (role !== ControllerRole.Hub) {
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

  const readMessage = useCallback(
    (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Paint:
            if (msg.role === layer) {
              const [x1, y1] = scaleUpXY(msg.data.x1 || 0, msg.data.y1 || 0);
              const [x2, y2] = scaleUpXY(msg.data.x2 || 0, msg.data.y2 || 0);
              drawSegment(x1, y1, x2, y2);
            }
            break;
          default:
        }
      } catch (e) {
        console.log(e);
      }
    },
    [drawSegment, layer]
  );

  function onMouseDown(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    event.preventDefault();
    setDrawing(true);
    setLastPos(translateXY(event.clientX, event.clientY));
  }

  function onMouseMove(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!allowDrawing) return;
    if (!drawing) return;
    event.preventDefault();
    const [lastX, lastY] = lastPos;
    const [x, y] = translateXY(event.clientX, event.clientY);
    if (
      Math.round(lastX) === Math.round(x) &&
      Math.round(lastY) === Math.round(y)
    )
      return;
    drawSegment(lastX, lastY, x, y);
    setLastPos([x, y]);
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
    const ws = wsRef.current;
    ws?.addEventListener("message", readMessage);
    return () => ws?.removeEventListener("message", readMessage);
  }, [readMessage, role, wsRef]);

  return (
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
  );
};

export default Canvas;
