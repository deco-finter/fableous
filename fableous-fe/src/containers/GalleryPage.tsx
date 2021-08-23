import {
  Button,
  Grid,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Typography,
} from "@material-ui/core";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useAxios from "axios-hooks";
import { Alert } from "@material-ui/lab";
import { restAPI } from "../Api";
import { APIResponse, Session } from "../Data";

export default function GalleryPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const [{ data: stories, loading: getLoading, error: getError }, executeGet] =
    useAxios<APIResponse<Session[]>, APIResponse<undefined>>(
      restAPI.gallery.getList(classroomId),
      { manual: true }
    );

  useEffect(() => {
    executeGet();
  }, [executeGet]);

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
                  <Button
                    size="small"
                    component={Link}
                    to={`/gallery/${classroomId}/${story.id}`}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Grid>
  );
}
