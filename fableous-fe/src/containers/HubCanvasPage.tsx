import {
  Button,
  Card,
  CardContent,
  Chip,
  ChipProps,
  CircularProgress,
  Grid,
  Icon,
  Typography,
} from "@material-ui/core";
import useAxios from "axios-hooks";
import { Formik, FormikHelpers } from "formik";
import { useSnackbar } from "notistack";
import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import * as yup from "yup";
import { restAPI, wsAPI } from "../api";
import { APIResponse, Manifest, Session, Story } from "../data";
import AchievementButton from "../components/achievement/AchievementButton";
import Canvas from "../components/canvas/Canvas";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import FormikTextField from "../components/FormikTextField";
import { useAchievement, useWsConn } from "../hooks";
import { ROLE_ICON, StudentRole } from "../constant";
import BackButton from "../components/BackButton";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import useContainRatio from "../hooks/useContainRatio";
import { ASPECT_RATIO } from "../components/canvas/constants";
import ChipRow from "../components/ChipRow";
import FormikTagField from "../components/FormikTagField";
import LayerToolbar from "../components/canvas/LayerToolbar";
import { achievementToProto } from "../components/achievement/achievement";
import { proto as pb } from "../proto/message_pb";

const INIT_FLAG = {
  [pb.ControllerRole.STORY]: false,
  [pb.ControllerRole.CHARACTER]: false,
  [pb.ControllerRole.BACKGROUND]: false,
};

enum HubState {
  SessionForm = "SESSION_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
  StoryFinished = "STORY_FINISHED",
}

