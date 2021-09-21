import {
  Button,
  Grid,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Icon,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { Formik } from "formik";
import { useSnackbar } from "notistack";
import { useEffect, useState, useCallback } from "react";
import * as yup from "yup";
import { restAPI } from "../api";
import BackButton from "../components/BackButton";
import FormikTextField from "../components/FormikTextField";
import { APIResponse, User } from "../data";

export default function ProfilePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [user, setUser] = useState<User>();
  const [editing, setEditing] = useState(false);

  const [{ loading: getLoading, error: getError }, executeGet] = useAxios<
    APIResponse<User>,
    APIResponse<undefined>
  >(restAPI.user.get(), {
    manual: true,
  });
  const [{ loading: putLoading }, executePut] = useAxios<
    APIResponse<undefined>,
    APIResponse<undefined>
  >(restAPI.user.update(), { manual: true });

  const getUserInfo = useCallback(() => {
    executeGet()
      .then((response) => {
        setUser(response.data.data);
      })
      .catch((error) => {
        console.error("get user", error);
      });
  }, [executeGet]);

  const handleEditSubmit = (values: User) => {
    const newUser = {
      name: values.name.trim(),
      email: values.email.trim(),
    };

    executePut({
      data: newUser,
    })
      .then(() => {
        setUser(newUser);
        setEditing(false);
        enqueueSnackbar("sucessfully updated profile", {
          variant: "success",
        });
      })
      .catch(() => {
        enqueueSnackbar("failed to update profile", {
          variant: "error",
        });
      });
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  return (
    <Grid container>
      <Grid item xs={12} className="mb-4">
        <BackButton />
        <Typography variant="h2">Manage Profile</Typography>
      </Grid>
      {getLoading && (
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading profile!</Alert>}
      {!getLoading && !getError && (
        <Grid item xs={4}>
          <Card elevation={8}>
            <Formik
              enableReinitialize
              initialValues={user || { name: "", email: "" }}
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
                email: yup
                  .string()
                  .trim()
                  .email("Email invalid")
                  .required("Email is required"),
              })}
              onSubmit={handleEditSubmit}
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
                        disabled: !editing || putLoading,
                        variant: "outlined",
                        className: "mb-4",
                      }}
                    />
                    <FormikTextField
                      formik={formik}
                      name="email"
                      label="Email"
                      overrides={{
                        autoFocus: false,
                        disabled: !editing || putLoading,
                        variant: "outlined",
                      }}
                    />
                  </CardContent>
                  {editing ? (
                    <CardActions>
                      <div className="flex-grow" />
                      <Button
                        size="small"
                        disabled={putLoading}
                        onClick={() => {
                          handleCancel();
                          formik.resetForm({
                            values: user,
                          });
                        }}
                      >
                        <Icon fontSize="small">cancel</Icon>
                      </Button>
                      <Button size="small" disabled={putLoading} type="submit">
                        <Icon fontSize="small">save</Icon>
                      </Button>
                    </CardActions>
                  ) : (
                    <CardActions>
                      <Button size="small" onClick={handleEdit}>
                        <Icon fontSize="small">edit</Icon>
                      </Button>
                    </CardActions>
                  )}
                </form>
              )}
            </Formik>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}
