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
import { useState } from "react";
import * as yup from "yup";
import FormikTextField from "./FormikTextField";
import { restAPI } from "../api";
import colors from "../colors";
import { APIResponse, Session } from "../data";

const useStyles = makeStyles(() => ({
  card: {
    position: "relative",
    overflow: "inherit",
  },
  cardContainer: {
    minHeight: 128,
    display: "flex",
    flexDirection: "column",
  },
  deleteButton: {
    "&:hover": {
      background: colors.red.main,
    },
    position: "absolute",
    right: -8,
    top: -8,
    background: colors.red.main,
    color: colors.white,
  },
}));

export default function StoryItem(props: {
  session: Session;
  classroomId: string;
  editable: boolean;
  onDelete: () => void;
}) {
  const {
    session: sessionProp,
    classroomId,
    editable,
    onDelete: onDeleteCallback,
  } = props;
  const [editing, setEditing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [session, setSession] = useState<Session>(sessionProp);
  const [{ loading: putLoading }, executePut] = useAxios<
    APIResponse<Session>,
    APIResponse<undefined>
  >(restAPI.session.update(classroomId, session.id), { manual: true });
  const [{ loading: deleteLoading }, executeDelete] = useAxios<
    APIResponse<string>,
    APIResponse<undefined>
  >(restAPI.session.delete(classroomId, session.id), { manual: true });

  const handleEditSubmit = (newSession: Session) => {
    executePut({
      data: {
        title: newSession.title.trim(),
        description: newSession.description.trim(),
      },
    })
      .then(() => {
        setEditing(false);
        setSession(newSession);
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

  const classes = useStyles();

  return (
    <>
      <Card className={classes.card}>
        <Formik
          initialValues={session as Session}
          validationSchema={yup.object().shape({
            title: yup
              .string()
              .trim()
              .required("Title is required")
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
              <CardContent className="flex-grow">
                {editing ? (
                  <>
                    <FormikTextField
                      formik={formik}
                      name="title"
                      label="Title"
                      overrides={{
                        autoFocus: true,
                        disabled: putLoading,
                      }}
                    />
                    <FormikTextField
                      formik={formik}
                      name="description"
                      label="Description"
                      overrides={{
                        disabled: putLoading,
                      }}
                    />
                  </>
                ) : (
                  <Typography variant="h5" component="h2">
                    {session.title}
                  </Typography>
                )}
              </CardContent>
              <div className="flex-grow" />
              {editing ? (
                <CardActions>
                  <div className="flex-grow" />
                  <Button
                    size="small"
                    disabled={putLoading || deleteLoading}
                    onClick={() => {
                      handleCancel();
                      formik.resetForm({
                        values: session,
                      });
                    }}
                  >
                    <Icon fontSize="small">cancel</Icon>
                  </Button>
                  <Button
                    size="small"
                    disabled={putLoading || deleteLoading}
                    type="submit"
                  >
                    <Icon fontSize="small">save</Icon>
                  </Button>
                </CardActions>
              ) : (
                <CardActions>
                  {editable && (
                    <Button size="small" onClick={handleEdit}>
                      <Icon fontSize="small">edit</Icon>
                    </Button>
                  )}
                  <div className="flex-grow" />
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    component={Link}
                    to={`/gallery/${classroomId}/${session.id}`}
                  >
                    Read <Icon fontSize="small">book</Icon>
                  </Button>
                </CardActions>
              )}
            </form>
          )}
        </Formik>
      </Card>
      <Dialog open={deleting} onClose={() => setDeleting(false)}>
        <DialogTitle>Delete {session.title}?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to permanently delete this story? This action
            is <strong>irreversible</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
