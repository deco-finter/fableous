import { Grid, Paper } from "@material-ui/core";
import useAxios from "axios-hooks";
import api from "../Api";

export default function CanvasPage() {
  const [{ data: randomTheme, loading, error }] = useAxios(
    api.canvas.getRandomTheme()
  );

  return (
    <>
      <Grid item xs={2}>
        <Paper>
          <h1>drawing toolbar</h1>
        </Paper>
      </Grid>
      <Grid item xs={10}>
        {loading && <p>loading..</p>}
        {error && <p>error: {JSON.stringify(error)}</p>}
        <h1>
          this is canvas page, try drawing with theme:{" "}
          {JSON.stringify(randomTheme)}
        </h1>
      </Grid>
    </>
  );
}
