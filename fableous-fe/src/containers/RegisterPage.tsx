import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  Typography,
  makeStyles,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { Formik } from "formik";
import { useState } from "react";
import useAxios from "axios-hooks";
import * as yup from "yup";
import { useSnackbar } from "notistack";
import { restAPI } from "../Api";
import FormikTextField from "../components/FormikTextField";
import { Register } from "../Data";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  form: {
    width: "100%",
  },
});

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [{ loading }, executeRegister] = useAxios(restAPI.auth.register(), {
    manual: true,
  });

  const handleRegisterSubmit = (register: Register) => {
    executeRegister({
      data: {
        name: register.name.trim(),
        email: register.email.trim(),
        password: register.password,
      },
    })
      .then(() => {
        setSuccess(true);
      })
      .catch((error) => {
        enqueueSnackbar(error?.response?.data?.error || "register failed", {
          variant: "error",
        });
        console.error("post register err", error);
      });
  };

  const classes = useStyles();

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      style={{ height: "80vh" }}
    >
      <div>
        <Typography variant="h2" className="mb-4 text-center">
          Register
        </Typography>
        <Card className={classes.root}>
          <CardContent>
            {success ? (
              <Alert severity="success">Account successfully created!</Alert>
            ) : (
              <Formik
                initialValues={
                  {
                    name: "",
                    email: "",
                    password: "",
                    password2: "",
                  } as Register
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
                  email: yup
                    .string()
                    .trim()
                    .email("Email invalid")
                    .required("Email is required"),
                  password: yup
                    .string()
                    .required("Password is required")
                    .test(
                      "len",
                      "Password too short",
                      (val) => (val || "").length >= 8
                    ),
                  password2: yup
                    .string()
                    .required("Re-enter your password")
                    .oneOf([yup.ref("password"), null], "Passwords must match"),
                })}
                onSubmit={handleRegisterSubmit}
              >
                {(formik) => (
                  <form onSubmit={formik.handleSubmit} autoComplete="off">
                    <FormControl className={classes.form}>
                      <FormikTextField
                        formik={formik}
                        name="name"
                        label="Name"
                        overrides={{
                          variant: "outlined",
                          disabled: loading,
                          className: "mb-4",
                          type: "text",
                        }}
                      />
                      <FormikTextField
                        formik={formik}
                        name="email"
                        label="Email"
                        overrides={{
                          variant: "outlined",
                          disabled: loading,
                          className: "mb-4",
                          type: "email",
                        }}
                      />
                      <FormikTextField
                        formik={formik}
                        name="password"
                        label="Password"
                        overrides={{
                          variant: "outlined",
                          disabled: loading,
                          className: "mb-4",
                          type: "password",
                        }}
                      />
                      <FormikTextField
                        formik={formik}
                        name="password2"
                        label="Confirm password"
                        overrides={{
                          variant: "outlined",
                          disabled: loading,
                          className: "mb-4",
                          type: "password",
                        }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        type="submit"
                      >
                        Register
                      </Button>
                    </FormControl>
                  </form>
                )}
              </Formik>
            )}
          </CardContent>
        </Card>
      </div>
    </Grid>
  );
}
