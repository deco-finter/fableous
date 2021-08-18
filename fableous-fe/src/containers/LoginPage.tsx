import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  Typography,
  makeStyles,
} from "@material-ui/core";
import useAxios from "axios-hooks";
import { Formik } from "formik";
import { useContext } from "react";
import { useHistory } from "react-router-dom";
import * as yup from "yup";
import { restAPI } from "../Api";
import { AuthContext } from "../components/AuthProvider";
import FormikTextField from "../components/FormikTextField";
import { Login } from "../Data";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  form: {
    width: "100%",
  },
});

export default function LoginPage() {
  const history = useHistory();
  const [{ loading }, executeLogin] = useAxios(restAPI.auth.login(), {
    manual: true,
  });
  const [, , setToken] = useContext(AuthContext);

  const handleLoginSubmit = (login: Login) => {
    executeLogin({
      data: {
        email: login.email,
        password: login.password,
      },
    })
      .then((response) => {
        setToken(response.headers.authorization.slice(7));
        history.push("/");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const classes = useStyles();

  return (
    <Grid container>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80vh" }}
      >
        <div>
          <Typography variant="h2" className="mb-4 text-center">
            Login
          </Typography>
          <Card className={classes.root}>
            <Formik
              initialValues={
                {
                  email: "",
                  password: "",
                } as Login
              }
              validationSchema={yup.object().shape({
                email: yup.string().required("Email is required"),
                password: yup.string().required("Password is required"),
              })}
              onSubmit={handleLoginSubmit}
            >
              {(formik) => (
                <form onSubmit={formik.handleSubmit}>
                  <CardContent>
                    <FormControl className={classes.form}>
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
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        type="submit"
                      >
                        Login
                      </Button>
                    </FormControl>
                  </CardContent>
                </form>
              )}
            </Formik>
          </Card>
        </div>
      </Grid>
    </Grid>
  );
}
