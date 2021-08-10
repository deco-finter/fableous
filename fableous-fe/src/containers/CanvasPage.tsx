import { useRef, useEffect, useState } from "react";
import { Grid, Paper } from "@material-ui/core";
import Canvas from "../components/Canvas";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";

export default function CanvasPage() {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDBmNGUwYy0wN2M1LTRmZTUtOWUwNy1jZTAxZjc3MzE5M2EiLCJleHAiOjE2Mjg3MjkzMjcsImlhdCI6MTYyODU1NjUyN30.6cj_SuAiMXFWjGonmLNQEWLERCIN11rtOiNfp7IKWBA";
  const classroomId = "room";
  const wsRefHub = useRef<WebSocket>();
  const wsRef = useRef<WebSocket>();
  const [hubReady, setHubReady] = useState(false);
  const [controllerReady, setControllerReady] = useState(false);

  useEffect(() => {
    wsRefHub.current = new WebSocket(
      `ws://localhost:8080/ws/hub?token=${token}&classroom_id=${classroomId}`
    );
    wsRefHub.current.onopen = () => setHubReady(true);
    wsRefHub.current.onmessage = (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            if (!msg.data) return;
            wsRef.current = new WebSocket(
              `ws://localhost:8080/ws/controller?classroom_token=${msg.data}&role=CHARACTER`
            );
            wsRef.current.onopen = () => setControllerReady(true);
            break;
          default:
        }
      } catch (e) {
        console.log(e);
      }
    };
    const ping = setInterval(
      () =>
        wsRefHub.current?.send(JSON.stringify({ type: WSMessageType.Ping })),
      5000
    );

    return () => {
      clearInterval(ping);
      wsRefHub.current?.close();
      wsRefHub.current = undefined;
    };
  }, []);

  return (
    <>
      {/* <Grid item xs={2}>
        <Paper>
          <h1>drawing toolbar</h1>
        </Paper>
      </Grid> */}
      <Grid item xs={10}>
        {hubReady && (
          <>
            hub
            <Canvas wsRef={wsRefHub} role={ControllerRole.Hub} />
          </>
        )}
        {controllerReady && (
          <>
            character
            <Canvas wsRef={wsRef} role={ControllerRole.Character} />
          </>
        )}
      </Grid>
    </>
  );
}
