import { useRef, useEffect, useState } from "react";
import { Grid } from "@material-ui/core";
import Canvas from "../components/Canvas";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";

export default function HubCanvasPage() {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNWQ0OWNmZS01YjNkLTRiOGItYmVjNS1mMDcwYjE5YjI0N2YiLCJleHAiOjE2Mjg3MzkxNzYsImlhdCI6MTYyODU2NjM3Nn0.-aBTRYMqjCar6Oi3MC0grob4YMRYQxUVRVuW48ov16w";
  const classroomId = "room";
  const wsRef = useRef<WebSocket>();
  const [hubReady, setHubReady] = useState(false);
  const [classroomToken, setClassroomToken] = useState("");

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
                  wsRef={wsRef}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Story}
                />
              </div>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}>
                <Canvas
                  wsRef={wsRef}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Character}
                />
              </div>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}>
                <Canvas
                  wsRef={wsRef}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Background}
                />
              </div>
            </div>
          </>
        )}
      </Grid>
    </>
  );
}
