import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import {
  Card,
  CardContent,
  Chip,
  ChipProps,
  CircularProgress,
  Paper,
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import useAxios from "axios-hooks";
import { Formik, FormikHelpers } from "formik";
import Icon from "@material-ui/core/Icon";
import { useSnackbar } from "notistack";
import { useRef, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import * as yup from "yup";
import { restAPI, wsAPI } from "../api";
import {
  Manifest,
  Story,
  WSControlMessageData,
  WSJoinMessageData,
  WSMessage,
} from "../data";
import AchievementButton from "../components/achievement/AchievementButton";
import Canvas from "../components/canvas/Canvas";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";
import FormikTextField from "../components/FormikTextField";
import { useAchievement, useWsConn } from "../hooks";
import {
  WSMessageType,
  ControllerRole,
  ROLE_ICON,
  StudentRole,
} from "../constant";
import BackButton from "../components/BackButton";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import useContainRatio from "../hooks/useContainRatio";
import { ASPECT_RATIO } from "../components/canvas/constants";
import LayerIcon from "../components/canvas/LayerIcon";
import ChipRow from "../components/ChipRow";

const INIT_FLAG = {
  [ControllerRole.Story]: false,
  [ControllerRole.Character]: false,
  [ControllerRole.Background]: false,
};

enum HubState {
  SessionForm = "SESSION_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
}

export default function HubCanvasPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [hubState, setHubState] = useState<HubState>(HubState.SessionForm);
  const [wsConn, setNewWsConn, clearWsConn] = useWsConn();
  const [classroomToken, setClassroomToken] = useState("");
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
        const msg = JSON.parse(ev.data) as WSMessage;
        switch (msg.type) {
          case WSMessageType.Control:
            {
              const {
                classroomToken: classroomTokenFromWs,
                help,
                done,
              } = msg.data as WSControlMessageData;
              if (classroomTokenFromWs) {
                setClassroomToken(classroomTokenFromWs);
              }
              console.log(msg);
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
                switch (role) {
                  case ControllerRole.Story:
                    setStoryCursor(undefined);
                    break;
                  case ControllerRole.Character:
                    setCharacterCursor(undefined);
                    break;
                  case ControllerRole.Background:
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

  const isAllControllersJoined = (): boolean => {
    return (
      [
        ControllerRole.Story,
        ControllerRole.Character,
        ControllerRole.Background,
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
        JSON.stringify({
          type: WSMessageType.Image,
          data: {
            id: currentPageIdx,
            text: dataUrl,
          },
        } as WSMessage)
      );
      wsConn?.send(
        JSON.stringify({
          type: WSMessageType.Manifest,
          data: {
            id: currentPageIdx,
            text: JSON.stringify({
              texts: storyTextShapes,
              audios: audioPaths,
              achievements,
            } as Manifest),
          },
        } as WSMessage)
      );
    }
    setHubState(HubState.DrawingSession);
    wsConn?.send(
      JSON.stringify({ type: WSMessageType.Control, data: { nextPage: true } })
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
      setHelpControllers({
        [ControllerRole.Story]: false,
        [ControllerRole.Character]: false,
        [ControllerRole.Background]: false,
      });
      setDoneControllers({
        [ControllerRole.Story]: false,
        [ControllerRole.Character]: false,
        [ControllerRole.Background]: false,
      });
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
        <Grid item xs={12} className="mb-8">
          <BackButton className="mb-2" />
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
      <div
        className={`flex flex-col absolute w-full h-full ${
          hubState !== HubState.DrawingSession && "invisible"
        }`}
      >
        <Grid container>
          <Grid item xs={12}>
            <ChipRow
              primary
              chips={[
                <Chip label={story?.title} color="primary" />,
                ...(story?.description.split(",") || []),
              ]}
            />
          </Grid>
        </Grid>
        <Grid container className="flex-1 my-4">
          <Grid item xs={2} md={1}>
            <div className="h-full flex flex-col justify-center items-center">
              <div
                className="overflow-y-scroll overflow-x-hidden mr-4"
                style={{
                  height: canvasOffsetHeight || "100%",
                  maxHeight: "100%",
                  maxWidth: "100px",
                }}
              >
                <Paper className="p-1 flex flex-col justify-around items-center min-h-full px-2 items-stretch">
                  {[
                    ControllerRole.Story,
                    ControllerRole.Character,
                    ControllerRole.Background,
                  ].map((role) => (
                    <LayerIcon
                      role={role as StudentRole}
                      focusLayer={focusLayer}
                      setFocusLayer={setFocusLayer}
                      onClick={() =>
                        setHelpControllers({
                          ...helpControllers,
                          [role]: false,
                        })
                      }
                      joinedControllers={joinedControllers}
                      needsHelp={helpControllers[role as StudentRole]}
                      isDone={doneControllers[role as StudentRole]}
                    />
                  ))}
                </Paper>
              </div>
            </div>
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
                className={`grid ${
                  focusLayer &&
                  focusLayer !== ControllerRole.Story &&
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
                  name={ROLE_ICON[ControllerRole.Story].text}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== ControllerRole.Character &&
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
                  name={ROLE_ICON[ControllerRole.Character].text}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== ControllerRole.Background &&
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
                  name={ROLE_ICON[ControllerRole.Background].text}
                  isShown={hubState === HubState.DrawingSession}
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              <div
                className={`grid ${
                  focusLayer &&
                  focusLayer !== ControllerRole.Story &&
                  "invisible"
                }`}
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
                className={`grid ${
                  focusLayer &&
                  focusLayer !== ControllerRole.Character &&
                  "invisible"
                }`}
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
                className={`grid ${
                  focusLayer &&
                  focusLayer !== ControllerRole.Background &&
                  "invisible"
                }`}
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
