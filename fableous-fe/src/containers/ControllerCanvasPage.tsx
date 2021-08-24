import { useRef, useState, useEffect, useCallback } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
import useAxios from "axios-hooks";
import Typography from "@material-ui/core/Typography";
import * as yup from "yup";
import { Formik, FormikHelpers } from "formik";
import { useSnackbar } from "notistack";
import Canvas from "../components/canvas/Canvas";
import {
  APIResponse,
  ControllerJoin,
  ControllerRole,
  Session,
  WSControlMessageData,
  WSJoinMessageData,
  WSMessage,
  WSMessageType,
} from "../Data";
import { restAPI, wsAPI } from "../Api";
import useWsConn from "../hooks/useWsConn";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import FormikTextField from "../components/FormikTextField";

enum ControllerState {
  JoinForm = "JOIN_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
  StoryFinished = "STORY_FINISHED",
}

export default function ControllerCanvasPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [controllerState, setControllerState] = useState<ControllerState>(
    ControllerState.JoinForm
  );
  const [wsConn, setNewWsConn, clearWsConn] = useWsConn();
  const [role, setRole] = useState<ControllerRole>(ControllerRole.Story);
  const [sessionInfo, setSessionInfo] = useState<
    WSControlMessageData | undefined
  >();
  const [storyDetails, setStoryDetails] = useState<Session | undefined>();
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [, execGetOnGoingSession] = useAxios<
    APIResponse<Session>,
    APIResponse<undefined>
  >({});

  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [cursor, setCursor] = useState<Cursor | undefined>();

  const wsMessageHandler = useCallback(
    (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            {
              const msgData = msg.data as WSControlMessageData;
              if (msgData.nextPage) {
                setCurrentPageIdx((prev) => prev + 1);
              } else if (msgData.classroomId) {
                setSessionInfo(msgData);
                setCurrentPageIdx(msgData.currentPage || 0);
                execGetOnGoingSession(
                  restAPI.session.getOngoing(msgData.classroomId)
                )
                  .then(({ data: response }) => {
                    setStoryDetails(response.data);
                  })
                  .catch((error) => {
                    if (error.response.status === 404) {
                      enqueueSnackbar("no on going session", {
                        variant: "error",
                      });
                    } else {
                      enqueueSnackbar("unknown error", { variant: "error" });
                    }
                    console.error("get ongoing session", error);
                  });
              }
            }
            break;
          case WSMessageType.Join:
            {
              const msgData = msg.data as WSJoinMessageData;
              if (!msgData.joining && msgData.role === ControllerRole.Hub) {
                enqueueSnackbar(`${ControllerRole.Hub} got disconnected`, {
                  variant: "error",
                });
                // assume backend will close ws conn
                setControllerState(ControllerState.JoinForm);
              }
            }
            break;
          default:
        }
      } catch (e) {
        console.error(e);
      }
    },
    [execGetOnGoingSession, enqueueSnackbar]
  );

  const wsOpenHandler = useCallback(() => {
    setControllerState(ControllerState.WaitingRoom);
  }, []);

  const wsErrorHandler = useCallback(
    (err: Event) => {
      enqueueSnackbar("connection error", { variant: "error" });
      console.error("ws conn error", err);
      clearWsConn();
      setControllerState(ControllerState.JoinForm);
    },
    [clearWsConn, enqueueSnackbar]
  );

  const wsCloseHandler = useCallback(
    (_: CloseEvent) => {
      // do not go to join form state as close occurs even when everything went well
      clearWsConn();
    },
    [clearWsConn]
  );

  const handleJoinSession = (
    values: ControllerJoin,
    actions: FormikHelpers<ControllerJoin>
  ) => {
    setRole(values.role);
    setNewWsConn(
      new WebSocket(
        wsAPI.controller.main(values.token, values.role, values.name)
      )
    );
    actions.resetForm();
  };

  // setup event listeners on ws connection
  useEffect(() => {
    if (!wsConn) {
      return () => {};
    }

    wsConn.addEventListener("open", wsOpenHandler);
    wsConn.addEventListener("message", wsMessageHandler);
    wsConn.addEventListener("error", wsErrorHandler);
    wsConn.addEventListener("close", wsCloseHandler);
    return () => {
      wsConn.removeEventListener("open", wsOpenHandler);
      wsConn.removeEventListener("message", wsMessageHandler);
      wsConn.removeEventListener("error", wsErrorHandler);
      wsConn.removeEventListener("close", wsCloseHandler);
    };
  }, [wsConn, wsOpenHandler, wsMessageHandler, wsErrorHandler, wsCloseHandler]);

  // reset states when in join form state
  useEffect(() => {
    if (controllerState === ControllerState.JoinForm) {
      setSessionInfo(undefined);
      setStoryDetails(undefined);
      setCurrentPageIdx(0);
    }
  }, [controllerState]);

  // go to drawing state when current page goes from 0 to 1
  useEffect(() => {
    if (
      controllerState === ControllerState.WaitingRoom &&
      currentPageIdx > 0 &&
      (storyDetails?.pages || 0) > 0
    ) {
      setControllerState(ControllerState.DrawingSession);
    }
  }, [currentPageIdx, storyDetails, controllerState]);

  // go to finish state after all story pages done
  useEffect(() => {
    if (
      controllerState === ControllerState.DrawingSession &&
      currentPageIdx > (storyDetails?.pages || Number.MAX_SAFE_INTEGER)
    ) {
      setControllerState(ControllerState.StoryFinished);
    }
  }, [currentPageIdx, storyDetails, controllerState]);

  return (
    <>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">
          {
            {
              [ControllerState.JoinForm]: "join",
              [ControllerState.WaitingRoom]: "draw",
              [ControllerState.DrawingSession]: "draw",
              [ControllerState.StoryFinished]: "finished",
            }[controllerState]
          }
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <div
          style={{
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          {controllerState === ControllerState.JoinForm && (
            <Formik
              initialValues={
                {
                  name: "",
                  token: "",
                  role: ControllerRole.Story,
                } as ControllerJoin
              }
              validationSchema={yup.object().shape({
                name: yup.string().required("required"),
                token: yup
                  .string()
                  .required("required")
                  .length(4, "must be 4 characters")
                  .uppercase("must be all uppercase characters"),
              })}
              onSubmit={handleJoinSession}
            >
              {(formik) => (
                <form onSubmit={formik.handleSubmit}>
                  <div>
                    <FormikTextField
                      formik={formik}
                      name="name"
                      label="Name"
                      overrides={{
                        autoFocus: true,
                      }}
                    />
                  </div>
                  <div>
                    <FormikTextField
                      formik={formik}
                      name="token"
                      label="Token"
                      overrides={{
                        onChange: (ev: React.ChangeEvent<HTMLInputElement>) => {
                          const evUpperCase = { ...ev };
                          evUpperCase.target.value =
                            ev.target.value?.toUpperCase();
                          formik.handleChange(evUpperCase);
                        },
                      }}
                    />
                  </div>

                  <RadioGroup
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
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
                  <Button type="submit">Join Session</Button>
                </form>
              )}
            </Formik>
          )}
          <div
            className={
              controllerState !== ControllerState.JoinForm ? "block" : "hidden"
            }
          >
            <Typography variant="h6">Role: {role}</Typography>
            <Typography variant="h6">Title: {storyDetails?.title}</Typography>
            <Typography variant="h6">
              Description: {storyDetails?.description}
            </Typography>
            {controllerState === ControllerState.DrawingSession && (
              <Typography variant="h6">
                page {currentPageIdx || "-"} of {storyDetails?.pages || "-"}
              </Typography>
            )}
            {controllerState === ControllerState.WaitingRoom && (
              <Typography variant="h6" component="p">
                waiting for hub to start..
              </Typography>
            )}
            {controllerState === ControllerState.StoryFinished && (
              <>
                <div>
                  <Button
                    variant="contained"
                    color="primary"
                    className="mb-2"
                    onClick={() => {
                      setControllerState(ControllerState.JoinForm);
                    }}
                  >
                    Join another session
                  </Button>
                </div>
                <div>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/gallery/${sessionInfo?.classroomId}/${sessionInfo?.sessionId}`}
                  >
                    View story in gallery
                  </Button>
                </div>
              </>
            )}
            <div
              className={
                controllerState === ControllerState.DrawingSession
                  ? "grid"
                  : "hidden"
              }
            >
              <div
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 20,
                  pointerEvents: "none", // forwards pointer events to next layer
                }}
              >
                <CursorScreen
                  cursor={cursor}
                  isShown={controllerState === ControllerState.DrawingSession}
                />
              </div>
              <div
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 10,
                }}
              >
                <Canvas
                  ref={canvasRef}
                  wsConn={wsConn}
                  role={role}
                  layer={role}
                  pageNum={currentPageIdx}
                  isShown={controllerState === ControllerState.DrawingSession}
                  setCursor={setCursor}
                />
              </div>
            </div>
          </div>
        </div>
      </Grid>
    </>
  );
}
