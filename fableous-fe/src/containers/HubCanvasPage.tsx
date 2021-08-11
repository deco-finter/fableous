import { useRef, useEffect, useState } from "react";
import { Button, Grid } from "@material-ui/core";
import Canvas from "../components/Canvas";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";

export default function HubCanvasPage() {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNWQ0OWNmZS01YjNkLTRiOGItYmVjNS1mMDcwYjE5YjI0N2YiLCJleHAiOjE2Mjg3MzkxNzYsImlhdCI6MTYyODU2NjM3Nn0.-aBTRYMqjCar6Oi3MC0grob4YMRYQxUVRVuW48ov16w";
  const classroomId = "room";
  const storyCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const characterCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const wsRef = useRef<WebSocket>();
  const [hubReady, setHubReady] = useState(false);
  const [classroomToken, setClassroomToken] = useState("");

  const exportCanvas = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const { width, height } = storyCanvasRef.current;
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(backgroundCanvasRef.current, 0, 0, width, height);
    ctx.drawImage(characterCanvasRef.current, 0, 0, width, height);
    ctx.drawImage(storyCanvasRef.current, 0, 0, width, height);

    const link = document.createElement("a");
    link.download = "output.png";
    link.href = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    link.click();
  };

  useEffect(() => {
    wsRef.current = new WebSocket(
      `wss://dev.fableous.daystram.com/ws/hub?token=${token}&classroom_id=${classroomId}`
    );
    wsRef.current.onopen = () => setHubReady(true);
    wsRef.current.onmessage = (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            setClassroomToken(msg.data as string);
            break;
          default:
        }
      } catch (e) {
        console.log(e);
      }
    };
    const ping = setInterval(
      () => wsRef.current?.send(JSON.stringify({ type: WSMessageType.Ping })),
      5000
    );
    return () => {
      clearInterval(ping);
      wsRef.current?.close();
      wsRef.current = undefined;
    };
  }, []);

  return (
    <>
      <Grid item xs={12}>
        {hubReady && (
          <>
            Hub {classroomToken}
            <div style={{ display: "grid" }}>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 12 }}>
                <Canvas
                  ref={storyCanvasRef}
                  wsRef={wsRef}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Story}
                />
              </div>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}>
                <Canvas
                  ref={characterCanvasRef}
                  wsRef={wsRef}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Character}
                />
              </div>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}>
                <Canvas
                  ref={backgroundCanvasRef}
                  wsRef={wsRef}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Background}
                />
              </div>
            </div>
            <Button onClick={() => exportCanvas()}>Export</Button>
          </>
        )}
      </Grid>
    </>
  );
}
