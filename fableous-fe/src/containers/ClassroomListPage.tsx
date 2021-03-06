import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Icon,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { restAPI } from "../api";
import { colors } from "../colors";
import ClassroomItem from "../components/ClassroomItem";
import FormikTextField from "../components/FormikTextField";
import { APIResponse, Classroom } from "../data";

const useStyles = makeStyles(() => ({
  addButton: {
    "&:hover": {
      backgroundColor: colors.white,
      opacity: 1,
    },
    color: colors.blue.main,
    backgroundColor: colors.white,
    opacity: 0.8,
  },
  heightBump: {
    minHeight: 150,
  },
}));

export default function ClassroomListPage() {
  const [creating, setCreating] = useState(false);
  const [, setTicker] = useState(0);
  const [
    { data: classrooms, loading: getLoading, error: getError },
    executeGet,
  ] = useAxios<APIResponse<Classroom[]>, APIResponse<undefined>>(
    restAPI.classroom.getList(),
    { manual: true }
  );
  const [{ loading: postLoading }, executePost] = useAxios<
    APIResponse<string>,
    APIResponse<undefined>
  >(restAPI.classroom.create(), {
    manual: true,
  });

  const handleCreateSubmit = (classroom: Classroom) => {
    executePost({
      data: {
        name: classroom.name.trim(),
      },
    })
      .then((resp) => {
        // eslint-disable-next-line no-param-reassign
        classroom.id = resp.data.data || "";
        classrooms?.data?.push(classroom);
        setCreating(false);
      })
      .catch((error) => console.error(error));
  };

  const handleCreate = () => {
    setCreating(true);
  };

  const handleCancel = () => {
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    if (classrooms) {
      classrooms.data = classrooms?.data?.filter(
        (classroom) => classroom.id !== id
      );
      setTicker((prev) => prev + 1);
    }
  };

  useEffect(() => {
    executeGet();
  }, [executeGet]);

  const classes = useStyles();

  return (
    <Grid container>
      <Grid item xs={12} className="mb-8">
        <Typography variant="h2">Classrooms</Typography>
      </Grid>
      {getLoading && (
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading classrooms!</Alert>}
      {!getLoading && !getError && (
        <Grid container spacing={4}>
          {classrooms?.data?.map((classroom) => (
            <Grid item xs={12} sm={6} md={4} key={classroom.id}>
              <ClassroomItem
                classroom={classroom}
                onDelete={() => handleDelete(classroom.id)}
              />
            </Grid>
          ))}
          {creating ? (
            <Grid item xs={12} sm={6} md={4}>
              <Card className={`flex flex-col h-full ${classes.heightBump}`}>
                <Formik
                  initialValues={
                    {
                      name: "",
                    } as Classroom
                  }
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
                  validateOnBlur={false}
                  onSubmit={handleCreateSubmit}
                >
                  {(formik) => (
                    <form onSubmit={formik.handleSubmit} autoComplete="off">
                      <CardContent className="flex-grow flex flex-col">
                        <FormikTextField
                          formik={formik}
                          name="name"
                          label="Name"
                          overrides={{
                            autoFocus: true,
                            disabled: postLoading,
                            variant: "outlined",
                            className: "mb-4",
                          }}
                        />
                      </CardContent>
                      <CardActions>
                        <div className="flex-grow" />
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Icon fontSize="small">cancel</Icon>}
                          disabled={postLoading}
                          onClick={handleCancel}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Icon fontSize="small">save</Icon>}
                          disabled={postLoading}
                          type="submit"
                        >
                          Save
                        </Button>
                      </CardActions>
                    </form>
                  )}
                </Formik>
              </Card>
            </Grid>
          ) : (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              container
              justifyContent="center"
              alignItems="center"
            >
              <div
                className={`flex flex-col justify-center ${classes.heightBump}`}
              >
                <IconButton
                  className={classes.addButton}
                  onClick={handleCreate}
                >
                  <Icon fontSize="large">add</Icon>
                </IconButton>
              </div>
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  );
}
