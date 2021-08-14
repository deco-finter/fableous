import { useRef, useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import useAxios from "axios-hooks";
import * as yup from "yup";
import { useFormik } from "formik";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";
import { restAPI, wsAPI } from "../Api";

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
  const [, executePostSession] = useAxios(restAPI.hub.postSessionInfo(), {
    manual: true,
  });
  const [classroomToken, setClassroomToken] = useState("");
  const [hubState, setHubState] = useState<HubState>(HubState.SessionForm);
  const [ping, setPing] = useState<NodeJS.Timeout>();
  const [joinedControllers, setJoinedControllers] = useState<
    {
      [key in ControllerRole]?: string | null;
    }
  >({});

  const beginSession = (classroomId: string) => {
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
            setJoinedControllers((prev) => ({
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

  const formikSession = useFormik({
    initialValues: {
      classroomId: "",
      title: "",
      description: "",
      pages: 1,
      // TODO remove once login implemented
      authToken: localStorage.getItem("authorization") || "",
    },
    validationSchema: yup.object({
      classroomId: yup.string().required("required"),
      title: yup.string().required("required"),
      description: yup.string().required("required"),
      pages: yup.number().positive("must be positive"),
    }),
    onSubmit: (values) => {
      executePostSession({
        data: {
          title: values.title,
          description: values.description,
          page: values.pages,
        },
      })
        .then(() => {
          beginSession(values.classroomId);
        })
        .catch((err: any) => {
          console.error(err);
          // TODO better way to inform error
          // eslint-disable-next-line
          alert("post session info failed");
        });
    },
  });

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
    ].every((role) => role in joinedControllers);
  };

  const startDrawing = () => {
    // TODO send ws control msg
    setHubState(HubState.DrawingSession);
  };

  const finishDrawing = () => {
    // TODO add support for multi page story, currently assumes 1 page story
    formikSession.resetForm();
    wsRef.current?.send(
      JSON.stringify({ type: WSMessageType.Control, data: { nextPage: true } })
    );
    wsRef.current?.close();
    setHubState(HubState.SessionForm);
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
          <form onSubmit={formikSession.handleSubmit}>
            <div>
              {/* TODO extract to separate component */}
              <TextField
                name="authToken"
                label="Auth Token"
                value={formikSession.values.authToken}
                onChange={(e) => {
                  formikSession.handleChange(e);
                  localStorage.setItem("authorization", e.target.value);
                }}
              />
            </div>
            <div>
              <TextField
                name="classroomId"
                label="Classroom ID"
                value={formikSession.values.classroomId}
                onChange={formikSession.handleChange}
                error={
                  formikSession.touched.classroomId &&
                  Boolean(formikSession.errors.classroomId)
                }
                helperText={
                  formikSession.touched.classroomId &&
                  formikSession.errors.classroomId
                }
              />
            </div>
            <div>
              <TextField
                name="title"
                label="Title"
                value={formikSession.values.title}
                onChange={formikSession.handleChange}
                error={
                  formikSession.touched.title &&
                  Boolean(formikSession.errors.title)
                }
                helperText={
                  formikSession.touched.title && formikSession.errors.title
                }
              />
            </div>
            <div>
              <TextField
                name="description"
                label="Description"
                value={formikSession.values.description}
                onChange={formikSession.handleChange}
                error={
                  formikSession.touched.description &&
                  Boolean(formikSession.errors.description)
                }
                helperText={
                  formikSession.touched.description &&
                  formikSession.errors.description
                }
              />
            </div>
            <div>
              <TextField
                name="pages"
                label="Pages"
                type="number"
                // TODO support multi page
                disabled
                value={formikSession.values.pages}
                onChange={formikSession.handleChange}
                error={
                  formikSession.touched.pages &&
                  Boolean(formikSession.errors.pages)
                }
                helperText={
                  formikSession.touched.pages && formikSession.errors.pages
                }
              />
            </div>
            <div>
              <Button type="submit">Start Session</Button>
            </div>
          </form>
        )}
        {hubState === HubState.WaitingRoom && (
          <>
            <h1>waiting room</h1>
            <p>
              code to join: <span>{classroomToken || "-"}</span>
            </p>
            <p>joined students:</p>
            <ul>
              {Object.entries(joinedControllers).map(([role, name]) => (
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
