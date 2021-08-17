import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  TextField,
  Typography,
  makeStyles,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { useState } from "react";
import useAxios from "axios-hooks";
import { restAPI } from "../Api";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  form: {
    width: "100%",
  },
});

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [{ loading }, executeRegister] = useAxios(restAPI.auth.register(), {
    manual: true,
  });

  const postRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeRegister({
      data: {
        name,
        email,
        password,
      },
    })
      .then(() => {
        setSuccess(true);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const classes = useStyles();

  return (
    <Grid container xs={12}>
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
                <form onSubmit={postRegister}>
                  <FormControl className={classes.form}>
                    <TextField
                      id="name"
                      value={name}
                      required
                      onChange={(e) => setName(e.target.value)}
                      name="name"
                      label="Name"
                      type="text"
                      variant="outlined"
                      disabled={loading}
                      className="mb-4"
                    />
                    <TextField
                      id="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      name="email"
                      label="Email"
                      type="email"
                      variant="outlined"
                      disabled={loading}
                      className="mb-4"
                    />
                    <TextField
                      id="password"
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      name="password"
                      label="Password"
                      type="password"
                      variant="outlined"
                      disabled={loading}
                      className="mb-4"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={loading}
                    >
                      Register
                    </Button>
                  </FormControl>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Grid>
    </Grid>
  );
}
