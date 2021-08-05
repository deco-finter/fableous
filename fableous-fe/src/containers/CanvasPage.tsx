import React from 'react';
import { Grid, Paper } from '@material-ui/core';

export default function CanvasPage() {
  return (<>
    <Grid item xs={2}>
      <Paper>
        <h1>drawing toolbar</h1>
      </Paper>
    </Grid>
    <Grid item xs={10}>
      <h1>this is canvas page</h1>
    </Grid>
  </>);
}
