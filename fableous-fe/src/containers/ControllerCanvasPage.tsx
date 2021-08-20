import { useRef, useState, useEffect } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
import useAxios from "axios-hooks";
import { Typography } from "@material-ui/core";
import * as yup from "yup";
import { Formik, FormikHelpers } from "formik";
import Canvas from "../components/canvas/Canvas";
import {
  APIResponse,
  ControllerJoin,
  ControllerRole,
  Session,
  WSControlMessageData,
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
  const [controllerState, setControllerState] = useState<ControllerState>(
    ControllerState.JoinForm
  );
  const [wsConn, setNewWsConn] = useWsConn();
  // TODO when url is /join/:token, auto populate this
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

  const handleJoinSession = (
    values: ControllerJoin,
    actions: FormikHelpers<ControllerJoin>
  ) => {
    setRole(values.role);
    // TODO on error e.g. when token invalid, give feedback to user?
    const newWsConn = new WebSocket(
      wsAPI.controller.main(values.token, values.role, values.name)
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
    actions.resetForm();
  };

  // reset states when in join form state
  useEffect(() => {
    if (controllerState === ControllerState.JoinForm) {
      setSessionInfo(undefined);
      setStoryDetails(undefined);
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
                token: yup.string().required("required"),
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
            <p>Role: {role}</p>
            <p>Title: {storyDetails?.title}</p>
            <p>Description: {storyDetails?.description}</p>
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
