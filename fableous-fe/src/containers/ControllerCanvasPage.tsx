import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
import Joyride, { Step, StoreHelpers } from "react-joyride";
import Canvas from "../components/canvas/Canvas";
import { restAPI, wsAPI } from "../api";
import { APIResponse, ControllerJoin, Session } from "../data";
import useWsConn from "../hooks/useWsConn";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import FormikTextField from "../components/FormikTextField";
import {
  Achievement,
  EmptyAchievement,
  protoToAchievement,
} from "../components/achievement/achievement";
import AchievementButton from "../components/achievement/AchievementButton";
import { ROLE_ICON, ToolMode } from "../constant";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import CanvasToolbar, {
  BRUSH_WIDTHS,
  COLORS,
} from "../components/canvas/CanvasToolbar";
import { ASPECT_RATIO } from "../components/canvas/constants";
import useContainRatio from "../hooks/useContainRatio";
import ChipRow from "../components/ChipRow";
import { colors } from "../colors";
import { TutorialTargetId } from "../tutorialTargetIds";
import useTutorial from "../hooks/useTutorial";
import { useCustomNav } from "../components/CustomNavProvider";
import { proto as pb } from "../proto/message_pb";

enum ControllerState {
  JoinForm = "JOIN_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
  StoryFinished = "STORY_FINISHED",
}

