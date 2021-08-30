import React from "react";
import { Container, Grid } from "@material-ui/core";
import { BrowserRouter as Router } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Routes from "./Routes";
import InjectAxiosRespInterceptor from "./components/InjectAxiosRespInterceptor";

export default function App() {
  return (
    <div id="app">
      {/* place Snackbar outside of React.StrictMode to suppress finddomnode is deprecated warning */}
      <SnackbarProvider maxSnack={3}>
        <React.StrictMode>
          <AuthProvider>
            <Router>
              <InjectAxiosRespInterceptor />
              <Navbar />
              <Container className="pt-5">
                <Grid container>
                  <Routes />
                </Grid>
              </Container>
            </Router>
          </AuthProvider>
        </React.StrictMode>
      </SnackbarProvider>
    </div>
  );
}
