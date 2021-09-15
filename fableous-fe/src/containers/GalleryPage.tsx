import { Grid, CircularProgress, Typography } from "@material-ui/core";
import { useEffect, useContext, useState } from "react";
import { useParams } from "react-router-dom";
import useAxios from "axios-hooks";
import { Alert } from "@material-ui/lab";
import { restAPI } from "../api";
import { APIResponse, Session } from "../data";
import { AuthContext } from "../components/AuthProvider";
import StoryItem from "../components/StoryItem";

export default function GalleryPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const [, setTicker] = useState(0);
  const [, isAuthenticated, ,] = useContext(AuthContext);
  const [{ data: sessions, loading: getLoading, error: getError }, executeGet] =
    useAxios<APIResponse<Session[]>, APIResponse<undefined>>(
      restAPI.session.getList(classroomId),
      { manual: true }
    );

  const handleDelete = (sessionId: string) => {
    if (sessions) {
      sessions.data = sessions?.data?.filter(
        (session) => session.id !== sessionId
      );
      setTicker((prev) => prev + 1);
    }
  };

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
          {sessions?.data?.map((session) => (
            <Grid item xs={12} sm={6} md={4} key={session.id}>
              <StoryItem
                session={session}
                classroomId={classroomId}
                editable={isAuthenticated}
                onDelete={() => handleDelete(session.id)}
              />
            </Grid>
          ))}
          {!sessions?.data?.length && (
            <Grid item xs={12}>
              <Alert severity="info">No stories have been completed!</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  );
}
