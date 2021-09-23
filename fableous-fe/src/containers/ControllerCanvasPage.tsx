import { useRef, useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  Icon,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  makeStyles,
  Chip,
  ChipProps,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import useAxios from "axios-hooks";
import * as yup from "yup";
import { Formik, FormikHelpers } from "formik";
import { useSnackbar } from "notistack";
import Canvas from "../components/canvas/Canvas";
import { restAPI, wsAPI } from "../api";
import {
  APIResponse,
  ControllerJoin,
  Session,
  WSControlMessageData,
  WSJoinMessageData,
  WSMessage,
} from "../data";
import useWsConn from "../hooks/useWsConn";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import FormikTextField from "../components/FormikTextField";
import {
  Achievement,
  EmptyAchievement,
} from "../components/achievement/achievement";
import AchievementButton from "../components/achievement/AchievementButton";
import { ControllerRole, ToolMode, WSMessageType } from "../constant";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import CanvasToolbar from "../components/canvas/CanvasToolbar";
import { ASPECT_RATIO, SCALE } from "../components/canvas/constants";
import useContainRatio from "../hooks/useContainRatio";
import ChipRow from "../components/ChipRow";
import { colors } from "../colors";

enum ControllerState {
  JoinForm = "JOIN_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
  StoryFinished = "STORY_FINISHED",
}

const ROLE_ICON = {
  [ControllerRole.Story]: (
    <>
      <Icon fontSize="small" className="align-middle mr-1">
        textsms
      </Icon>
      Story
    </>
  ),
  [ControllerRole.Character]: (
    <>
      <Icon fontSize="small" className="align-middle mr-1">
        directions_run
      </Icon>
      Character
    </>
  ),
  [ControllerRole.Background]: (
    <>
      <Icon fontSize="small" className="align-middle mr-1">
        image
      </Icon>
      Background
    </>
  ),
  [ControllerRole.Hub]: undefined,
};

const useStyles = makeStyles({
  disableMobileHoldInteraction: {
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
});

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
  const [toolColor, setToolColor] = useState("#000000ff");
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.None);
  const [toolWidth, setToolWidth] = useState(8 * SCALE);
  const canvasContainerRef = useRef<HTMLDivElement>(
    document.createElement("div")
  );
  const [canvasOffsetWidth, canvasOffsetHeight] = useContainRatio({
    containerRef: canvasContainerRef,
    ratio: 1 / ASPECT_RATIO,
  });
  const classes = useStyles();

  const canvasRef = useRef<ImperativeCanvasRef>({
    getCanvas: () => document.createElement("canvas"),
    runUndo: () => {},
    runAudio: () => {},
  });
  const [textShapes, setTextShapes] = useState<TextShapeMap>({});
  const [audioPaths, setAudioPaths] = useState<string[]>([]);
  const [cursor, setCursor] = useState<Cursor | undefined>();
  const [achievements, setAchievements] =
    useState<Achievement>(EmptyAchievement);
  const [isDone, setIsDone] = useState(false);

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
                setIsDone(false);
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
                      enqueueSnackbar("No on going session!", {
                        variant: "error",
                      });
                    } else {
                      enqueueSnackbar("Unknown error!", { variant: "error" });
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
                enqueueSnackbar("Room closed!", {
                  variant: "error",
                });
                // assume backend will close ws conn
                setControllerState(ControllerState.JoinForm);
              }
            }
            break;
          case WSMessageType.Achievement:
            setAchievements(msg.data as Achievement);
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
    enqueueSnackbar("Successfully joined room!", { variant: "success" });
    setControllerState(ControllerState.WaitingRoom);
  }, [enqueueSnackbar]);

  const wsErrorHandler = useCallback(
    (err: Event) => {
      enqueueSnackbar("Failed to join room!", { variant: "error" });
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
    actions.resetForm({
      values: {
        name: values.name,
        token: "",
        role: values.role,
      },
    });
  };

  const handleHelp = () => {
    enqueueSnackbar("Help requested!", { variant: "info" });
  };

  const handleDone = () => {
    if (isDone) return;
    wsConn?.send(
      JSON.stringify({
        type: WSMessageType.Control,
        data: { nextPage: true } as WSControlMessageData,
      })
    );
    setIsDone(true);
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
      setIsDone(false);
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
    <Grid
      container
      className={`flex-col flex-1 relative ${classes.disableMobileHoldInteraction}`}
    >
      <Grid item xs={12} className="mb-8">
        <Typography variant="h2">
          {
            {
              [ControllerState.JoinForm]: "Join Room",
              [ControllerState.WaitingRoom]: "Lobby",
              [ControllerState.DrawingSession]: "",
              [ControllerState.StoryFinished]: "Finished!",
            }[controllerState]
          }
        </Typography>
      </Grid>
      {controllerState === ControllerState.JoinForm && (
        <Grid item xs={12} sm={8} md={6} lg={4}>
          <Card>
            <Formik
              initialValues={
                {
                  name: "",
                  token: "",
                  role: ControllerRole.Story,
                } as ControllerJoin
              }
              validationSchema={yup.object().shape({
                name: yup.string().required("Name required"),
                token: yup
                  .string()
                  .required("Token required")
                  .length(4, "Invalid token")
                  .uppercase("Invalid token"),
              })}
              onSubmit={handleJoinSession}
            >
              {(formik) => (
                <form onSubmit={formik.handleSubmit} autoComplete="off">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} className="flex-grow flex flex-col">
                        <FormikTextField
                          formik={formik}
                          name="name"
                          label="Name"
                          overrides={{
                            autoFocus: true,
                            variant: "outlined",
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Grid container spacing={2}>
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            className="flex-grow flex flex-col"
                          >
                            <FormikTextField
                              formik={formik}
                              name="token"
                              label="Token"
                              overrides={{
                                variant: "outlined",
                                onChange: (
                                  ev: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  const evUpperCase = { ...ev };
                                  if (ev.target.value.length > 4) {
                                    return;
                                  }
                                  evUpperCase.target.value =
                                    ev.target.value?.toUpperCase();
                                  formik.handleChange(evUpperCase);
                                },
                              }}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            className="flex-grow flex flex-col"
                          >
                            <FormControl variant="outlined">
                              <InputLabel>Role</InputLabel>
                              <Select
                                name="role"
                                label="Role"
                                value={formik.values.role}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              >
                                <MenuItem value={ControllerRole.Story}>
                                  {ROLE_ICON[ControllerRole.Story]}
                                </MenuItem>
                                <MenuItem value={ControllerRole.Character}>
                                  {ROLE_ICON[ControllerRole.Character]}
                                </MenuItem>
                                <MenuItem value={ControllerRole.Background}>
                                  {ROLE_ICON[ControllerRole.Background]}
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12} className="flex justify-end">
                        <Button
                          variant="contained"
                          color="secondary"
                          type="submit"
                        >
                          Join <Icon>brush</Icon>
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </form>
              )}
            </Formik>
          </Card>
        </Grid>
      )}
      {controllerState === ControllerState.WaitingRoom && (
        <div className="flex">
          <Card className="flex-shrink">
            <CardContent>
              <Typography variant="h6" component="p">
                Waiting for session to begin
                <CircularProgress size={12} thickness={8} className="ml-2" />
              </Typography>
            </CardContent>
          </Card>
        </div>
      )}
      {controllerState === ControllerState.StoryFinished && (
        <>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              className="mb-2"
              onClick={() => {
                setControllerState(ControllerState.JoinForm);
              }}
            >
              Join another session <Icon>brush</Icon>
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to={`/gallery/${sessionInfo?.classroomId}/${sessionInfo?.sessionId}`}
            >
              View story in gallery
            </Button>
          </Grid>
        </>
      )}
      <div
        className={`flex flex-col absolute w-full h-full ${
          controllerState !== ControllerState.DrawingSession && "invisible"
        }`}
      >
        <Grid container>
          <Grid item xs={12}>
            <ChipRow
              primary
              chips={[
                <Chip label={storyDetails?.title} color="primary" />,
                ...(storyDetails?.description.split(",") || []),
                <Chip
                  label={ROLE_ICON[role]}
                  style={{ color: colors.orange.main }}
                />,
              ]}
            />
          </Grid>
        </Grid>
        <Grid container className="flex-1 my-4">
          <Grid item xs={2} md={1}>
            <CanvasToolbar
              ref={canvasRef}
              role={role}
              offsetHeight={`${canvasOffsetHeight}px`}
              toolColor={toolColor}
              setToolColor={setToolColor}
              toolMode={toolMode}
              setToolMode={setToolMode}
              toolWidth={toolWidth}
              setToolWidth={setToolWidth}
            />
          </Grid>
          <Grid item xs={10} md={11}>
            <div
              ref={canvasContainerRef}
              className="grid place-items-stretch h-full"
              style={{
                border: "3px solid black",
              }}
            >
              <div
                className="grid"
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
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className="grid"
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
                  onDraw={() => setIsDone(false)}
                  setCursor={setCursor}
                  textShapes={textShapes}
                  setTextShapes={setTextShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
                  toolColor={toolColor}
                  toolMode={toolMode}
                  setToolMode={setToolMode}
                  toolWidth={toolWidth}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className="grid"
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 1,
                }}
              >
                <div
                  className="bg-white place-self-center"
                  style={{
                    width: canvasOffsetWidth,
                    height: canvasOffsetHeight,
                    borderRadius: "30px",
                  }}
                />
              </div>
            </div>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={12}>
            <ChipRow
              chips={[
                `Page ${currentPageIdx} of ${storyDetails?.pages || "-"}`,
                <AchievementButton
                  achievements={achievements}
                  confetti
                  notify
                />,
                {
                  icon: <Icon fontSize="small">pan_tool</Icon>,
                  label: "Help",
                  onClick: handleHelp,
                } as ChipProps,
                {
                  icon: (
                    <Icon
                      fontSize="medium"
                      style={{ color: isDone ? "#41A041" : "inherit" }}
                    >
                      check_circle
                    </Icon>
                  ),
                  label: "Done",
                  onClick: handleDone,
                } as ChipProps,
              ]}
            />
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
}
