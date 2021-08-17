import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Grid,
  Icon,
  TextField,
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
  const [editing, setEditing] = useState<boolean>(false);
  const [classroom, setClassroom] = useState<Classroom>();
  const [classroomCopy, setClassroomCopy] = useState<Classroom>();
  const [{ loading: getLoading, error: getError }, get] = useAxios<
    APIResponse<Classroom>,
    string
  >(restAPI.classroom.get(classroomId), { manual: true });
  const [, put] = useAxios<APIResponse<Classroom>, string>(
    restAPI.classroom.update(classroomId),
    { manual: true }
  );

  const handleEdit = () => {
    if (editing) {
      // TODO: validate
      put({
        data: {
          name: classroom?.name,
        },
      })
        .then(() => setEditing(false))
        .catch((error) => console.error(error));
    } else {
      setEditing(true);
      setClassroomCopy(classroom);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setClassroom(classroomCopy);
  };

  useEffect(() => {
    get()
      .then((response) => {
        setClassroom(response.data.data);
      })
      .catch((error) => console.error(error));
  }, [get]);

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
      {getLoading && (
        <Grid container justify="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading classrooms!</Alert>}
      {!getLoading && !getError && (
        <>
          {editing ? (
            <TextField
              value={classroom?.name}
              required
              onChange={(e) =>
                setClassroom({
                  ...classroom,
                  name: e.target.value,
                } as Classroom)
              }
            />
          ) : (
            <Typography variant="h2" className="mb-4">
              {classroom?.name}
            </Typography>
          )}

          <Grid item xs={12}>
            {editing ? (
              <>
                <Button onClick={handleEdit} startIcon={<Icon>save</Icon>}>
                  Save
                </Button>
                <Button onClick={handleCancel} startIcon={<Icon>cancel</Icon>}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} startIcon={<Icon>edit</Icon>}>
                  Edit
                </Button>
              </>
            )}
          </Grid>
        </>
      )}
    </Grid>
  );
}