export default function HubCanvasPage() {
  const history = useHistory();
  const { classroomId } = useParams<{ classroomId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [hubState, setHubState] = useState<HubState>(HubState.SessionForm);
  const [wsConn, setNewWsConn, clearWsConn] = useWsConn();
  const [sessionInfo, setSessionInfo] = useState<
    pb.WSControlMessageData | undefined
  >();
  const [joinedControllers, setJoinedControllers] = useState<
    {
      [key in StudentRole]?: string;
    }
  >({});
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [story, setStory] = useState<Story | undefined>();
  const canvasContainerRef = useRef<HTMLDivElement>(
    document.createElement("div")
  );
  const [canvasOffsetWidth, canvasOffsetHeight] = useContainRatio({
    containerRef: canvasContainerRef,
    ratio: 1 / ASPECT_RATIO,
  });

  const [, executeGetOngoingSession] = useAxios<
    APIResponse<Session>,
    APIResponse<undefined>
  >(restAPI.session.getOngoing(classroomId), { manual: true });
  const [{ loading: postLoading }, executePostSession] = useAxios(
    restAPI.session.create(classroomId),
    {
      manual: true,
    }
  );

  const storyCanvasRef = useRef<ImperativeCanvasRef>({
    getCanvas: () => document.createElement("canvas"),
    runUndo: () => {},
    runAudio: () => {},
  });
  const characterCanvasRef = useRef<ImperativeCanvasRef>({
    getCanvas: () => document.createElement("canvas"),
    runUndo: () => {},
    runAudio: () => {},
  });
  const backgroundCanvasRef = useRef<ImperativeCanvasRef>({
    getCanvas: () => document.createElement("canvas"),
    runUndo: () => {},
    runAudio: () => {},
  });
  const [storyTextShapes, setStoryTextShapes] = useState<TextShapeMap>({});
  const [CharacterTextShapes, setCharacterTextShapes] = useState<TextShapeMap>(
    {}
  );
  const [BackgroundTextShapes, setBackgroundTextShapes] =
    useState<TextShapeMap>({});
  const [audioPaths, setAudioPaths] = useState<string[]>([]);

  const [storyCursor, setStoryCursor] = useState<Cursor | undefined>();
  const [characterCursor, setCharacterCursor] = useState<Cursor | undefined>();
  const [backgroundCursor, setBackgroundCursor] = useState<
    Cursor | undefined
  >();
  const [
    achievements,
    wsAchievementHandler,
    achievementNextPage,
    achievementReset,
  ] = useAchievement({
    debug: true,
  });
  const [focusLayer, setFocusLayer] = useState<StudentRole | undefined>(
    undefined
  );
  const [helpControllers, setHelpControllers] = useState<
    {
      [key in StudentRole]: boolean;
    }
  >(INIT_FLAG);
  const [doneControllers, setDoneControllers] = useState<
    {
      [key in StudentRole]: boolean;
    }
  >(INIT_FLAG);

  const broadcastAchievement = useCallback(() => {
    if (hubState === HubState.DrawingSession) {
      wsConn?.send(
        pb.WSMessage.encode({
          type: pb.WSMessageType.ACHIEVEMENT,
          achievement: achievementToProto(achievements),
        }).finish()
      );
    }
  }, [achievements, hubState, wsConn]);

  const handleClearController = useCallback(
    (role: StudentRole) => {
      wsConn?.send(
        pb.WSMessage.encode({
          type: pb.WSMessageType.CONTROL,
          control: pb.WSControlMessageData.create({
            clear: role,
          }),
        }).finish()
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wsConn]
  );

  const handleKickController = useCallback(
    (role: StudentRole) => {
      handleClearController(role);
      wsConn?.send(
        pb.WSMessage.encode({
          type: pb.WSMessageType.CONTROL,
          control: pb.WSControlMessageData.create({
            kick: role,
          }),
        }).finish()
      );
      enqueueSnackbar(`${ROLE_ICON[role].text} kicked!`, {
        variant: "warning",
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wsConn]
  );

  const wsMessageHandler = useCallback(
    async (ev: MessageEvent<ArrayBuffer>) => {
      const msg = pb.WSMessage.decode(new Uint8Array(ev.data));
      switch (msg.type) {
        case pb.WSMessageType.CONTROL:
          {
            const {
              classroomToken: classroomTokenFromWs,
              help,
              done,
            } = msg.control as pb.WSControlMessageData;
            if (classroomTokenFromWs) {
              setSessionInfo(msg.control as pb.WSControlMessageData);
            }
            if (help) {
              enqueueSnackbar(`${ROLE_ICON[msg.role].text} needs a hand!`, {
                variant: "info",
              });
            }
            if (!done && help)
              setHelpControllers((prev) => ({
                ...prev,
                [msg.role as StudentRole]: help,
              }));
            if (!help)
              setDoneControllers((prev) => ({
                ...prev,
                [msg.role as StudentRole]: done,
              }));
          }
          break;
        case pb.WSMessageType.JOIN:
          {
            const { role, name, joining } = msg.join as pb.WSJoinMessageData;
            if (role === pb.ControllerRole.HUB) {
              break;
            }

            // update joined controllers to show in waiting room
            if (joining && name) {
              setJoinedControllers((prev) => ({
                ...prev,
                [role]: name,
              }));
              broadcastAchievement();
            } else if (!joining) {
              setJoinedControllers((prev) => {
                const prevCopy = { ...prev };
                delete prevCopy[role as StudentRole];
                return prevCopy;
              });
              switch (role) {
                case pb.ControllerRole.STORY:
                  setStoryCursor(undefined);
                  break;
                case pb.ControllerRole.CHARACTER:
                  setCharacterCursor(undefined);
                  break;
                case pb.ControllerRole.BACKGROUND:
                  setBackgroundCursor(undefined);
                  break;
                default:
              }
              setHelpControllers((prev) => ({
                ...prev,
                [role as StudentRole]: false,
              }));
              setDoneControllers((prev) => ({
                ...prev,
                [role as StudentRole]: false,
              }));
            }

            // show error if controller disconnects during drawing session
            if (!joining && hubState === HubState.DrawingSession) {
              enqueueSnackbar(`${ROLE_ICON[role].text} leaves the room!`, {
                variant: "error",
              });
            }
          }
          break;
        case pb.WSMessageType.ERROR:
          {
            const msgData = msg.error as pb.WSErrorMessageData;
            enqueueSnackbar(msgData.error, {
              variant: "error",
            });
          }
          break;
        default:
      }
    },
    [hubState, broadcastAchievement, enqueueSnackbar]
  );

  const wsErrorHandler = useCallback(
    (err: Event) => {
      enqueueSnackbar("Connection error!", { variant: "error" });
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
      setHubState(HubState.SessionForm);
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
        setStory(values);
        setHubState(HubState.WaitingRoom);
        actions.resetForm();
      })
      .catch((err: any) => {
        enqueueSnackbar("Failed to start session!", { variant: "error" });
        console.error("post session error", err);
      });
  };

  const isAllControllersJoined = (): boolean => {
    return (
      [
        pb.ControllerRole.STORY,
        pb.ControllerRole.CHARACTER,
        pb.ControllerRole.BACKGROUND,
      ].every((role) => role in joinedControllers) ||
      process.env.NODE_ENV === "development"
    );
  };

  const onNextPage = () => {
    if (hubState === HubState.DrawingSession) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const { width, height } = storyCanvasRef.current.getCanvas();
      if (!ctx) return;
      canvas.width = width;
      canvas.height = height;
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(
        backgroundCanvasRef.current.getCanvas(),
        0,
        0,
        width,
        height
      );
      ctx.drawImage(
        characterCanvasRef.current.getCanvas(),
        0,
        0,
        width,
        height
      );
      ctx.drawImage(storyCanvasRef.current.getCanvas(), 0, 0, width, height);
      const link = document.createElement("a");
      link.download = "output.png";
      const dataUrl = canvas.toDataURL();
      wsConn?.send(
        pb.WSMessage.encode({
          type: pb.WSMessageType.IMAGE,
          paint: {
            id: currentPageIdx,
            text: dataUrl,
          },
        }).finish()
      );
      wsConn?.send(
        pb.WSMessage.encode({
          type: pb.WSMessageType.MANIFEST,
          paint: {
            id: currentPageIdx,
            text: JSON.stringify({
              texts: storyTextShapes,
              audios: audioPaths,
              achievements,
            } as Manifest),
          },
        }).finish()
      );
    }
    setHubState(HubState.DrawingSession);
    wsConn?.send(
      pb.WSMessage.encode({
        type: pb.WSMessageType.CONTROL,
        control: { nextPage: true },
      }).finish()
    );
    setCurrentPageIdx((prev) => {
      if (prev > 0) achievementNextPage();
      return prev + 1;
    });
    setHelpControllers(INIT_FLAG);
    setDoneControllers(INIT_FLAG);
  };

  const onBeginDrawing = () => {
    onNextPage();
    setHubState(HubState.DrawingSession);
  };

  const playAudio = () => {
    setAudioPaths((paths) => {
      if (paths.length !== 0) {
        const player = document.createElement("audio");
        player.src =
          restAPI.gallery.getAssetByPath(paths[paths.length - 1]).url || "";
        player.play();
      }
      return paths;
    });
  };

  // redirect back if session already initialised
  useEffect(() => {
    executeGetOngoingSession().then(() => {
      // executeGetOngoingSession will return 404 if there are no ongoing session
      history.push("/");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setStory(undefined);
      setSessionInfo(undefined);
      setJoinedControllers({});
      setFocusLayer(undefined);
      setHelpControllers(INIT_FLAG);
      setDoneControllers(INIT_FLAG);
    }
  }, [hubState]);

  // go back to session form once all pages in story completed
  useEffect(() => {
    if (currentPageIdx && story && currentPageIdx > story.pages) {
      enqueueSnackbar("Story completed!", { variant: "success" });
      setHubState(HubState.StoryFinished);
      achievementReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIdx, story, enqueueSnackbar]);

  // broadcast achievement to all joined controllers on achievement update
  useEffect(() => {
    broadcastAchievement();
  }, [achievements, broadcastAchievement]);

  return (
    <Grid container className="grid flex-col flex-1 relative">
      <div
        style={{
          gridRowStart: 1,
          gridColumnStart: 1,
        }}
      >
        {hubState !== HubState.DrawingSession && (
          <Grid item xs={12} className="mb-8">
            <BackButton className="mb-2" />
            <Typography variant="h2">
              {
                {
                  [HubState.SessionForm]: "New Story",
                  [HubState.WaitingRoom]: "Lobby",
                  [HubState.DrawingSession]: "",
                  [HubState.StoryFinished]: "Finished!",
                }[hubState]
              }
            </Typography>
          </Grid>
        )}
        {hubState === HubState.SessionForm && (
          <Grid item xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Formik
                initialValues={
                  {
                    title: "",
                    description: "",
                    pages: 1,
                  } as Story
                }
                validationSchema={yup.object({
                  title: yup
                    .string()
                    .required("Title required")
                    .test(
                      "len",
                      "Title too long",
                      (val) => (val || "").length <= 32
                    ),
                  description: yup
                    .string()
                    .required("Description required")
                    .test(
                      "len",
                      "Description too long",
                      (val) => (val || "").length <= 32
                    ),
                  pages: yup
                    .number()
                    .required("Number of pages required")
                    .integer("Invalid numbergit")
                    .positive("Must have at least one page")
                    .lessThan(21, "Maximum is 20 pages"),
                })}
                onSubmit={handleCreateSession}
              >
                {(formik) => (
                  <form onSubmit={formik.handleSubmit} autoComplete="off">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid
                          item
                          xs={12}
                          sm={8}
                          className="flex-grow flex flex-col"
                        >
                          <FormikTextField
                            formik={formik}
                            name="title"
                            label="Title"
                            overrides={{
                              autoFocus: true,
                              variant: "outlined",
                              disabled: postLoading,
                            }}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={4}
                          className="flex-grow flex flex-col"
                        >
                          <FormikTextField
                            formik={formik}
                            name="pages"
                            label="Pages"
                            overrides={{
                              type: "number",
                              variant: "outlined",
                              disabled: postLoading,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} className="flex-grow flex flex-col">
                          <FormikTagField
                            formik={formik}
                            name="description"
                            label="Description Tags"
                            maxTags={3}
                            maxTagLength={10}
                            tagProps={{
                              color: "secondary",
                            }}
                            overrides={{
                              inputMode: "text",
                              variant: "outlined",
                              disabled: postLoading,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} className="flex justify-end">
                          <Button
                            color="secondary"
                            variant="contained"
                            endIcon={<Icon fontSize="small">play_arrow</Icon>}
                            disabled={postLoading}
                            type="submit"
                            style={{ height: "100%" }}
                          >
                            Start
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
        {hubState === HubState.WaitingRoom && (
          <Grid item xs={12} sm={8} md={6} lg={4}>
            <Card>
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="h6">
                      Joined Students ({Object.keys(joinedControllers).length}
                      /3)
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    style={{
                      color: joinedControllers[pb.ControllerRole.STORY]
                        ? "inherit"
                        : "gray",
                    }}
                  >
                    <Grid container>
                      <Grid item xs={4}>
                        <Icon fontSize="small" className="align-middle">
                          text_fields
                        </Icon>
                        Story
                      </Grid>
                      <Grid item xs={8}>
                        <div className="ml-4 overflow-ellipsis overflow-hidden">
                          {joinedControllers[pb.ControllerRole.STORY] ? (
                            <>{joinedControllers[pb.ControllerRole.STORY]}</>
                          ) : (
                            <>
                              waiting to join{" "}
                              <CircularProgress
                                size={12}
                                thickness={8}
                                className="ml-1"
                              />
                            </>
                          )}
                        </div>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    style={{
                      color: joinedControllers[pb.ControllerRole.CHARACTER]
                        ? "inherit"
                        : "gray",
                    }}
                  >
                    <Grid container>
                      <Grid item xs={4}>
                        <Icon fontSize="small" className="align-middle">
                          directions_run
                        </Icon>
                        Character
                      </Grid>
                      <Grid item xs={8}>
                        <div className="ml-4 overflow-ellipsis overflow-hidden">
                          {joinedControllers[pb.ControllerRole.CHARACTER] ? (
                            <>
                              {joinedControllers[pb.ControllerRole.CHARACTER]}
                            </>
                          ) : (
                            <>
                              waiting to join{" "}
                              <CircularProgress
                                size={12}
                                thickness={8}
                                className="ml-1"
                              />
                            </>
                          )}
                        </div>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    style={{
                      color: joinedControllers[pb.ControllerRole.BACKGROUND]
                        ? "inherit"
                        : "gray",
                    }}
                  >
                    <Grid container>
                      <Grid item xs={4}>
                        <Icon fontSize="small" className="align-middle">
                          image
                        </Icon>
                        Background
                      </Grid>
                      <Grid item xs={8}>
                        <div className="ml-4 overflow-ellipsis overflow-hidden">
                          {joinedControllers[pb.ControllerRole.BACKGROUND] ? (
                            <>
                              {joinedControllers[pb.ControllerRole.BACKGROUND]}
                            </>
                          ) : (
                            <>
                              waiting to join{" "}
                              <CircularProgress
                                size={12}
                                thickness={8}
                                className="ml-1"
                              />
                            </>
                          )}
                        </div>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} className="flex mt-2">
                    <Chip
                      color="primary"
                      label={sessionInfo?.classroomToken || ""}
                    />
                    <div className="flex flex-grow" />
                    <Button
                      color="secondary"
                      variant="contained"
                      endIcon={<Icon fontSize="small">brush</Icon>}
                      onClick={onBeginDrawing}
                      disabled={!isAllControllersJoined()}
                    >
                      Begin Drawing
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        {hubState === HubState.StoryFinished && (
          <>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                endIcon={<Icon fontSize="small">brush</Icon>}
                className="mb-2"
                onClick={() => {
                  setHubState(HubState.SessionForm);
                }}
              >
                Create another session
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                endIcon={<Icon fontSize="small">photo</Icon>}
                to={`/gallery/${sessionInfo?.classroomId}/${sessionInfo?.sessionId}`}
                className="mb-2"
              >
                View completed story in gallery
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                endIcon={<Icon fontSize="small">book</Icon>}
                to={`/gallery/${sessionInfo?.classroomId}`}
              >
                View classroom gallery
              </Button>
            </Grid>
          </>
        )}
      </div>
      <div
        className={`flex flex-col w-full ${
          hubState !== HubState.DrawingSession && "invisible overflow-y-hidden"
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
              chips={[
                <Chip label={story?.title} color="primary" />,
                <div className="flex gap-4">
                  {(story?.description.split(",") || []).map((tag) => (
                    <Chip label={tag} color="secondary" />
                  ))}
                </div>,
              ]}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} className="flex-1 my-4">
          <Grid item xs={2}>
            <LayerToolbar
              offsetHeight={`${canvasOffsetHeight}px`}
              focusLayer={focusLayer}
              setFocusLayer={setFocusLayer}
              joinedControllers={joinedControllers}
              handleClearController={handleClearController}
              handleKickController={handleKickController}
              helpControllers={helpControllers}
              setHelpControllers={setHelpControllers}
              doneControllers={doneControllers}
            />
          </Grid>
          <Grid item xs={10}>
            <div
              ref={canvasContainerRef}
              className="grid place-items-stretch h-full"
              style={{
                border: "1px solid #0000",
              }}
            >
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== pb.ControllerRole.STORY &&
                  "invisible"
                }`}
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 22,
                  pointerEvents: "none",
                }}
              >
                <CursorScreen
                  cursor={storyCursor}
                  name={ROLE_ICON[pb.ControllerRole.STORY].text}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== pb.ControllerRole.CHARACTER &&
                  "invisible"
                }`}
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 21,
                  pointerEvents: "none",
                }}
              >
                <CursorScreen
                  cursor={characterCursor}
                  name={ROLE_ICON[pb.ControllerRole.CHARACTER].text}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== pb.ControllerRole.BACKGROUND &&
                  "invisible"
                }`}
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                <CursorScreen
                  cursor={backgroundCursor}
                  name={ROLE_ICON[pb.ControllerRole.BACKGROUND].text}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== pb.ControllerRole.STORY &&
                  "invisible"
                }`}
                style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 12 }}
              >
                <Canvas
                  ref={storyCanvasRef}
                  wsConn={wsConn}
                  role={pb.ControllerRole.HUB}
                  layer={pb.ControllerRole.STORY}
                  pageNum={currentPageIdx}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
                  setCursor={setStoryCursor}
                  setTextShapes={setStoryTextShapes}
                  textShapes={storyTextShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== pb.ControllerRole.CHARACTER &&
                  "invisible"
                }`}
                style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}
              >
                <Canvas
                  ref={characterCanvasRef}
                  wsConn={wsConn}
                  role={pb.ControllerRole.HUB}
                  layer={pb.ControllerRole.CHARACTER}
                  pageNum={currentPageIdx}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
                  setCursor={setCharacterCursor}
                  setTextShapes={setCharacterTextShapes}
                  textShapes={CharacterTextShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== pb.ControllerRole.BACKGROUND &&
                  "invisible"
                }`}
                style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}
              >
                <Canvas
                  ref={backgroundCanvasRef}
                  wsConn={wsConn}
                  role={pb.ControllerRole.HUB}
                  layer={pb.ControllerRole.BACKGROUND}
                  pageNum={currentPageIdx}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                  offsetHeight={canvasOffsetHeight}
                  setCursor={setBackgroundCursor}
                  setTextShapes={setBackgroundTextShapes}
                  textShapes={BackgroundTextShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
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
                `Page ${currentPageIdx} of ${story?.pages || "-"}`,
                <AchievementButton
                  achievements={achievements}
                  confetti
                  notify
                />,
                {
                  icon: <Icon fontSize="medium">music_note</Icon>,
                  label: "Play Audio",
                  onClick: playAudio,
                  disabled: audioPaths.length === 0,
                } as ChipProps,
                {
                  icon:
                    currentPageIdx >= (story?.pages || -1) ? (
                      <Icon fontSize="medium">check_circle</Icon>
                    ) : (
                      <Icon fontSize="medium">skip_next</Icon>
                    ),
                  label:
                    currentPageIdx >= (story?.pages || -1)
                      ? "Finish Story"
                      : "Next Page",
                  onClick: onNextPage,
                } as ChipProps,
              ]}
            />
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
}
