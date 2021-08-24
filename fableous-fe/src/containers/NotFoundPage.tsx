import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Grid item xs={12}>
      <Typography variant="h2">404</Typography>
      <Typography variant="subtitle1">not found</Typography>
      <Button variant="contained" color="primary" component={Link} to="/">
        go to home
      </Button>
    </Grid>
  );
}
