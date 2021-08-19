import { Button, Grid, Icon, Typography } from "@material-ui/core";
import { useRef, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import Canvas from "../components/canvas/Canvas";
import { wsAPI } from "../Api";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import { ControllerRole, WSMessageType } from "../Data";

export default function HubCanvasPage() {
  const history = useHistory();
  const wsRef = useRef<WebSocket>();
  const storyCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const characterCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const [storyCursor, setStoryCursor] = useState<Cursor | undefined>();
  const [characterCursor, setCharacterCursor] = useState<Cursor | undefined>();
  const [backgroundCursor, setBackgroundCursor] = useState<
    Cursor | undefined
  >();
  const { classroomId } = useParams<{ classroomId: string }>();
  const [classroomToken, setClassroomToken] = useState("");
  const [hubReady, setHubReady] = useState(false);
  const [ping, setPing] = useState<NodeJS.Timeout>();

  const beginSession = () => {
    wsRef.current = new WebSocket(wsAPI.hub.main(classroomId));
    wsRef.current.onopen = () => {
      setHubReady(true);
      const interval = setInterval(
        () => wsRef.current?.send(JSON.stringify({ type: WSMessageType.Ping })),
        5000
      );
      setPing(interval);
    };
    wsRef.current.onclose = () => {
      if (ping) clearInterval(ping);
    };
    wsRef.current.onerror = () => {
      if (ping) clearInterval(ping);
    };
    wsRef.current.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            setClassroomToken(msg.data.classroomToken as string);
            break;
          default:
        }
      } catch (e) {
        console.error(e);
      }
    };
  };

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
    return () => {
      if (ping) clearInterval(ping);
      wsRef.current?.close();
      wsRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container>
      {!hubReady ? (
        <>
          <Grid container>
            <Button
              onClick={() => history.goBack()}
              startIcon={<Icon>arrow_backward</Icon>}
            >
              Back
            </Button>
          </Grid>
          <Grid item xs={12} className="mb-4">
            <Typography variant="h2">Lobby</Typography>
          </Grid>
          <Button onClick={beginSession}>Start Session</Button>
        </>
      ) : (
        <>
          Hub {classroomToken}
          <div style={{ display: "grid" }}>
            <div
              style={{
                gridRowStart: 1,
                gridColumnStart: 1,
                zIndex: 22,
                pointerEvents: "none",
              }}
            >
              <CursorScreen
                targetCanvasRef={storyCanvasRef}
                cursor={storyCursor}
                name="Story"
              />
            </div>
            <div
              style={{
                gridRowStart: 1,
                gridColumnStart: 1,
                zIndex: 21,
                pointerEvents: "none",
              }}
            >
              <CursorScreen
                targetCanvasRef={characterCanvasRef}
                cursor={characterCursor}
                name="Character"
              />
            </div>
            <div
              style={{
                gridRowStart: 1,
                gridColumnStart: 1,
                zIndex: 20,
                pointerEvents: "none",
              }}
            >
              <CursorScreen
                targetCanvasRef={backgroundCanvasRef}
                cursor={backgroundCursor}
                name="Background"
              />
            </div>
            <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 12 }}>
              <Canvas
                ref={storyCanvasRef}
                wsRef={wsRef}
                role={ControllerRole.Hub}
                layer={ControllerRole.Story}
                setCursor={setStoryCursor}
              />
            </div>
            <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}>
              <Canvas
                ref={characterCanvasRef}
                wsRef={wsRef}
                role={ControllerRole.Hub}
                layer={ControllerRole.Character}
                setCursor={setCharacterCursor}
              />
            </div>
            <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}>
              <Canvas
                ref={backgroundCanvasRef}
                wsRef={wsRef}
                role={ControllerRole.Hub}
                layer={ControllerRole.Background}
                setCursor={setBackgroundCursor}
              />
            </div>
          </div>
          <Button onClick={() => exportCanvas()}>Export</Button>
        </>
      )}
    </Grid>
  );
}
