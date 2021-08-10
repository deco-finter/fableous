import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";

const Canvas = (props: {
  wsRef: MutableRefObject<WebSocket | undefined>;
  role: ControllerRole;
}) => {
  const { role, wsRef } = props;
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [lastPos, setLastPos] = useState([0, 0]);
  const [allowDrawing, setAllowDrawing] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const translateXY = (x: number, y: number) => {
    const bound = canvasRef.current.getBoundingClientRect();
    return [x - bound.x, y - bound.y];
  };

  const drawSegment = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (role !== ControllerRole.Hub) {
        wsRef.current?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Paint,
            data: { x1, y1, x2, y2 },
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
            drawSegment(
              msg.data.x1 || 0,
              msg.data.y1 || 0,
              msg.data.x2 || 0,
              msg.data.y2 || 0
            );
            break;
          default:
        }
      } catch (e) {
        console.log(e);
      }
    },
    [drawSegment]
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
    canvas.width = window.innerWidth;
    canvas.width = window.innerHeight;
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
      style={{ borderWidth: 4 }}
    />
  );
};

export default Canvas;
