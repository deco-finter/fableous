import {
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { Formik } from "formik";
import useAxios from "axios-hooks";
import { useEffect, useState } from "react";
import * as yup from "yup";
import FormikTextField from "./FormikTextField";
import { restAPI } from "../api";
import { colors } from "../colors";
import { APIResponse, Classroom, Session } from "../data";

const useStyles = makeStyles(() => ({
  card: {
    position: "relative",
    overflow: "inherit",
  },
  cardContainer: {
    minHeight: 150,
    display: "flex",
    flexDirection: "column",
  },
  deleteButton: {
    "&:hover": {
      background: colors.error,
    },
    position: "absolute",
    right: -8,
    top: -8,
    background: colors.error,
    color: colors.white,
  },
}));

export default function ClassroomItem(props: {
  classroom: Classroom;
  onDelete: () => void;
}) {
  const { classroom: classroomProp, onDelete: onDeleteCallback } = props;
  const [editing, setEditing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [stopping, setStopping] = useState<boolean>(false);
  const [classroom, setClassroom] = useState<Classroom>(classroomProp);
  const [ongoingSession, setOngoingSession] = useState<Session>();
  const [{ loading: putLoading }, executePut] = useAxios<
    APIResponse<Classroom>,
    APIResponse<undefined>
  >(restAPI.classroom.update(classroom.id), { manual: true });
  const [{ loading: deleteLoading }, executeDelete] = useAxios<
    APIResponse<string>,
    APIResponse<undefined>
  >(restAPI.classroom.delete(classroom.id), { manual: true });
  const [{ loading: getOngoingSessionLoading }, executeGetOngoingSession] =
    useAxios<APIResponse<Session>, APIResponse<undefined>>(
      restAPI.session.getOngoing(classroom.id),
      { manual: true }
    );
  const [
    { loading: deleteOngoingSessionLoading },
    executeDeleteOngoingSession,
  ] = useAxios<APIResponse<string>, APIResponse<undefined>>(
    restAPI.session.delete(classroom.id, ongoingSession?.id || ""),
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
        setDeleting(false);
        onDeleteCallback();
      })
      .catch((error) => console.error(error));
  };

  const handleDeleteOngoingSession = () => {
    executeDeleteOngoingSession()
      .then(() => {
        setOngoingSession(undefined);
        setStopping(false);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
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
  }, [executeGetOngoingSession]);

  const classes = useStyles();

  return (
    <>
      <Card className={classes.card} elevation={8}>
        <Formik
          initialValues={classroom as Classroom}
          validationSchema={yup.object().shape({
            name: yup
              .string()
              .trim()
              .required("Name is required")
              .test("len", "Name too long", (val) => (val || "").length <= 32),
          })}
          validateOnBlur={false}
          onSubmit={handleEditSubmit}
        >
          {(formik) => (
            <form
              className={classes.cardContainer}
              onSubmit={formik.handleSubmit}
              autoComplete="off"
            >
              {editing && (
                <IconButton
                  size="small"
                  className={classes.deleteButton}
                  disabled={putLoading || deleteLoading}
                  onClick={() => setDeleting(true)}
                >
                  <Icon>delete</Icon>
                </IconButton>
              )}
              <CardContent className="flex-grow flex flex-col">
                {editing ? (
                  <FormikTextField
                    formik={formik}
                    name="name"
                    label="Name"
                    overrides={{
                      autoFocus: true,
                      disabled: putLoading,
                      variant: "outlined",
                    }}
                  />
                ) : (
                  <Typography
                    variant="h5"
                    component="h2"
                    className="overflow-ellipsis overflow-hidden cursor-text"
                    onDoubleClick={handleEdit}
                  >
                    {classroom.name}
                  </Typography>
                )}
              </CardContent>
              <div className="flex-grow" />
              {editing ? (
                <CardActions>
                  <div className="flex-grow" />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon fontSize="small">cancel</Icon>}
                    disabled={putLoading || deleteLoading}
                    onClick={() => {
                      handleCancel();
                      formik.resetForm({
                        values: classroom,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon fontSize="small">save</Icon>}
                    disabled={putLoading || deleteLoading}
                    type="submit"
                  >
                    Save
                  </Button>
                </CardActions>
              ) : (
                <CardActions>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon fontSize="small">edit</Icon>}
                    onClick={handleEdit}
                  >
                    Edit
                  </Button>
                  <div className="flex-grow" />
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    component={Link}
                    endIcon={<Icon fontSize="small">book</Icon>}
                    to={`/gallery/${classroom.id}`}
                  >
                    Gallery
                  </Button>
                  {!getOngoingSessionLoading &&
                    (ongoingSession ? (
                      <Button
                        size="small"
                        color="default"
                        variant="contained"
                        endIcon={<Icon fontSize="small">stop</Icon>}
                        disabled={deleteOngoingSessionLoading}
                        onClick={() => setStopping(true)}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="secondary"
                        variant="contained"
                        endIcon={<Icon fontSize="small">play_arrow</Icon>}
                        component={Link}
                        to={`/classroom/${classroom.id}/hub`}
                      >
                        Start
                      </Button>
                    ))}
                </CardActions>
              )}
            </form>
          )}
        </Formik>
      </Card>
      <Dialog open={deleting} onClose={() => setDeleting(false)}>
        <DialogTitle>Delete {classroom.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to permanently delete this classroom? All
            stories in the gallery will also be deleted. This action is{" "}
            <strong>irreversible</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            style={{ color: colors.error }}
            startIcon={<Icon fontSize="small">delete</Icon>}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={stopping} onClose={() => setStopping(false)}>
        <DialogTitle>Stop {classroom.name} drawing session?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to stop this classroom&apos;s session? This
            classroom is currently drawing{" "}
            <strong>{ongoingSession?.title}</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopping(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteOngoingSession}
            style={{ color: colors.error }}
            endIcon={<Icon fontSize="small">stop</Icon>}
          >
            Stop
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
