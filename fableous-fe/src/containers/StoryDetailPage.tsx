import { Button, Grid, Typography, CircularProgress } from "@material-ui/core";
import useAxios from "axios-hooks";
import { useEffect, useState, useRef } from "react";
import { Alert } from "@material-ui/lab";
import { useParams } from "react-router-dom";
import { restAPI } from "../Api";
import { APIResponse, Manifest, Session } from "../Data";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole } from "../constant";
import { TextShapeMap } from "../components/canvas/data";

export default function StoryDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [textShapes, setTextShapes] = useState<TextShapeMap>({});
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  const [
    { data: story, loading: getLoading, error: getError },
    executeGetClassroomDetail,
  ] = useAxios<APIResponse<Session>, APIResponse<undefined>>(
    restAPI.session.getOne(classroomId, sessionId),
    { manual: true }
  );

  const [page, setPage] = useState(1);
  const [{ data: manifest }, executeGetManifest] = useAxios<
    Manifest,
    undefined
  >(restAPI.gallery.getAsset(classroomId, sessionId, page, "manifest.json"), {
    manual: true,
  });

  useEffect(() => {
    executeGetClassroomDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    executeGetManifest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, story]);

  useEffect(() => {
    if (manifest) setTextShapes(manifest.texts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  return (
    <Grid container>
      <Grid item xs={12} className="mb-4">
        <Typography variant="h2">
          new {Object.keys(manifest?.texts || {}).length} texts
        </Typography>
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
              <div className="grid">
                <div
                  style={{
                    gridRowStart: 1,
                    gridColumnStart: 1,
                    zIndex: 10,
                  }}
                >
                  <Canvas
                    ref={canvasRef}
                    wsConn={undefined}
                    role={ControllerRole.Hub}
                    layer={ControllerRole.Story}
                    pageNum={page}
                    // isGallery
                    setTextShapes={setTextShapes}
                    textShapes={textShapes}
                  />
                </div>
                <div
                  style={{
                    gridRowStart: 1,
                    gridColumnStart: 1,
                    zIndex: 1,
                    pointerEvents: "none", // forwards pointer events to next layer
                  }}
                >
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
                </div>
              </div>
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
