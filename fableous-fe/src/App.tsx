import { Container, Grid } from "@material-ui/core";
import { BrowserRouter as Router } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Routes from "./Routes";

export default function App() {
  return (
    <div id="app">
      <AuthProvider>
        <Router>
          <Navbar />
          <Container className="pt-5">
            <Grid container>
              <Routes />
            </Grid>
          </Container>
        </Router>
      </AuthProvider>
    </div>
  );
}
