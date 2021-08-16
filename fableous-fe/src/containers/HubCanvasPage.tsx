import { useRef, useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import useAxios from "axios-hooks";
import * as yup from "yup";
import { useFormik } from "formik";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole, WSMessage, WSMessageType } from "../Data";
import { restAPI, wsAPI } from "../Api";
import FormikTextField from "../components/FormikTextField";

enum HubState {
  SessionForm = "SESSION_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
}

export default function HubCanvasPage() {
  const wsRef = useRef<WebSocket>();
  const [wsConn, setWsConn] = useState<WebSocket | undefined>();
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
  const [joinedControllers, setJoinedControllers] = useState<
    {
      [key in ControllerRole]?: string | null;
    }
  >({});
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [storyPageCnt, setStoryPageCnt] = useState(0);

  const beginSession = (classroomId: string) => {
    const newWsConn = new WebSocket(wsAPI.hub.main(classroomId));
    newWsConn.onmessage = (ev: MessageEvent) => {
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

    setWsConn(newWsConn);
  };

  useEffect(() => {
    if (!wsConn) return () => {};

    let interval: NodeJS.Timeout;
    const setupPing = () => {
      interval = setInterval(() => {
        wsConn.send(JSON.stringify({ type: WSMessageType.Ping }));
      }, 5000);
    };
    const teardownPing = () => {
      clearInterval(interval);
    };
    wsConn.addEventListener("open", setupPing);
    wsConn.addEventListener("error", teardownPing);
    wsConn.addEventListener("close", teardownPing);
    return () => {
      wsConn.removeEventListener("open", setupPing);
      wsConn.addEventListener("error", teardownPing);
      wsConn.addEventListener("close", teardownPing);
      teardownPing();
      wsConn.close();
    };
  }, [wsConn]);

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
          setCurrentPageIdx(0);
          setStoryPageCnt(values.pages);
          setHubState(HubState.WaitingRoom);
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

  const onNextPage = () => {
    wsConn?.send(
      JSON.stringify({ type: WSMessageType.Control, data: { nextPage: true } })
    );
    // TODO send canvas result to BE now before changing page as
    // canvas will be cleared when page number changes
    setCurrentPageIdx((prev) => prev + 1);
  };

  const onBeginDrawing = () => {
    onNextPage();
    setHubState(HubState.DrawingSession);
  };

  // go back to session form once all pages in story completed
  useEffect(() => {
    if (currentPageIdx && storyPageCnt && currentPageIdx > storyPageCnt) {
      formikSession.resetForm();
      setCurrentPageIdx(0);
      setStoryPageCnt(0);
      setWsConn(undefined);
      setHubState(HubState.SessionForm);
    }
    // do not run when formikSession changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIdx, storyPageCnt]);

  return (
    <>
      <Grid item xs={12}>
        {hubState === HubState.SessionForm && (
          <form onSubmit={formikSession.handleSubmit}>
            <div>
              <FormikTextField
                formik={formikSession}
                name="authToken"
                label="Auth Token"
                overrides={{
                  onChange: (e: any) => {
                    formikSession.handleChange(e);
                    localStorage.setItem("authorization", e.target.value);
                  },
                }}
              />
            </div>
            <div>
              <FormikTextField
                formik={formikSession}
                name="classroomId"
                label="Classroom ID"
              />
            </div>
            <div>
              <FormikTextField
                formik={formikSession}
                name="title"
                label="Title"
              />
            </div>
            <div>
              <FormikTextField
                formik={formikSession}
                name="description"
                label="Description"
              />
            </div>
            <div>
              <FormikTextField
                formik={formikSession}
                name="pages"
                label="Pages"
                overrides={{
                  type: "number",
                }}
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
                <li key={role}>
                  {role} - {name}
                </li>
              ))}
            </ul>
            <Button
              variant="contained"
              color="primary"
              onClick={onBeginDrawing}
              disabled={!isAllControllersJoined()}
            >
              start
            </Button>
          </>
        )}
        {hubState === HubState.DrawingSession && (
          <>
            <h1>Hub {classroomToken}</h1>
            <p>
              page {currentPageIdx} of {storyPageCnt}
            </p>
            <div style={{ display: "grid" }}>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 12 }}>
                <Canvas
                  ref={storyCanvasRef}
                  wsRef={wsRef}
                  wsState={wsConn}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Story}
                  pageNum={currentPageIdx}
                />
              </div>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}>
                <Canvas
                  ref={characterCanvasRef}
                  wsRef={wsRef}
                  wsState={wsConn}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Character}
                  pageNum={currentPageIdx}
                />
              </div>
              <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}>
                <Canvas
                  ref={backgroundCanvasRef}
                  wsRef={wsRef}
                  wsState={wsConn}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Background}
                  pageNum={currentPageIdx}
                />
              </div>
            </div>
            <Button onClick={() => exportCanvas()}>Export</Button>
            <Button onClick={onNextPage}>
              {currentPageIdx >= storyPageCnt ? "Finish" : "Next page"}
            </Button>
          </>
        )}
      </Grid>
    </>
  );
}
