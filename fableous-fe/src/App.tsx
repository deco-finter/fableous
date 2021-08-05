import React from 'react';
import { Container, Grid } from '@material-ui/core';
import Navbar from './components/Navbar';
import { BrowserRouter as Router} from "react-router-dom";
import Routes from './Routes';

function App() {
  return (
    <div id="app">
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

export default App;