import { useRef, useEffect, useState } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { TextField } from "@material-ui/core";
import Canvas from "../components/Canvas";
import { ControllerRole, WSMessageType } from "../Data";

export default function ControllerCanvasPage() {
  const wsRef = useRef<WebSocket>();
  const [controllerReady, setControllerReady] = useState(false);
  const [classroomToken, setClassroomToken] = useState("");
  const [name, setName] = useState("");
  const [ping, setPing] = useState<NodeJS.Timeout>();
  const [role, setRole] = useState<ControllerRole>(ControllerRole.Story);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  const joinSession = () => {
    wsRef.current = new WebSocket(
      `wss://dev.fableous.daystram.com/ws/controller?classroom_token=${classroomToken}&role=${role}&name=${name}`
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
              <div>
                <FormLabel component="legend">Name</FormLabel>
                <TextField
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <FormLabel component="legend">Token</FormLabel>
                <TextField
                  value={classroomToken}
                  onChange={(e) =>
                    setClassroomToken(e.target.value.toUpperCase())
                  }
                />
              </div>
              <div>
                <FormLabel component="legend">Role</FormLabel>
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
              </div>
              <Button onClick={joinSession}>Join</Button>
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
