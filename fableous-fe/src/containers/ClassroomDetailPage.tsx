import {
  Button,
  CircularProgress,
  Grid,
  Icon,
  IconButton,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import * as yup from "yup";
import { restAPI } from "../Api";
import FormikTextField from "../components/FormikTextField";
import { APIResponse, Classroom, Session } from "../Data";

export default function ClassroomListPage() {
  const history = useHistory();
  const { classroomId } = useParams<{ classroomId: string }>();
  const [editing, setEditing] = useState<boolean>(false);
  const [classroom, setClassroom] = useState<Classroom>();
  const [ongoingSession, setOngoingSession] = useState<Session>();
  const [{ loading: getLoading, error: getError }, executeGet] = useAxios<
    APIResponse<Classroom>,
    APIResponse<undefined>
  >(restAPI.classroom.getOne(classroomId), { manual: true });
  const [{ loading: putLoading }, executePut] = useAxios<
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

  const handleEditSubmit = (newClassroom: Classroom) => {
    executePut({
      data: {
        name: newClassroom.name.trim(),
      },
    })
      .then(() => {
        setEditing(false);
        setClassroom(newClassroom);
      })
      .catch((error) => console.error(error));
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
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
    <Grid container>
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
        <Grid container justifyContent="center">
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
              <Formik
                initialValues={classroom as Classroom}
                validationSchema={yup.object().shape({
                  name: yup
                    .string()
                    .trim()
                    .required("Name is required")
                    .test(
                      "len",
                      "Name too long",
                      (val) => (val || "").length <= 32
                    ),
                })}
                validateOnMount
                onSubmit={handleEditSubmit}
              >
                {(formik) => (
                  <form onSubmit={formik.handleSubmit} autoComplete="off">
                    <FormikTextField
                      formik={formik}
                      name="name"
                      label="Name"
                      overrides={{
                        autoFocus: true,
                        disabled: putLoading,
                      }}
                    />
                    <IconButton disabled={putLoading} type="submit">
                      <Icon>save</Icon>
                    </IconButton>
                    <IconButton disabled={putLoading} onClick={handleCancel}>
                      <Icon>cancel</Icon>
                    </IconButton>
                  </form>
                )}
              </Formik>
            ) : (
              <>
                <Typography variant="h2">{classroom?.name}</Typography>
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
                  disabled={deleteOngoingSessionLoading || editing}
                  onClick={handleDeleteOngoingSession}
                >
                  Stop Ongoing Session
                </Button>
              ) : (
                <Button
                  disabled={editing}
                  component={Link}
                  to={`/classroom/${classroomId}/hub`}
                >
                  Start New Session
                </Button>
              ))}
          </Grid>
          <Grid item xs={12}>
            <Button
              disabled={deleteLoading || editing}
              onClick={handleDelete}
              className="text-red-500"
            >
              Delete Classroom
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}
