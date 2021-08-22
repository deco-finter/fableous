import { Container, Grid } from "@material-ui/core";
import { BrowserRouter as Router } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Routes from "./Routes";

export default function App() {
  return (
    <div id="app">
      <AuthProvider>
        <SnackbarProvider maxSnack={3}>
          <Router>
            <Navbar />
            <Container className="pt-5">
              <Grid container>
                <Routes />
              </Grid>
            </Container>
          </Router>
        </SnackbarProvider>
      </AuthProvider>
    </div>
  );
}
