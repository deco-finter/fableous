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
  ControllerRole,
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
  const [wsConn, setNewWsConn] = useWsConn();
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [controllerState, setControllerState] = useState<ControllerState>(
    ControllerState.JoinForm
  );
  const [cursor, setCursor] = useState<Cursor | undefined>();
  // TODO when url is /join/:token, auto populate this
  // TODO change to use formik and yup
  // TODO consider how to reduce no of states
  const [classroomToken, setClassroomToken] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ControllerRole>(ControllerRole.Story);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDesc, setStoryDesc] = useState("");
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [storyPageCnt, setStoryPageCnt] = useState(0);
  const [, execGetOnGoingSession] = useAxios({});

  const joinSession = () => {
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
                setClassroomId(msgData.classroomId);
                setSessionId(msgData.sessionId);
                execGetOnGoingSession(
                  restAPI.session.getOngoing(msgData.classroomId)
                )
                  .then(({ data: resp }) => {
                    setStoryTitle(resp.data.title);
                    setStoryDesc(resp.data.description);
                    setStoryPageCnt(resp.data.pages);
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

  useEffect(() => {
    if (controllerState === ControllerState.JoinForm) {
      console.log("in form again");
      setStoryTitle("");
      setStoryDesc("");
      setCurrentPageIdx(0);
      setStoryPageCnt(0);
      setClassroomToken("");
      setClassroomId("");
      setSessionId("");
    }
  }, [controllerState]);

  useEffect(() => {
    if (currentPageIdx && storyPageCnt && currentPageIdx > storyPageCnt) {
      console.log("finished story");
      setControllerState(ControllerState.StoryFinished);
    }
  }, [currentPageIdx, storyPageCnt]);

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
            <p>Title: {storyTitle}</p>
            <p>Description {storyDesc}</p>
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
                  to={`/gallery/${classroomId}/${sessionId}`}
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
