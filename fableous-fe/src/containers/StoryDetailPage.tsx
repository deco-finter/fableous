import { Button, Grid, Typography, CircularProgress } from "@material-ui/core";
import useAxios from "axios-hooks";
import { useEffect, useState } from "react";
import { Alert } from "@material-ui/lab";
import { useParams } from "react-router-dom";
import { restAPI } from "../api";
import { APIResponse, Session } from "../data";

export default function StoryDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { sessionId } = useParams<{ sessionId: string }>();

  console.log(Array.from({ length: 3 }, (_, i) => i + 1));
  const [{ data: story, loading: getLoading, error: getError }, executeGet] =
    useAxios<APIResponse<Session>, APIResponse<undefined>>(
      restAPI.session.getOne(classroomId, sessionId),
      { manual: true }
    );
  useEffect(() => {
    executeGet();
  }, [executeGet]);

  const [page, setPage] = useState(1);

  return (
    <Grid container>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">{story?.data?.title}</Typography>
      </Grid>
      {getLoading && (
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      )}
      {getError && <Alert severity="error">Failed loading Gallery!</Alert>}
      {!getLoading && !getError && (
        <Grid container spacing={2}>
          {story?.data && (
            <Grid item key={story.data.pages}>
              <h1>{page}</h1>
              <img
                src={
                  restAPI.gallery.getAsset(
                    classroomId,
                    sessionId,
                    page,
                    "image.png"
                  ).url
                }
                alt={story.data.title}
              />
              <Button
                onClick={() => page > 1 && setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                onClick={() =>
                  page < (story.data?.pages || 1) && setPage(page + 1)
                }
                disabled={page === story.data.pages}
              >
                Next
              </Button>
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  );
}
