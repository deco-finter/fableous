import { useRef, useState, useEffect } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import { Link } from "react-router-dom";
import useAxios from "axios-hooks";
import { Typography } from "@material-ui/core";
import Canvas from "../components/canvas/Canvas";
import {
  APIResponse,
  ControllerRole,
  Session,
  WSControlMessageData,
  WSMessage,
  WSMessageType,
} from "../Data";
import { restAPI, wsAPI } from "../Api";
import useWsConn from "../hooks/useWsConn";
import CursorScreen, { Cursor } from "../components/canvas/CursorScreen";

enum ControllerState {
  JoinForm = "JOIN_FORM",
  WaitingRoom = "WAITING_ROOM",
  DrawingSession = "DRAWING_SESSION",
  StoryFinished = "STORY_FINISHED",
}

export default function ControllerCanvasPage() {
  const [controllerState, setControllerState] = useState<ControllerState>(
    ControllerState.JoinForm
  );
  const [wsConn, setNewWsConn] = useWsConn();
  const [name, setName] = useState("");
  const [classroomToken, setClassroomToken] = useState("");
  const [role, setRole] = useState<ControllerRole>(ControllerRole.Story);
  // TODO when url is /join/:token, auto populate this
  // TODO change to use formik and yup
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

  const joinSession = () => {
    // TODO on error e.g. when token invalid, give feedback to user?
    const newWsConn = new WebSocket(
      wsAPI.controller.main(classroomToken, role, name)
    );
    newWsConn.onopen = () => {
      setControllerState(ControllerState.WaitingRoom);
    };
    newWsConn.onmessage = (ev: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        switch (msg.type) {
          case WSMessageType.Control:
            {
              const msgData = msg.data as WSControlMessageData;
              if (msgData.nextPage) {
                setCurrentPageIdx((prev) => {
                  if (prev === 0) {
                    setControllerState(ControllerState.DrawingSession);
                  }

                  return prev + 1;
                });
              } else if (msgData.classroomId && msgData.sessionId) {
                setSessionInfo(msgData);
                execGetOnGoingSession(
                  restAPI.session.getOngoing(msgData.classroomId)
                )
                  .then((response) => {
                    setStoryDetails(response.data.data);
                  })
                  .catch((err) => {
                    console.error(err);
                    // TODO better way to inform error
                    // eslint-disable-next-line no-alert
                    alert("get on going session failed");
                  });
              }
            }
            break;
          default:
        }
      } catch (e) {
        console.error(e);
      }
    };
    setNewWsConn(newWsConn);
  };

  // reset states when in join form state
  useEffect(() => {
    if (controllerState === ControllerState.JoinForm) {
      setSessionInfo(undefined);
      setStoryDetails(undefined);
      setClassroomToken("");
      setCurrentPageIdx(0);
    }
  }, [controllerState]);

  // go to finish state after all story pages done
  useEffect(() => {
    if (currentPageIdx && storyDetails && currentPageIdx > storyDetails.pages) {
      setControllerState(ControllerState.StoryFinished);
    }
  }, [currentPageIdx, storyDetails]);

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
          {controllerState === ControllerState.JoinForm && (
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
          )}
          <div
            className={
              controllerState !== ControllerState.JoinForm ? "block" : "hidden"
            }
          >
            <p>Role: {role}</p>
            <p>Title: {storyDetails?.title}</p>
            <p>Description {storyDetails?.description}</p>
            {controllerState === ControllerState.WaitingRoom && (
              <Typography variant="h4" component="p">
                waiting for hub to start
              </Typography>
            )}
            {controllerState === ControllerState.StoryFinished && (
              <>
                <Button
                  variant="contained"
                  onClick={() => {
                    setControllerState(ControllerState.JoinForm);
                  }}
                >
                  Join another drawing session
                </Button>
                <Button
                  variant="contained"
                  component={Link}
                  to={`/gallery/${sessionInfo?.classroomId}/${sessionInfo?.sessionId}`}
                >
                  View completed story in gallery
                </Button>
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
                <CursorScreen targetCanvasRef={canvasRef} cursor={cursor} />
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
