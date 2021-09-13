import React from "react";
import { Container, Grid } from "@material-ui/core";
import {
  createTheme,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core/styles";
import { BrowserRouter as Router } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Routes from "./Routes";
import InjectAxiosRespInterceptor from "./components/InjectAxiosRespInterceptor";
import colors from "./colors";

const useStyles = makeStyles({
  app: {
    background: colors.blue.dark,
    minHeight: "100vh",
  },
});

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
      MuiTypography: {
        h1: {
          fontFamily: "Courgette",
          fontWeight: 600,
          color: colors.white,
        },
        h2: {
          fontFamily: "Courgette",
          fontWeight: 600,
          color: colors.white,
        },
        subtitle1: {
          color: colors.white,
          opacity: 0.85,
        },
      },
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
      MuiPaper: {
        rounded: {
          borderRadius: 24,
        },
      },
      MuiCardContent: {
        root: {
          padding: 16,
          "&:last-child": {
            paddingBottom: 16,
          },
        },
      },
      MuiOutlinedInput: {
        root: {
          borderRadius: 16,
        },
      },
      MuiButton: {
        root: {
          borderRadius: 16,
        },
        outlinedPrimary: {
          color: colors.white,
        },
        label: {
          fontWeight: 600,
        },
      },
    },
  });

  const classes = useStyles();

  return (
    <div id="app" className={classes.app}>
      {/* place Snackbar outside of React.StrictMode to suppress finddomnode is deprecated warning */}
      <SnackbarProvider maxSnack={3}>
        <React.StrictMode>
          <AuthProvider>
            <Router>
              <InjectAxiosRespInterceptor />
              <ThemeProvider theme={theme}>
                <Navbar />
                <Container className="pt-5">
                  <Grid container>
                    <Routes />
                  </Grid>
                </Container>
              </ThemeProvider>
            </Router>
          </AuthProvider>
        </React.StrictMode>
      </SnackbarProvider>
    </div>
  );
}
