import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import { makeStyles } from "@material-ui/core/styles";
import { Button, TextField, FormControl, Grid } from "@material-ui/core";

import { useState } from "react";
import { apiClient } from "../Api";

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

export default function RegisterPage() {
  const [userName, setUsername] = useState("");
  const [eMail, setEmail] = useState("");
  const [passWord, setPassword] = useState("");

  const postRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    apiClient
      .post("/api/auth/register", {
        name: userName,
        email: eMail,
        password: passWord,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
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
      <Card className={classes.root}>
        <CardContent>
          <form onSubmit={postRegister}>
            <FormControl>
              <TextField
                id="username"
                value={userName}
                onChange={(e) => setUsername(e.target.value)}
                name="username"
                label="Username"
                type="text"
              />
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
                Register
              </Button>
            </FormControl>
          </form>
        </CardContent>
      </Card>
    </Grid>
  );
}
