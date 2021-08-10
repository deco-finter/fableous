import { Container, Grid } from "@material-ui/core";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar";
import Routes from "./Routes";

export default function App() {
  return (
    <div id="app">
      {/* id 'app' for tailwind css utilities to have more specificity than other css framework */}
      <Router>
        <Navbar />
        <Container className="pt-5">
          <Grid container>
            <Routes />
          </Grid>
        </Container>
      </Router>
    </div>
  );
}