const useStyles = makeStyles({
  disableMobileHoldInteraction: {
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
});

const CONTROLLER_TUTORIAL_KEY = "controllerTutorial";

export default function ControllerCanvasPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [controllerState, setControllerState] = useState<ControllerState>(
    ControllerState.JoinForm
  );
  const [wsConn, setNewWsConn, clearWsConn] = useWsConn();
  const [role, setRole] = useState<pb.ControllerRole>(pb.ControllerRole.STORY);
  const [sessionInfo, setSessionInfo] = useState<
    pb.WSControlMessageData | undefined
  >();
  const [storyDetails, setStoryDetails] = useState<Session | undefined>();
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [, execGetOnGoingSession] = useAxios<
    APIResponse<Session>,
    APIResponse<undefined>
  >({});
  const [toolColor, setToolColor] = useState(COLORS[0]);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.None);
  const [toolNormWidth, setToolNormWidth] = useState(BRUSH_WIDTHS[1]);
  const [tutorialHelper, setTutorialHelper] = useState<StoreHelpers>();
  const [isTutorialRunning, handleJoyrideCallback] = useTutorial({
    showTutorialButton: useMemo(
      () => controllerState === ControllerState.DrawingSession,
      [controllerState]
    ),
    localStorageKey: CONTROLLER_TUTORIAL_KEY,
    onManualStartCallback: useCallback(() => {
      if (tutorialHelper) {
        // skip first step
        tutorialHelper.next();
      }
    }, [tutorialHelper]),
  });
  const [, , , setIsNavbarLogoClickable] = useCustomNav();
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
  const [helpCooldown, setHelpCooldown] = useState(false);

  const wsMessageHandler = useCallback(
    async (ev: MessageEvent<ArrayBuffer>) => {
      const msg = pb.WSMessage.decode(new Uint8Array(ev.data));
      switch (msg.type) {
        case pb.WSMessageType.CONTROL:
          {
            const msgData = msg.control as pb.WSControlMessageData;
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
        case pb.WSMessageType.JOIN:
          {
            const { joining: isJoining, role: joiningRole } =
              msg.join as pb.WSJoinMessageData;
            if (!isJoining && joiningRole === pb.ControllerRole.HUB) {
              enqueueSnackbar("Room closed!", {
                variant: "error",
              });
              // assume backend will close ws conn
              setControllerState(ControllerState.JoinForm);
            }
          }
          break;
        case pb.WSMessageType.ACHIEVEMENT:
          setAchievements(
            protoToAchievement(msg.achievement as pb.WSAchievementMessageData)
          );
          break;
        default:
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
    setHelpCooldown(true);
    setTimeout(() => {
      setHelpCooldown(false);
    }, 15000);
    enqueueSnackbar("Help requested!", { variant: "info" });
    wsConn?.send(
      pb.WSMessage.encode({
        type: pb.WSMessageType.CONTROL,
        role,
        control: { help: true },
      }).finish()
    );
  };

  const handleDone = () => {
    if (isDone) return;
    setIsDone(true);
  };

  const commonTutorialSteps: Step[] = useMemo(
    () => [
      {
        target: `#${TutorialTargetId.NavbarTutorial}`,
        content:
          "Do you want to go through the tutorial? You can access it anytime by clicking the help icon.",
        placement: "bottom",
        disableBeacon: true,
        // wierdly, close behavior is like next step, unsure on how to fix it
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.ControllerTopChipRow}`,
        content:
          "You will be assigned a role and collaboratively draw a story based on a theme.",
        placement: "bottom",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.ControllerCanvas}`,
        content:
          "You will only see your own drawing here, see teacher's hub screen for the combined drawing.",
        placement: "center",
        disableBeacon: true,
        hideCloseButton: true,
      },
    ],
    []
  );

  const drawingTutorialSteps: Step[] = useMemo(
    () => [
      {
        target: `#${TutorialTargetId.BrushTool}`,
        content: "Use brush to draw",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.EraseTool}`,
        content: "Use eraser to erase",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.FillTool}`,
        content: "Use bucket to fill with selected colour",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.PaletteTool}`,
        content: "Use palette to choose a colour",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.UndoTool}`,
        content: "Use undo to undo a recent action",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
    ],
    []
  );

  const storyTutorialSteps: Step[] = useMemo(
    () => [
      {
        target: `#${TutorialTargetId.TextTool}`,
        content: "Use text to write a story using keyboard",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.AudioTool}`,
        content: "Use microphone to record a story",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.UndoTool}`,
        content: "Use undo to undo a recent action",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
    ],
    []
  );

  const tutorialSteps = useMemo(
    () =>
      role === pb.ControllerRole.STORY
        ? commonTutorialSteps.concat(storyTutorialSteps)
        : commonTutorialSteps.concat(drawingTutorialSteps),
    [role, commonTutorialSteps, storyTutorialSteps, drawingTutorialSteps]
  );

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

  // send done control message on change
  useEffect(() => {
    if (controllerState === ControllerState.DrawingSession)
      wsConn?.send(
        pb.WSMessage.encode({
          type: pb.WSMessageType.CONTROL,
          role,
          control: { done: isDone },
        }).finish()
      );
  }, [controllerState, isDone, role, wsConn]);

  // prevent student accidentally going to homepage when drawing
  useEffect(() => {
    if (controllerState === ControllerState.DrawingSession) {
      setIsNavbarLogoClickable(false);

      return () => setIsNavbarLogoClickable(true);
    }

    return () => {};
  }, [controllerState, setIsNavbarLogoClickable]);

  return (
    <Grid
      container
      className={`grid flex-col flex-1 relative ${classes.disableMobileHoldInteraction}`}
    >
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={isTutorialRunning}
        scrollToFirstStep
        showProgress
        showSkipButton
        disableOverlayClose
        disableScrollParentFix
        disableScrolling
        steps={tutorialSteps}
        getHelpers={setTutorialHelper}
        floaterProps={{
          disableAnimation: true,
        }}
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      />
      <div
        style={{
          gridRowStart: 1,
          gridColumnStart: 1,
        }}
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
                    role: pb.ControllerRole.STORY,
                  } as ControllerJoin
                }
                validationSchema={yup.object().shape({
                  name: yup
                    .string()
                    .required("Name required")
                    .test(
                      "len",
                      "Name too long",
                      (val) => (val || "").length <= 24
                    ),
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
                                  <MenuItem value={pb.ControllerRole.STORY}>
                                    <Icon
                                      fontSize="small"
                                      className="align-middle mr-1"
                                    >
                                      {ROLE_ICON[pb.ControllerRole.STORY].icon}
                                    </Icon>
                                    {ROLE_ICON[pb.ControllerRole.STORY].text}
                                  </MenuItem>
                                  <MenuItem value={pb.ControllerRole.CHARACTER}>
                                    <Icon
                                      fontSize="small"
                                      className="align-middle mr-1"
                                    >
                                      {
                                        ROLE_ICON[pb.ControllerRole.CHARACTER]
                                          .icon
                                      }
                                    </Icon>
                                    {
                                      ROLE_ICON[pb.ControllerRole.CHARACTER]
                                        .text
                                    }
                                  </MenuItem>
                                  <MenuItem
                                    value={pb.ControllerRole.BACKGROUND}
                                  >
                                    <Icon
                                      fontSize="small"
                                      className="align-middle mr-1"
                                    >
                                      {
                                        ROLE_ICON[pb.ControllerRole.BACKGROUND]
                                          .icon
                                      }
                                    </Icon>
                                    {
                                      ROLE_ICON[pb.ControllerRole.BACKGROUND]
                                        .text
                                    }
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid item xs={12} className="flex justify-end">
                          <Button
                            color="secondary"
                            variant="contained"
                            endIcon={<Icon fontSize="small">brush</Icon>}
                            type="submit"
                          >
                            Join
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
                endIcon={<Icon fontSize="small">brush</Icon>}
                className="mb-2"
                onClick={() => {
                  setControllerState(ControllerState.JoinForm);
                }}
              >
                Join another session
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
      </div>
      <div
        className={`flex flex-col w-full ${
          controllerState !== ControllerState.DrawingSession &&
          "invisible overflow-y-hidden"
        }`}
        style={{
          // 64px navbar height, 20px content top padding, 48px content bot padding
          height: "calc(100vh - 132px)",
          gridRowStart: 1,
          gridColumnStart: 1,
        }}
      >
        <Grid container className="mt-4">
          <Grid item xs={12}>
            <ChipRow
              primary
              rootProps={{
                id: TutorialTargetId.ControllerTopChipRow,
              }}
              chips={[
                <Chip label={storyDetails?.title} color="primary" />,
                <div className="flex gap-4">
                  {(storyDetails?.description.split(",") || []).map((tag) => (
                    <Chip label={tag} color="secondary" />
                  ))}
                </div>,
                <Chip
                  icon={
                    <Icon
                      fontSize="small"
                      className="align-middle mr-1"
                      style={{ color: colors.orange.main }}
                    >
                      {ROLE_ICON[role].icon}
                    </Icon>
                  }
                  label={ROLE_ICON[role].text}
                  style={{ color: colors.orange.main }}
                />,
              ]}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} className="relative flex-1 my-4">
          <Grid item xs={2} md={1}>
            <CanvasToolbar
              ref={canvasRef}
              role={role}
              offsetHeight={`${canvasOffsetHeight}px`}
              toolColor={toolColor}
              setToolColor={setToolColor}
              toolMode={toolMode}
              setToolMode={setToolMode}
              toolNormWidth={toolNormWidth}
              setToolNormWidth={setToolNormWidth}
            />
          </Grid>
          <Grid item xs={10} md={11}>
            <div
              ref={canvasContainerRef}
              className="grid place-items-stretch h-full"
              style={{
                border: "1px solid #0004",
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
                  offsetHeight={canvasOffsetHeight}
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
                  rootId={TutorialTargetId.ControllerCanvas}
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
                  toolNormWidth={toolNormWidth}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
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
                  className="place-self-center bg-white"
                  style={{
                    width: canvasOffsetWidth,
                    // -1 so height can shrink
                    height: canvasOffsetHeight - 1,
                    maxHeight: "100%",
                    borderRadius: "24px",
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
                  disabled: helpCooldown,
                } as ChipProps,
                {
                  icon: (
                    <Icon
                      fontSize="medium"
                      style={{ color: isDone ? colors.green : "inherit" }}
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
