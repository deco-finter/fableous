import { useContext, useState } from "react";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  Grid,
  FormControl,
  Typography,
} from "@material-ui/core";
import useAxios from "axios-hooks";
import { useHistory } from "react-router-dom";
import { restAPI } from "../Api";
import { AuthContext } from "../components/AuthProvider";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [{ loading }, executeLogin] = useAxios(restAPI.auth.login(), {
    manual: true,
  });
  const [, , setToken] = useContext(AuthContext);

  const postLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeLogin({ data: { email, password } })
      .then((response) => {
        setToken(response.headers.authorization);
        history.push("/");
      })
      .catch((err) => {
        console.error(err);
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
            Login
          </Typography>
          <Card className={classes.root}>
            <CardContent>
              <form onSubmit={postLogin}>
                <FormControl className={classes.form}>
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
                    Login
                  </Button>
                </FormControl>
              </form>
            </CardContent>
          </Card>
        </div>
      </Grid>
    </Grid>
  );
}
