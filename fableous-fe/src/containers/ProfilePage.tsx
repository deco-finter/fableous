import {
  Button,
  Icon,
  Grid,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { Formik } from "formik";
import { useSnackbar } from "notistack";
import { useEffect, useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import * as yup from "yup";
import { restAPI } from "../Api";
import FormikTextField from "../components/FormikTextField";
import { APIResponse, User } from "../Data";

export default function ProfilePage() {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [user, setUser] = useState<User>();
  const [isEditing, setIsEditing] = useState(false);

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
        setIsEditing(false);
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

  const handleCancel = () => {
    getUserInfo();
    setIsEditing(false);
  };

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  return (
    <Grid>
      <Button
        onClick={() => history.goBack()}
        startIcon={<Icon>arrow_backward</Icon>}
      >
        Back
      </Button>
      {(getLoading || putLoading) && <CircularProgress />}
      {getError && <Alert severity="error">Failed loading profile!</Alert>}
      {!getLoading && !getError && !putLoading && (
        <>
          <Typography variant="h2">{user?.name}&apos;s profile</Typography>
          {!isEditing ? (
            <>
              <Typography variant="body1">Email: {user?.email}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                edit profile
              </Button>
            </>
          ) : (
            <Formik
              enableReinitialize
              initialValues={user as User}
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
              validateOnMount
              onSubmit={handleEditSubmit}
            >
              {(formik) => (
                <form onSubmit={formik.handleSubmit} autoComplete="off">
                  <div>
                    <FormikTextField
                      formik={formik}
                      name="name"
                      label="Name"
                      overrides={{
                        autoFocus: true,
                        disabled: putLoading,
                      }}
                    />
                  </div>
                  <div>
                    <FormikTextField
                      formik={formik}
                      name="email"
                      label="Email"
                      overrides={{
                        autoFocus: true,
                        disabled: putLoading,
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      disabled={putLoading}
                      type="submit"
                      variant="contained"
                      color="primary"
                      className="mr-2"
                    >
                      update
                    </Button>
                    <Button
                      disabled={putLoading}
                      onClick={handleCancel}
                      variant="contained"
                      color="secondary"
                    >
                      cancel
                    </Button>
                  </div>
                </form>
              )}
            </Formik>
          )}
        </>
      )}
    </Grid>
  );
}
