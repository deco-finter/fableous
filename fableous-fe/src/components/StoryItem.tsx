import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
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
import { colors, generateColor, getBestTextColor } from "../colors";
import { APIResponse, Session } from "../data";

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

  const bgColor = generateColor(session.id);
  const textColor = getBestTextColor(bgColor);

  const useStyles = makeStyles(() => ({
    card: {
      position: "relative",
      overflow: "inherit",
      borderRadius: 4,
      borderLeftWidth: 24,
      borderLeftColor: "#00000080",
      background: bgColor,
    },
    cardContainer: {
      minHeight: 400,
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
    title: {
      fontFamily: "Courgette",
      textAlign: "center",
      alignSelf: "center",
      color: textColor,
    },
    description: {
      textAlign: "center",
      marginTop: 16,
      marginBottom: 16,
    },
    descriptionChip: {
      margin: 4,
      background: "#00000040",
      color: textColor,
    },
    author: {
      textAlign: "center",
      marginTop: 16,
      fontStyle: "italic",
      color: textColor,
    },
    splitter: {
      borderColor: "black",
      opacity: 0.2,
      marginLeft: 32,
      marginRight: 32,
    },
    actionButton: {
      color: textColor,
      opacity: 0.5,
    },
    inputInput: {
      color: textColor,
    },
    inputRoot: {
      color: textColor,
      "& fieldset": {
        color: textColor,
        borderColor: textColor,
      },
      "&:hover fieldset": {
        color: textColor,
        borderColor: textColor,
      },
    },
  }));

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
      <Card className={classes.card} elevation={8}>
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
              <CardContent className="flex-grow flex flex-col">
                {editing ? (
                  <FormikTextField
                    formik={formik}
                    name="title"
                    label="Title"
                    overrides={{
                      autoFocus: true,
                      disabled: putLoading,
                      variant: "outlined",
                      className: `mb-4 ${classes.inputInput}`,
                      InputProps: {
                        classes: {
                          root: classes.inputRoot,
                          input: classes.inputInput,
                        },
                      },
                      InputLabelProps: {
                        classes: {
                          root: classes.inputInput,
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex-grow flex">
                    <Typography
                      variant="h4"
                      component="h2"
                      className={`w-full overflow-ellipsis overflow-hidden ${classes.title}`}
                    >
                      {session.title}
                    </Typography>
                  </div>
                )}
                {editing ? (
                  <FormikTextField
                    formik={formik}
                    name="description"
                    label="Description"
                    overrides={{
                      disabled: putLoading,
                      variant: "outlined",
                      className: "mb-4",
                      InputProps: {
                        classes: {
                          root: classes.inputRoot,
                          input: classes.inputInput,
                        },
                      },
                      InputLabelProps: {
                        classes: {
                          root: classes.inputInput,
                        },
                      },
                    }}
                  />
                ) : (
                  <>
                    <hr className={classes.splitter} />
                    <div className={classes.description}>
                      {session.description.split(",").map((tag) => (
                        <Chip
                          label={tag.trim()}
                          size="small"
                          key={tag}
                          className={classes.descriptionChip}
                        />
                      ))}
                    </div>
                    <hr className={classes.splitter} />
                  </>
                )}
                {!editing && (
                  <div className={classes.author}>
                    <ul>
                      <li className="overflow-ellipsis overflow-hidden">
                        {session.nameStory}
                      </li>
                      <li className="overflow-ellipsis overflow-hidden">
                        {session.nameCharacter}
                      </li>
                      <li className="overflow-ellipsis overflow-hidden">
                        {session.nameBackground}
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
              {editing ? (
                <CardActions>
                  <div className="flex-grow" />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon fontSize="small">cancel</Icon>}
                    className={classes.actionButton}
                    disabled={putLoading || deleteLoading}
                    onClick={() => {
                      handleCancel();
                      formik.resetForm({
                        values: session,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon fontSize="small">save</Icon>}
                    className={classes.actionButton}
                    disabled={putLoading || deleteLoading}
                    type="submit"
                  >
                    Save
                  </Button>
                </CardActions>
              ) : (
                <CardActions>
                  {editable && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Icon fontSize="small">edit</Icon>}
                      onClick={handleEdit}
                      className={classes.actionButton}
                    >
                      Edit
                    </Button>
                  )}
                  <div className="flex-grow" />
                  <Button
                    size="small"
                    color="secondary"
                    variant="contained"
                    endIcon={<Icon fontSize="small">book</Icon>}
                    component={Link}
                    to={`/gallery/${classroomId}/${session.id}`}
                  >
                    Read
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
