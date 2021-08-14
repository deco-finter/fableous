import { useRef, useEffect, useState } from "react";
import FormControl from "@material-ui/core/FormControl";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";
import { wsAPI } from "../Api";

enum HubState {
  SessionForm = "SESSION_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
}

export default function HubCanvasPage() {
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
  const [classroomId, setClassroomId] = useState("");
  const [classroomToken, setClassroomToken] = useState("");
  const [hubState, setHubState] = useState<HubState>(HubState.SessionForm);
  const [ping, setPing] = useState<NodeJS.Timeout>();
  const [token, setToken] = useState(
    localStorage.getItem("authorization") || ""
  );
  const [joinedStudents, setJoinedStudents] = useState<
    {
      [key in ControllerRole]?: string | null;
    }
  >({});

  const beginSession = () => {
    wsRef.current = new WebSocket(wsAPI.hub.main(classroomId));
    wsRef.current.onopen = () => {
      setHubState(HubState.WaitingRoom);
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
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            setClassroomToken(msg.data as string);
            break;
          case WSMessageType.Join:
            setJoinedStudents((prev) => ({
              ...prev,
              [msg.role]: msg.data as string,
            }));
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

  const isAllControllersJoined = (): boolean => {
    return [
      ControllerRole.Story,
      ControllerRole.Character,
      ControllerRole.Background,
    ].every((role) => role in joinedStudents);
  };

  const startDrawing = () => {
    // TODO send post request about session info
    setHubState(HubState.DrawingSession);
  };

  const finishDrawing = () => {
    setHubState(HubState.SessionForm);
    // TODO add support for multi page story
    wsRef.current?.send(
      JSON.stringify({ type: WSMessageType.Control, data: { nextPage: true } })
    );
    wsRef.current?.close();
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
    <>
      <Grid item xs={12}>
        {hubState === HubState.SessionForm && (
          <FormControl component="fieldset">
            <TextField
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                localStorage.setItem("authorization", e.target.value);
              }}
              placeholder="Auth Token"
            />
            <TextField
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              placeholder="Classroom ID"
            />
            <Button onClick={beginSession}>Start Session</Button>
          </FormControl>
        )}
        {hubState === HubState.WaitingRoom && (
          <>
            <h1>waiting room</h1>
            <p>
              code to join: <span>{classroomToken}</span>
            </p>
            <p>joined students</p>
            <ul>
              {Object.entries(joinedStudents).map(([role, name]) => (
                <li>
                  {role} - {name}
                </li>
              ))}
            </ul>
            <Button
              variant="contained"
              color="primary"
              onClick={startDrawing}
              disabled={!isAllControllersJoined()}
            >
              start
            </Button>
          </>
        )}
        {hubState === HubState.DrawingSession && (
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
            {/* TODO add support for multi page story */}
            <Button onClick={finishDrawing}>Finish</Button>
          </>
        )}
      </Grid>
    </>
  );
}
