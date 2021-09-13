import {
  Button,
  Card,
  CardActions,
  CardContent,
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
import { Link } from "react-router-dom";
import * as yup from "yup";
import { restAPI } from "../api";
import FormikTextField from "../components/FormikTextField";
import { APIResponse, Classroom } from "../data";

export default function ClassroomListPage() {
  const [creating, setCreating] = useState(false);
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

  useEffect(() => {
    executeGet();
  }, [executeGet]);

  return (
    <Grid container>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">Classrooms</Typography>
      </Grid>
      {getLoading && (
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading classrooms!</Alert>}
      {!getLoading && !getError && (
        <Grid container spacing={2}>
          {classrooms?.data?.map((classroom) => (
            <Grid item xs={12} sm={6} md={4} key={classroom.id}>
              <Card className="flex flex-col h-full">
                <CardContent className="flex-grow">
                  <Typography variant="h5" component="h2">
                    {classroom.name}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/classroom/${classroom.id}`}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    component={Link}
                    to={`/gallery/${classroom.id}`}
                  >
                    Gallery
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {creating ? (
            <Grid item xs={12} sm={6} md={4}>
              <Card className="flex flex-col h-full">
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
                  onSubmit={handleCreateSubmit}
                >
                  {(formik) => (
                    <form onSubmit={formik.handleSubmit} autoComplete="off">
                      <CardContent className="flex-grow">
                        <FormikTextField
                          formik={formik}
                          name="name"
                          label="Name"
                          overrides={{
                            autoFocus: true,
                            disabled: postLoading,
                          }}
                        />
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          disabled={postLoading}
                          type="submit"
                        >
                          Create
                        </Button>
                        <Button
                          size="small"
                          disabled={postLoading}
                          onClick={handleCancel}
                        >
                          Cancel
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
              <IconButton onClick={handleCreate}>
                <Icon fontSize="large">add</Icon>
              </IconButton>
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  );
}
