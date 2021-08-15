import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import { makeStyles } from "@material-ui/core/styles";
import { Button, TextField, FormControl, Grid } from "@material-ui/core";
import { useState } from "react";
import { apiClient } from "../Api";
import auth from "../Auth";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const postLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    apiClient
      .post("/api/auth/login", {
        email,
        password,
      })
      .then((response) => {
        auth.saveToken(response);
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
          <form onSubmit={postLogin}>
            <FormControl>
              <TextField
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                name="email"
                label="Email"
                type="email"
                variant="outlined"
              />
              <TextField
                id="password"
                value={password}
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
      </Card>
    </Grid>
  );
}
