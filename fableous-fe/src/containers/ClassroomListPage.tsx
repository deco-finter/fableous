import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Icon,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import useAxios from "axios-hooks";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { restAPI } from "../Api";
import { APIResponse, Classroom } from "../Data";

export default function ClassroomListPage() {
  const [creating, setCreating] = useState(false);
  const [newClassroom, setNewClassroom] = useState<Classroom>({} as Classroom);
  const [
    { data: classrooms, loading: getLoading, error: getError },
    executeGet,
  ] = useAxios<APIResponse<Classroom[]>, APIResponse<undefined>>(
    restAPI.classroom.getList(),
    { manual: true }
  );
  const [{ loading: postLoading }, executePost] = useAxios<
    APIResponse<string>,
    APIResponse<undefined>
  >(restAPI.classroom.create(), {
    manual: true,
  });

  const handleCreate = () => {
    if (creating) {
      // TODO: validate
      executePost({
        data: {
          name: newClassroom?.name,
        },
      })
        .then((resp) => {
          newClassroom.id = resp.data.data || "";
          classrooms?.data?.push(newClassroom);
          setCreating(false);
        })
        .catch((error) => console.error(error));
    } else {
      setCreating(true);
      setNewClassroom({} as Classroom);
    }
  };

  const handleCancel = () => {
    setCreating(false);
    setNewClassroom({} as Classroom);
  };

  useEffect(() => {
    executeGet();
  }, [executeGet]);

  return (
    <Grid container xs={12}>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">Classrooms</Typography>
      </Grid>
      {getLoading && (
        <Grid container justify="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading classrooms!</Alert>}
      {!getLoading && !getError && (
        <Grid container spacing={2}>
          {classrooms?.data?.map((classroom) => (
            <Grid item xs={12} sm={6} md={4}>
              <Card className="flex flex-col h-full">
                <CardContent className="flex-grow">
                  <Typography variant="h5" component="h2">
                    {classroom.name}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/classroom/${classroom.id}`}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {creating ? (
            <Grid item xs={12} sm={6} md={4}>
              <Card className="flex flex-col h-full">
                <CardContent className="flex-grow">
                  <TextField
                    autoFocus
                    placeholder="Classroom name"
                    value={newClassroom?.name}
                    required
                    disabled={postLoading}
                    onChange={(e) =>
                      setNewClassroom({
                        ...newClassroom,
                        name: e.target.value,
                      } as Classroom)
                    }
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    disabled={postLoading}
                    onClick={handleCreate}
                  >
                    Create
                  </Button>
                  <Button
                    size="small"
                    disabled={postLoading}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ) : (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              container
              justifyContent="center"
              alignItems="center"
            >
              <IconButton>
                <Icon fontSize="large" onClick={handleCreate}>
                  add
                </Icon>
              </IconButton>
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  );
}
