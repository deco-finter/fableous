import React from "react";
import { Container } from "@material-ui/core";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { BrowserRouter as Router } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Routes from "./Routes";
import InjectAxiosRespInterceptor from "./components/InjectAxiosRespInterceptor";
import colors from "./colors";

export default function App() {
  const theme = createTheme({
    palette: {
      primary: {
        light: colors.blue.light,
        main: colors.blue.main,
        dark: colors.blue.dark,
      },
      secondary: {
        light: colors.orange.light,
        main: colors.orange.main,
      },
    },
    overrides: {
      MuiChip: {
        root: {
          borderRadius: "1.5rem",
          padding: "0.25rem 1rem",
          marginRight: "1rem",
          height: "auto",
          fontWeight: "bold",
          "&:last-of-type": {
            marginRight: 0,
          },
        },
        label: {
          fontSize: "1.25rem",
        },
        colorPrimary: {
          backgroundColor: colors.orange.main,
        },
        colorSecondary: {
          backgroundColor: colors.orange.light,
        },
        outlinedPrimary: {
          backgroundColor: colors.white,
          color: colors.blue.light,
        },
      },
    },
  });

  return (
    <div id="app">
      <div className="flex flex-col min-h-screen">
        {/* place Snackbar outside of React.StrictMode to suppress finddomnode is deprecated warning */}
        <SnackbarProvider maxSnack={3}>
          <React.StrictMode>
            <AuthProvider>
              <Router>
                <InjectAxiosRespInterceptor />
                <ThemeProvider theme={theme}>
                  <Navbar />
                  <Container className="flex flex-col flex-1 pt-5 ">
                    <Routes />
                  </Container>
                </ThemeProvider>
              </Router>
            </AuthProvider>
          </React.StrictMode>
        </SnackbarProvider>
      </div>
    </div>
  );
}
