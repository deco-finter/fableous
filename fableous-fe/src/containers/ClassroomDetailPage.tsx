import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Grid,
  Icon,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { Link, useHistory, useParams } from "react-router-dom";
import { restAPI } from "../Api";
import { APIResponse, Classroom, Session } from "../Data";

export default function ClassroomListPage() {
  const history = useHistory();
  const { classroomId } = useParams<{ classroomId: string }>();
  const [editing, setEditing] = useState<boolean>(false);
  const [classroom, setClassroom] = useState<Classroom>();
  const [classroomCopy, setClassroomCopy] = useState<Classroom>();
  const [ongoingSession, setOngoingSession] = useState<Session>();
  const [{ loading: getLoading, error: getError }, executeGet] = useAxios<
    APIResponse<Classroom>,
    APIResponse<undefined>
  >(restAPI.classroom.getOne(classroomId), { manual: true });
  const [, executePut] = useAxios<
    APIResponse<Classroom>,
    APIResponse<undefined>
  >(restAPI.classroom.update(classroomId), { manual: true });
  const [{ loading: deleteLoading }, executeDelete] = useAxios<
    APIResponse<string>,
    APIResponse<undefined>
  >(restAPI.classroom.delete(classroomId), { manual: true });
  const [{ loading: getOngoingSessionLoading }, executeGetOngoingSession] =
    useAxios<APIResponse<Session>, APIResponse<undefined>>(
      restAPI.session.getOngoing(classroomId),
      { manual: true }
    );
  const [
    { loading: deleteOngoingSessionLoading },
    executeDeleteOngoingSession,
  ] = useAxios<APIResponse<string>, APIResponse<undefined>>(
    restAPI.session.delete(classroomId, ongoingSession?.id || ""),
    { manual: true }
  );

  const handleEdit = () => {
    if (editing) {
      // TODO: validate
      executePut({
        data: {
          name: classroom?.name,
        },
      })
        .then(() => setEditing(false))
        .catch((error) => console.error(error));
    } else {
      setEditing(true);
      setClassroomCopy(classroom);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setClassroom(classroomCopy);
  };

  const handleDelete = () => {
    executeDelete()
      .then(() => {
        history.push("/classroom");
      })
      .catch((error) => console.error(error));
  };

  const handleDeleteOngoingSession = () => {
    executeDeleteOngoingSession()
      .then(() => {
        setOngoingSession(undefined);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    executeGet()
      .then((response) => {
        setClassroom(response.data.data);
      })
      .catch((error) => {
        if (error.response.status === 404) {
          history.push("/classroom");
        } else {
          console.error(error);
        }
      });
    executeGetOngoingSession()
      .then((response) => {
        setOngoingSession(response.data.data);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          setOngoingSession(undefined);
        } else {
          console.error(error);
        }
      });
  }, [executeGet, executeGetOngoingSession, history]);

  return (
    <Grid container xs={12}>
      <Grid container>
        <Button
          onClick={() => history.push("/classrooms")}
          disabled={editing}
          startIcon={<Icon>arrow_backward</Icon>}
        >
          Back
        </Button>
      </Grid>
      {getLoading && (
        <Grid container justify="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && (
        <Alert severity="error">Failed loading classroom detail!</Alert>
      )}
      {!getLoading && !getError && (
        <>
          <Grid item xs={12} className="mb-4">
            {editing ? (
              <TextField
                value={classroom?.name}
                required
                onChange={(e) =>
                  setClassroom({
                    ...classroom,
                    name: e.target.value,
                  } as Classroom)
                }
              />
            ) : (
              <Typography variant="h2">{classroom?.name}</Typography>
            )}

            {editing ? (
              <>
                <IconButton onClick={handleEdit}>
                  <Icon>save</Icon>
                </IconButton>
                <IconButton onClick={handleCancel}>
                  <Icon>cancel</Icon>
                </IconButton>
              </>
            ) : (
              <>
                <IconButton onClick={handleEdit}>
                  <Icon>edit</Icon>
                </IconButton>
              </>
            )}
          </Grid>
          <Grid item xs={12} className="mb-4">
            {!getOngoingSessionLoading &&
              (ongoingSession ? (
                <Button
                  disabled={deleteOngoingSessionLoading}
                  onClick={handleDeleteOngoingSession}
                >
                  Stop Ongoing Session
                </Button>
              ) : (
                <Button component={Link} to={`/classroom/${classroomId}/hub`}>
                  Start New Session
                </Button>
              ))}
          </Grid>
          <Grid item xs={12}>
            <Button disabled={deleteLoading || editing} onClick={handleDelete}>
              Delete Classroom
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}
