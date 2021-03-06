import { Button, Grid, Icon, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

export default function HomePage() {
  const version = process.env.REACT_APP_VERSION;
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
          Fableous
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="subtitle1" className="text-center">
          Collaborative Storyteller
        </Typography>
      </Grid>
      <div className="mt-16">
        <Button
          size="large"
          variant="contained"
          color="secondary"
          component={Link}
          endIcon={<Icon fontSize="small">brush</Icon>}
          to="/join"
        >
          Join
        </Button>
      </div>
      <div id="version_tag">{version}</div>
    </Grid>
  );
}
