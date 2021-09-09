import { useRef, useEffect, useState, useCallback } from "react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import useAxios from "axios-hooks";
import * as yup from "yup";
import { Formik, FormikHelpers } from "formik";
import { useHistory, useParams } from "react-router-dom";
import Icon from "@material-ui/core/Icon";
import { useSnackbar } from "notistack";
import Canvas from "../components/canvas/Canvas";
import { restAPI, wsAPI } from "../api";
import {
  ControllerRole,
  Story,
  WSControlMessageData,
  WSJoinMessageData,
  WSMessageType,
} from "../data";
import FormikTextField from "../components/FormikTextField";
import { useAchievement, useWsConn } from "../hooks";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";

enum HubState {
  SessionForm = "SESSION_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
}

export default function HubCanvasPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [hubState, setHubState] = useState<HubState>(HubState.SessionForm);
  const [wsConn, setNewWsConn, clearWsConn] = useWsConn();
  const [classroomToken, setClassroomToken] = useState("");
  const [joinedControllers, setJoinedControllers] = useState<
    {
      [key in ControllerRole]?: string | null;
    }
  >({});
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [storyPageCnt, setStoryPageCnt] = useState(0);

  const [{ loading: postLoading }, executePostSession] = useAxios(
    restAPI.session.create(classroomId),
    {
      manual: true,
    }
  );

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
  const [, wsAchievementHandler] = useAchievement({ debug: true });

  const wsMessageHandler = useCallback(
    (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            {
              const { classroomToken: classroomTokenFromWs } =
                msg.data as WSControlMessageData;
              if (classroomTokenFromWs) {
                setClassroomToken(classroomTokenFromWs);
              }
            }
            break;
          case WSMessageType.Join:
            {
              const { role, name, joining } = msg.data as WSJoinMessageData;
              if (role === ControllerRole.Hub) {
                break;
              }

              // update joined controllers to show in waiting room
              if (joining && name) {
                setJoinedControllers((prev) => ({
                  ...prev,
                  [role]: name,
                }));
              } else if (!joining) {
                setJoinedControllers((prev) => {
                  const prevCopy = { ...prev };
                  delete prevCopy[role];

                  return prevCopy;
                });
              }

              // show error if controller disconnects during drawing session
              if (!joining && hubState === HubState.DrawingSession) {
                enqueueSnackbar(`${role} got disconnected`, {
                  variant: "error",
                });
              }
            }
            break;
          default:
        }
      } catch (e) {
        console.error(e);
      }
    },
    [hubState, enqueueSnackbar]
  );

  const wsErrorHandler = useCallback(
    (err: Event) => {
      enqueueSnackbar("connection error", { variant: "error" });
      console.error("ws conn error", err);
      clearWsConn();
      setHubState(HubState.SessionForm);
    },
    [clearWsConn, enqueueSnackbar]
  );

  const wsCloseHandler = useCallback(
    (_: CloseEvent) => {
      // do not go to session form state as close occurs even when everything went well
      clearWsConn();
    },
    [clearWsConn]
  );

  const handleCreateSession = (
    values: Story,
    actions: FormikHelpers<Story>
  ) => {
    executePostSession({
      data: {
        title: values.title,
        description: values.description,
        pages: values.pages,
      },
    })
      .then(() => {
        // ws event handlers added in useEffect
        setNewWsConn(new WebSocket(wsAPI.hub.main(classroomId)));
        setCurrentPageIdx(0);
        setStoryPageCnt(values.pages);
        setHubState(HubState.WaitingRoom);
        actions.resetForm();
      })
      .catch((err: any) => {
        enqueueSnackbar("failed to create session", { variant: "error" });
        console.error("post session error", err);
      });
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
    ].some((role) => role in joinedControllers);
  };

  const onNextPage = () => {
    wsConn?.send(
      JSON.stringify({ type: WSMessageType.Control, data: { nextPage: true } })
    );
    setCurrentPageIdx((prev) => prev + 1);
  };

  const onBeginDrawing = () => {
    onNextPage();
    setHubState(HubState.DrawingSession);
  };

  // setup event listeners on ws connection
  useEffect(() => {
    if (!wsConn) {
      return () => {};
    }

    wsConn.addEventListener("message", wsAchievementHandler);
    wsConn.addEventListener("message", wsMessageHandler);
    wsConn.addEventListener("error", wsErrorHandler);
    wsConn.addEventListener("close", wsCloseHandler);

    return () => {
      wsConn.removeEventListener("message", wsAchievementHandler);
      wsConn.removeEventListener("message", wsMessageHandler);
      wsConn.removeEventListener("error", wsErrorHandler);
      wsConn.removeEventListener("close", wsCloseHandler);
    };
  }, [
    wsConn,
    hubState,
    wsAchievementHandler,
    wsMessageHandler,
    wsErrorHandler,
    wsCloseHandler,
    enqueueSnackbar,
  ]);

  // perform reset in session form state
  useEffect(() => {
    if (hubState === HubState.SessionForm) {
      setCurrentPageIdx(0);
      setStoryPageCnt(0);
      setClassroomToken("");
      setJoinedControllers({});
    }
  }, [hubState]);

  // go back to session form once all pages in story completed
  useEffect(() => {
    if (currentPageIdx && storyPageCnt && currentPageIdx > storyPageCnt) {
      // TODO send canvas result to backend here
      // assume backend will close ws conn
      setHubState(HubState.SessionForm);
    }
  }, [currentPageIdx, storyPageCnt, clearWsConn]);

  return (
    <>
      <Grid item xs={12}>
        <Button
          onClick={() => history.goBack()}
          startIcon={<Icon>arrow_backward</Icon>}
        >
          Back
        </Button>
      </Grid>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">
          {
            {
              [HubState.SessionForm]: "story",
              [HubState.WaitingRoom]: "lobby",
              [HubState.DrawingSession]: "draw",
            }[hubState]
          }
        </Typography>
      </Grid>
      {hubState === HubState.SessionForm && (
        <Formik
          initialValues={
            {
              title: "",
              description: "",
              pages: 1,
            } as Story
          }
          validationSchema={yup.object({
            title: yup.string().required("required"),
            description: yup.string().required("required"),
            pages: yup.number().positive("must be positive"),
          })}
          onSubmit={handleCreateSession}
        >
          {(formik) => (
            <form onSubmit={formik.handleSubmit}>
              <div>
                <FormikTextField
                  formik={formik}
                  name="title"
                  label="Title"
                  overrides={{
                    variant: "outlined",
                    disabled: postLoading,
                    className: "mb-4",
                  }}
                />
              </div>
              <div>
                <FormikTextField
                  formik={formik}
                  name="description"
                  label="Description"
                  overrides={{
                    variant: "outlined",
                    disabled: postLoading,
                    className: "mb-4",
                  }}
                />
              </div>
              <div>
                <FormikTextField
                  formik={formik}
                  name="pages"
                  label="Pages"
                  overrides={{
                    type: "number",
                    variant: "outlined",
                    disabled: postLoading,
                    className: "mb-4",
                  }}
                />
              </div>
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={postLoading}
                  type="submit"
                >
                  create
                </Button>
              </div>
            </form>
          )}
        </Formik>
      )}
      {hubState === HubState.WaitingRoom && (
        <Grid item xs={12}>
          <Typography variant="h6">
            token: <span>{classroomToken || "-"}</span>
          </Typography>
          <Typography variant="h6">
            Joined Students ({Object.keys(joinedControllers).length}/3)
          </Typography>
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
            begin drawing
          </Button>
        </Grid>
      )}
      {hubState === HubState.DrawingSession && (
        <Grid item xs={12}>
          <Typography variant="h6">Hub with token {classroomToken}</Typography>
          <Typography variant="h6">
            page {currentPageIdx} of {storyPageCnt}
          </Typography>
          <div style={{ display: "grid" }}>
            <div
              style={{
                gridRowStart: 1,
                gridColumnStart: 1,
                zIndex: 22,
                pointerEvents: "none",
              }}
            >
              <CursorScreen cursor={storyCursor} name="Story" />
            </div>
            <div
              style={{
                gridRowStart: 1,
                gridColumnStart: 1,
                zIndex: 21,
                pointerEvents: "none",
              }}
            >
              <CursorScreen cursor={characterCursor} name="Character" />
            </div>
            <div
              style={{
                gridRowStart: 1,
                gridColumnStart: 1,
                zIndex: 20,
                pointerEvents: "none",
              }}
            >
              <CursorScreen cursor={backgroundCursor} name="Background" />
            </div>
            <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 12 }}>
              <Canvas
                ref={storyCanvasRef}
                wsConn={wsConn}
                role={ControllerRole.Hub}
                layer={ControllerRole.Story}
                pageNum={currentPageIdx}
                setCursor={setStoryCursor}
              />
            </div>
            <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}>
              <Canvas
                ref={characterCanvasRef}
                wsConn={wsConn}
                role={ControllerRole.Hub}
                layer={ControllerRole.Character}
                pageNum={currentPageIdx}
                setCursor={setCharacterCursor}
              />
            </div>
            <div style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}>
              <Canvas
                ref={backgroundCanvasRef}
                wsConn={wsConn}
                role={ControllerRole.Hub}
                layer={ControllerRole.Background}
                pageNum={currentPageIdx}
                setCursor={setBackgroundCursor}
              />
            </div>
          </div>
          <Button onClick={() => exportCanvas()}>Export</Button>
          <Button onClick={onNextPage}>
            {currentPageIdx >= storyPageCnt ? "Finish" : "Next page"}
          </Button>
        </Grid>
      )}
    </>
  );
}
