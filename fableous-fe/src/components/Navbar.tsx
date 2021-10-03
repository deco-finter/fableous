import { Icon, makeStyles } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useContext } from "react";

import { AuthContext } from "./AuthProvider";
import { useAdditionalNav } from "./AdditionalNavProvider";

const useStyles = makeStyles(() => ({
  home: {
    fontSize: "1.5rem",
  },
}));

export default function Navbar() {
  const history = useHistory();
  const location = useLocation();
  const [, isAuthenticated, , clearToken] = useContext(AuthContext);
  const onLogout = () => {
    clearToken();
    history.push("/");
  };
  const [navs] = useAdditionalNav();
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
        {navs.map(({ icon, label, buttonProps }) => (
          <Button
            variant="outlined"
            className="text-white"
            startIcon={<Icon fontSize="small">{icon}</Icon>}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...buttonProps}
          >
            {label}
          </Button>
        ))}
        {isAuthenticated && (
          <>
            <Button
              variant="outlined"
              className="text-white"
              startIcon={<Icon fontSize="small">person</Icon>}
              component={Link}
              to="/profile"
            >
              Profile
            </Button>
            <Button
              variant="outlined"
              className="ml-4 text-white"
              startIcon={<Icon fontSize="small">logout</Icon>}
              onClick={onLogout}
            >
              Logout
            </Button>
          </>
        )}
        {!isAuthenticated && location.pathname !== "/join" && (
          <>
            <Button
              variant="outlined"
              className="text-white"
              startIcon={<Icon fontSize="small">login</Icon>}
              component={Link}
              to="/login"
            >
              Login
            </Button>
            <Button
              variant="outlined"
              className="ml-4 text-white"
              startIcon={<Icon fontSize="small">person</Icon>}
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
