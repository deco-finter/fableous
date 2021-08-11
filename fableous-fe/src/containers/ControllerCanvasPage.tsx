import { useRef, useEffect, useState } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Canvas from "../components/Canvas";
import { ControllerRole, WSMessageType } from "../Data";
import { wsAPI } from "../Api";

export default function ControllerCanvasPage() {
  const wsRef = useRef<WebSocket>();
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [controllerReady, setControllerReady] = useState(false);
  const [classroomToken, setClassroomToken] = useState("");
  const [name, setName] = useState("");
  const [ping, setPing] = useState<NodeJS.Timeout>();
  const [role, setRole] = useState<ControllerRole>(ControllerRole.Story);

  const joinSession = () => {
    wsRef.current = new WebSocket(
      wsAPI.controller.main(classroomToken, role, name)
    );
    wsRef.current.onopen = () => setControllerReady(true);
    const interval = setInterval(
      () => wsRef.current?.send(JSON.stringify({ type: WSMessageType.Ping })),
      5000
    );
    setPing(interval);
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
        {!controllerReady ? (
          <>
            <FormControl component="fieldset">
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <TextField
                value={classroomToken}
                onChange={(e) =>
                  setClassroomToken(e.target.value.toUpperCase())
                }
                placeholder="Token"
              />
              <RadioGroup
                value={role}
                onChange={(e) => setRole(e.target.value as ControllerRole)}
              >
                <FormControlLabel
                  value={ControllerRole.Story}
                  control={<Radio />}
                  label="Story"
                />
                <FormControlLabel
                  value={ControllerRole.Character}
                  control={<Radio />}
                  label="Character"
                />
                <FormControlLabel
                  value={ControllerRole.Background}
                  control={<Radio />}
                  label="Background"
                />
              </RadioGroup>
              <Button onClick={joinSession}>Join Session</Button>
            </FormControl>
          </>
        ) : (
          <>
            {role}
            <Canvas ref={canvasRef} wsRef={wsRef} role={role} layer={role} />
          </>
        )}
      </Grid>
    </>
  );
}
