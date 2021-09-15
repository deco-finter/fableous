import { makeStyles } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { Link, useHistory } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

const useStyles = makeStyles(() => ({
  home: {
    fontSize: "1.5rem",
  },
}));

export default function Navbar() {
  const history = useHistory();
  const [, isAuthenticated, , clearToken] = useContext(AuthContext);
  const onLogout = () => {
    clearToken();
    history.push("/");
  };
  const classes = useStyles();

  return (
    <AppBar position="static">
      <Toolbar>
        <Link to="/">
          <Typography variant="h1" className={classes.home}>
            Fableous
          </Typography>
        </Link>
        <div className="flex-grow" /> {/* spacer */}
        {isAuthenticated ? (
          <>
            <Button
              variant="outlined"
              className="text-white"
              component={Link}
              to="/profile"
            >
              Profile
            </Button>
            <Button
              variant="outlined"
              className="ml-4 text-white"
              onClick={onLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              className="text-white"
              component={Link}
              to="/login"
            >
              Login
            </Button>
            <Button
              variant="outlined"
              className="ml-4 text-white"
              component={Link}
              to="/register"
            >
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
