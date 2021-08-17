import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { Link, useHistory } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export default function Navbar() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const history = useHistory();
  const [, isAuthenticated, , clearToken] = useContext(AuthContext);
  const onLogout = () => {
    clearToken();
    history.push("/");
  };
  return (
    <div className="flex-grow">
      <AppBar position="static">
        <Toolbar>
          <Button className="mr-8">
            <Typography variant="h4" className="text-white capitalize">
              <Link to="/">Fableous</Link>
            </Typography>
          </Button>
          {isAuthenticated ? (
            <>
              <Button className="mr-4" onClick={onLogout}>
                <Typography variant="h6" className="text-white capitalize">
                  Logout
                </Typography>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button className="mr-4">
                  <Typography variant="h6" className="text-white capitalize">
                    Login
                  </Typography>
                </Button>
              </Link>
              <Link to="/register">
                <Button className="mr-4">
                  <Typography variant="h6" className="text-white capitalize">
                    Register
                  </Typography>
                </Button>
              </Link>
            </>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
}
