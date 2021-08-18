import { useRef, useState } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole } from "../Data";
import { wsAPI } from "../Api";
import useWsConn from "../hooks/useWsConn";

export default function ControllerCanvasPage() {
  const [wsConn, setNewWsConn] = useWsConn();
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [controllerReady, setControllerReady] = useState(false);
  const [classroomToken, setClassroomToken] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ControllerRole>(ControllerRole.Story);

  const joinSession = () => {
    const newWsConn = new WebSocket(
      wsAPI.controller.main(classroomToken, role, name)
    );
    newWsConn.onopen = () => {
      setControllerReady(true);
    };
    setNewWsConn(newWsConn);
  };

  return (
    <>
      <Grid item xs={12}>
        <div
          style={{
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
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
              <Canvas
                ref={canvasRef}
                wsState={wsConn}
                role={role}
                layer={role}
                pageNum={0}
              />
            </>
          )}
        </div>
      </Grid>
    </>
  );
}
