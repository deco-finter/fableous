import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { Link } from "react-router-dom";

interface NavbarLinkInfo {
  to: string;
  text: string;
}

export default function Navbar() {
  const title = "fableous";
  const links: NavbarLinkInfo[] = [{ to: "/join", text: "join" }];

  return (
    <div className="flex-grow">
      <AppBar position="static">
        <Toolbar>
          <Button className="mr-8">
            <Typography variant="h4" className="text-white capitalize">
              <Link to="/">{title}</Link>
            </Typography>
          </Button>
          {links.map((link) => (
            <Button className="mr-4" key={link.to}>
              <Typography variant="h6" className="text-white capitalize">
                <Link to={link.to}>{link.text}</Link>
              </Typography>
            </Button>
          ))}
        </Toolbar>
      </AppBar>
    </div>
  );
}
