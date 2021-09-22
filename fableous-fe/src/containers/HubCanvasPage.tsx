import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import {
  Card,
  CardContent,
  Chip,
  ChipProps,
  CircularProgress,
  IconButton,
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import useAxios from "axios-hooks";
import { Formik, FormikHelpers } from "formik";
import Icon from "@material-ui/core/Icon";
import MusicNoteIcon from "@material-ui/icons/MusicNote";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { useSnackbar } from "notistack";
import { useRef, useEffect, useState, useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";
import * as yup from "yup";
import { restAPI, wsAPI } from "../api";
import { Story, WSControlMessageData, WSJoinMessageData } from "../data";
import AchievementButton from "../components/achievement/AchievementButton";
import Canvas from "../components/canvas/Canvas";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import FormikTextField from "../components/FormikTextField";
import { useAchievement, useWsConn } from "../hooks";
import { WSMessageType, ControllerRole } from "../constant";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import useContainRatio from "../hooks/useContainRatio";
import { ASPECT_RATIO } from "../components/canvas/constants";
import ChipRow from "../components/ChipRow";

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
  const [story, setStory] = useState<Story | undefined>();
  const canvasContainerRef = useRef<HTMLDivElement>(
    document.createElement("div")
  );
  const [canvasOffsetWidth, canvasOffsetHeight] = useContainRatio({
    containerRef: canvasContainerRef,
    ratio: 1 / ASPECT_RATIO,
  });

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

  const broadcastAchievement = useCallback(() => {
    if (hubState === HubState.DrawingSession) {
      wsConn?.send(
        JSON.stringify({
          type: WSMessageType.Achievement,
          data: achievements,
        })
      );
    }
  }, [achievements, hubState, wsConn]);

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
                broadcastAchievement();
              } else if (!joining) {
                setJoinedControllers((prev) => {
                  const prevCopy = { ...prev };
                  delete prevCopy[role];

                  return prevCopy;
                });
              }

              // show error if controller disconnects during drawing session
              if (!joining && hubState === HubState.DrawingSession) {
                enqueueSnackbar(
                  `${
                    role.charAt(0).toUpperCase() + role.toLowerCase().slice(1)
                  } leaves the room!`,
                  {
                    variant: "error",
                  }
                );
              }
            }
            break;
          default:
        }
      } catch (e) {
        console.error(e);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportCanvas = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const { width, height } = storyCanvasRef.current.getCanvas();
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(backgroundCanvasRef.current.getCanvas(), 0, 0, width, height);
    ctx.drawImage(characterCanvasRef.current.getCanvas(), 0, 0, width, height);
    ctx.drawImage(storyCanvasRef.current.getCanvas(), 0, 0, width, height);
    const link = document.createElement("a");
    link.download = "output.png";
    link.href = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    link.click();
    console.log(JSON.stringify(storyTextShapes));
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
    setCurrentPageIdx((prev) => {
      if (prev > 0) achievementNextPage();
      return prev + 1;
    });
  };

  const onBeginDrawing = () => {
    onNextPage();
    setHubState(HubState.DrawingSession);
  };

  const playAudio = useCallback(() => {
    if (audioPaths.length === 0) {
      return;
    }

    const player = document.createElement("audio");
    player.src =
      restAPI.gallery.getAssetByPath(audioPaths[audioPaths.length - 1]).url ||
      "";
    player.play();
  }, [audioPaths]);

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
      setClassroomToken("");
      setJoinedControllers({});
    }
  }, [hubState]);

  // go back to session form once all pages in story completed
  useEffect(() => {
    if (currentPageIdx && story && currentPageIdx > story.pages) {
      // TODO send canvas result to backend here
      // assume backend will close ws conn
      enqueueSnackbar("Story completed!", { variant: "success" });
      setHubState(HubState.SessionForm);
      achievementReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIdx, story, enqueueSnackbar]);

  // broadcast achievement to all joined controllers on achievement update
  useEffect(() => {
    broadcastAchievement();
  }, [achievements, broadcastAchievement]);

  return (
    <Grid container className="flex-col flex-1 relative">
      {hubState !== HubState.DrawingSession && (
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
                  [HubState.SessionForm]: "New Story",
                  [HubState.WaitingRoom]: "Lobby",
                  [HubState.DrawingSession]: "",
                }[hubState]
              }
            </Typography>
          </Grid>
        </>
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
                title: yup.string().required("Title required"),
                description: yup.string().required("Description required"),
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
                      <Grid item xs={12} className="flex-grow flex flex-col">
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
                        sm={6}
                        className="flex-grow flex flex-col"
                      >
                        <FormikTextField
                          formik={formik}
                          name="description"
                          label="Description"
                          overrides={{
                            variant: "outlined",
                            disabled: postLoading,
                          }}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
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
                      <Grid item xs={12} className="flex justify-end">
                        <Button
                          variant="contained"
                          color="secondary"
                          disabled={postLoading}
                          type="submit"
                          style={{ height: "100%" }}
                        >
                          start
                          <Icon>play_arrow</Icon>
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
                    Joined Students ({Object.keys(joinedControllers).length}/3)
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  style={{
                    color: joinedControllers[ControllerRole.Story]
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
                      <div className="ml-4">
                        {joinedControllers[ControllerRole.Story] ? (
                          <>{joinedControllers[ControllerRole.Story]}</>
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
                    color: joinedControllers[ControllerRole.Character]
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
                      <div className="ml-4">
                        {joinedControllers[ControllerRole.Character] ? (
                          <>{joinedControllers[ControllerRole.Character]}</>
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
                    color: joinedControllers[ControllerRole.Background]
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
                      <div className="ml-4">
                        {joinedControllers[ControllerRole.Background] ? (
                          <>{joinedControllers[ControllerRole.Background]}</>
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
                  <Chip color="primary" label={classroomToken} />
                  <div className="flex flex-grow" />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={onBeginDrawing}
                    disabled={!isAllControllersJoined()}
                  >
                    Begin Drawing <Icon>brush</Icon>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
      <div
        className={`flex flex-col absolute w-full h-full ${
          hubState !== HubState.DrawingSession && "invisible"
        }`}
      >
        <Grid container className="mb-4">
          <Grid item xs={12}>
            <ChipRow
              left={`Title: ${story?.title}`}
              middle={[
                <AchievementButton
                  achievements={achievements}
                  confetti
                  notify
                />,
                {
                  label:
                    currentPageIdx >= (story?.pages || -1)
                      ? "Finish"
                      : "Next page",
                  onClick: onNextPage,
                } as ChipProps,
                `Page ${currentPageIdx} of ${story?.pages || "-"}`,
                {
                  label: (
                    <IconButton
                      className="relative p-0"
                      color="primary"
                      disableRipple
                    >
                      <MusicNoteIcon fontSize="medium" />
                      <PlayArrowIcon
                        fontSize="small"
                        color="primary"
                        className="absolute -bottom-1 -right-1.5"
                      />
                    </IconButton>
                  ),
                  onClick: playAudio,
                  disabled: audioPaths.length === 0,
                } as ChipProps,
              ]}
              right={story?.description.split(",") || []}
            />
          </Grid>
        </Grid>
        <Grid container className="flex-1 mb-4">
          <Grid item xs={12}>
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
                  zIndex: 22,
                  pointerEvents: "none",
                }}
              >
                <CursorScreen
                  cursor={storyCursor}
                  name="Story"
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className="grid"
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 21,
                  pointerEvents: "none",
                }}
              >
                <CursorScreen
                  cursor={characterCursor}
                  name="Character"
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className="grid"
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                <CursorScreen
                  cursor={backgroundCursor}
                  name="Background"
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className="grid"
                style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 12 }}
              >
                <Canvas
                  ref={storyCanvasRef}
                  wsConn={wsConn}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Story}
                  pageNum={currentPageIdx}
                  offsetWidth={canvasOffsetWidth}
                  setCursor={setStoryCursor}
                  setTextShapes={setStoryTextShapes}
                  textShapes={storyTextShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
                />
              </div>
              <div
                className="grid"
                style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 11 }}
              >
                <Canvas
                  ref={characterCanvasRef}
                  wsConn={wsConn}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Character}
                  pageNum={currentPageIdx}
                  offsetWidth={canvasOffsetWidth}
                  setCursor={setCharacterCursor}
                  setTextShapes={setCharacterTextShapes}
                  textShapes={CharacterTextShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
                />
              </div>
              <div
                className="grid"
                style={{ gridRowStart: 1, gridColumnStart: 1, zIndex: 10 }}
              >
                <Canvas
                  ref={backgroundCanvasRef}
                  wsConn={wsConn}
                  role={ControllerRole.Hub}
                  layer={ControllerRole.Background}
                  pageNum={currentPageIdx}
                  offsetWidth={canvasOffsetWidth}
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
                  className="bg-white place-self-center"
                  style={{
                    width: `${canvasOffsetWidth}px`,
                    // if not decrement by 1, canvas will be larger than screen height
                    height: `${canvasOffsetHeight - 1}px`,
                    borderRadius: "30px",
                  }}
                />
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
}
