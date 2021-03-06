import { ReactNode, useContext } from "react";
import { Icon, makeStyles } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { Link, useHistory, useLocation } from "react-router-dom";

import { AuthContext } from "./AuthProvider";
import { useCustomNav } from "./CustomNavProvider";

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
  const [additionalNavs, , isLogoClickable] = useCustomNav();
  const classes = useStyles();

  // navbar will be simplified for students
  const isOnStudentPages = location.pathname === "/join";

  const logoLinkWrapper = (children: ReactNode) => (
    <Link to="/">{children}</Link>
  );
  const logoElement = (
    <Typography variant="h1" className={classes.home}>
      Fableous
    </Typography>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        {isLogoClickable ? logoLinkWrapper(logoElement) : logoElement}
        <div className="flex-grow" /> {/* spacer */}
        {additionalNavs.map(({ icon, label, buttonProps }) => (
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
        {isAuthenticated && !isOnStudentPages && (
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
        {!isAuthenticated && !isOnStudentPages && (
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
