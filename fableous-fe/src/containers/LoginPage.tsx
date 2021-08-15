/* eslint-disable */
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  Box,
  Grid,
  Typography,
  Tab,
  Tabs,
  AppBar,
  FormControlLabel,
  Checkbox,
  FormControl,
  FormHelperText,
  Link,
} from "@material-ui/core";
import { useState } from "react";
import { apiClient, restAPI } from "../Api";

// const useStyles = makeStyles({
//   root: {},
// });

// export default function LoginPage() {
//   return (
//     <Card>

//     </Card>
//   );
// }

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

export default function LoginPage() {
  const [userName, setUsername] = useState("");
  const [eMail, setEmail] = useState("");
  const [passWord, setPassword] = useState("");

  const postLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    apiClient
      .post("/api/auth/login", {
        // name: userName,
        email: eMail,
        password: passWord,
      })
      .then(function (response) {
        localStorage.setItem("token", response.headers.authorization);
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const classes = useStyles();
  const bull = <span className={classes.bullet}>•</span>;

  return (
    <Card className={classes.root}>
      <CardContent>
        <form onSubmit={postLogin}>
          <FormControl>
            <TextField
              id="email"
              value={eMail}
              onChange={(e) => setEmail(e.target.value)}
              name="email"
              label="Email"
              type="email"
            />
            <TextField
              id="password"
              value={passWord}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
              label="Password"
              type="password"
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              className="mt-5"
            >
              Login
            </Button>
          </FormControl>
        </form>
      </CardContent>
      <CardActions></CardActions>
    </Card>
  );
}
