import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      direction="column"
      style={{ height: "80vh" }}
    >
      <Grid item>
        <Typography variant="h1" className="text-center">
          Oops!
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="subtitle1" className="text-center">
          This page cannot be found.
        </Typography>
      </Grid>
      <div className="mt-16">
        <Button variant="contained" color="primary" component={Link} to="/">
          go to home
        </Button>
      </div>
    </Grid>
  );
}
