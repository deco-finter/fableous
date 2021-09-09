import {
  Button,
  Grid,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Typography,
} from "@material-ui/core";
import { useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import useAxios from "axios-hooks";
import { Alert } from "@material-ui/lab";
import { restAPI } from "../api";
import { APIResponse, Session } from "../data";
import { AuthContext } from "../components/AuthProvider";

export default function GalleryPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const [, isAuthenticated, ,] = useContext(AuthContext);
  const [{ data: stories, loading: getLoading, error: getError }, executeGet] =
    useAxios<APIResponse<Session[]>, APIResponse<undefined>>(
      restAPI.session.getList(classroomId),
      { manual: true }
    );
  const [{ loading: deleteLoading }, executeDelete] = useAxios<
    APIResponse<string>,
    APIResponse<undefined>
  >(restAPI.classroom.delete(classroomId), { manual: true });
  useEffect(() => {
    executeGet();
  }, [executeGet]);
  const handleDelete = (sessionId: string) => {
    executeDelete({
      url: restAPI.session.delete(classroomId, sessionId).url,
    })
      .then(() => {
        executeGet();
      })
      .catch((error) => console.error(error));
  };
  return (
    <Grid container>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">Gallery</Typography>
      </Grid>
      {getLoading && (
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading Gallery!</Alert>}
      {!getLoading && !getError && (
        <Grid container spacing={2}>
          {stories?.data?.map((story) => (
            <Grid item xs={12} sm={6} md={4} key={story.title}>
              <Card className="flex flex-col h-full">
                <CardContent className="flex-grow">
                  <Typography variant="h5" component="h2">
                    {story.title}
                  </Typography>
                </CardContent>
                <CardActions>
                  {isAuthenticated ? (
                    <>
                      <Button
                        size="small"
                        disabled={deleteLoading}
                        onClick={() => handleDelete(story.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        component={Link}
                        to={`/gallery/${classroomId}/${story.id}`}
                      >
                        View
                      </Button>{" "}
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        component={Link}
                        to={`/gallery/${classroomId}/${story.id}`}
                      >
                        View
                      </Button>{" "}
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Grid>
  );
}
