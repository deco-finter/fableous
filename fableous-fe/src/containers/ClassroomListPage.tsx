import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { Link } from "react-router-dom";
import { restAPI } from "../Api";
import { APIResponse, Classroom } from "../Data";

export default function ClassroomListPage() {
  const [{ data: classrooms, loading, error }] = useAxios<
    APIResponse<Classroom[]>,
    string
  >(restAPI.classroom.getList());
  return (
    <Grid item xs={12}>
      <Typography variant="h2" className="mb-4">
        Classrooms
      </Typography>
      {loading && (
        <Grid container justify="center">
          <CircularProgress />
        </Grid>
      )}
      {error && <Alert severity="error">Failed loading classrooms!</Alert>}
      <Grid container spacing={2}>
        {classrooms?.data?.map((classroom) => (
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  {classroom.name}
                </Typography>
              </CardContent>
              <CardActions>
                <Link to={`/classroom/${classroom.id}`}>
                  <Button size="small">View</Button>
                </Link>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}
