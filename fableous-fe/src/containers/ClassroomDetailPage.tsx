import { useState } from "react";
import {
  Button,
  CircularProgress,
  Grid,
  Icon,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { useHistory, useParams } from "react-router-dom";
import { restAPI } from "../Api";
import { APIResponse, Classroom } from "../Data";

export default function ClassroomListPage() {
  const history = useHistory();
  const { classroomId } = useParams<{ classroomId: string }>();
  const [editing] = useState<boolean>(false);
  const [{ data: classroom, loading, error }] = useAxios<
    APIResponse<Classroom>,
    string
  >(restAPI.classroom.get(classroomId));

  return (
    <Grid item xs={12}>
      <Grid container>
        <Button
          onClick={() => history.push("/classrooms")}
          disabled={editing}
          startIcon={<Icon>arrow_backward</Icon>}
        >
          Back
        </Button>
      </Grid>
      {loading && (
        <Grid container justify="center">
          <CircularProgress />
        </Grid>
      )}
      {error && <Alert severity="error">Failed loading classrooms!</Alert>}
      {!loading && !error && (
        <Typography variant="h2" className="mb-4">
          {classroom?.data?.name}
        </Typography>
      )}
    </Grid>
  );
}
