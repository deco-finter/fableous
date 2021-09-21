/* eslint-disable */
import {
  Button,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  ImageList,
  ImageListItem,
} from "@material-ui/core";
import useAxios from "axios-hooks";
import { useEffect, useState, useRef, useCallback } from "react";
import { Alert } from "@material-ui/lab";
import { useParams } from "react-router-dom";
import { restAPI } from "../api";
import { APIResponse, Manifest, Session } from "../data";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole } from "../constant";
import { TextShapeMap } from "../components/canvas/data";
import { ASPECT_RATIO } from "../components/canvas/constants";

export default function StoryDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [textShapes, setTextShapes] = useState<TextShapeMap>({});
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const imgContainerRef = useRef<HTMLDivElement>(document.createElement("div"));

  const [
    { data: story, loading: getStoryLoading, error: getStoryError },
    executeGetClassroomDetail,
  ] = useAxios<APIResponse<Session>, APIResponse<undefined>>(
    restAPI.session.getOne(classroomId, sessionId),
    { manual: true }
  );

  const [page, setPage] = useState(1);
  const [{ data: manifest, loading: getManifestLoading }, executeGetManifest] =
    useAxios<Manifest, undefined>(
      restAPI.gallery.getAsset(classroomId, sessionId, page, "manifest.json"),
      {
        manual: true,
      }
    );
  const [audioPaths, setAudioPaths] = useState<string[]>([]);

  const getImageWidth = useCallback(() => {
    const { offsetWidth: contOffWidth, offsetHeight: contOffHeight } =
      imgContainerRef.current;
    return contOffHeight / contOffWidth > ASPECT_RATIO
      ? contOffWidth
      : contOffHeight / ASPECT_RATIO;
  }, [imgContainerRef]);

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
    if (manifest) setAudioPaths(manifest.audios.map((audio) => audio.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  return (
    <Grid container className="relative">
      {/* <Grid item xs={12} className="mb-4">
        <Typography variant="h2">
          {Object.keys(manifest?.texts || {}).length} texts
        </Typography>
        <Typography variant="h2">{story?.data?.title}</Typography>
      </Grid>
      {getStoryLoading && (
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      )}
      {getStoryError && <Alert severity="error">Failed loading Gallery!</Alert>}
      {!getStoryLoading && !getStoryError && (
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
                    isShown={
                      !getStoryLoading &&
                      !!story &&
                      !getManifestLoading &&
                      !!manifest
                    } // ensures canvas is loaded withh proper dimensions
                    isGallery
                    setTextShapes={setTextShapes}
                    textShapes={textShapes}
                    audioPaths={audioPaths}
                    setAudioPaths={setAudioPaths}
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
                    style={{
                      borderWidth: 4,
                    }}
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
      )} */}

      {/* TODO ga perlu taro apa2 disini hrsnya, kecuali lu ada 2 different layout kek contoh di HubPage,
       pertama muncul form terus muncul canvas, nah form nya taro disini */}

      {/* TODO div dibawah otomatis fill height dari border bawah navbar sampe border bawah viewport, 
      contoh di HubPage ini utk layout buat ngegambar */}
      <div
        className="flex flex-col absolute w-full"
        style={{
          // navbar is 64px and there is a 20px padding
          height: "calc(100vh - 84px)",
        }}
      >
        <Grid container className="mb-4">
          {/* TODO disini buat taro info2 diatas canvas, kek title, dll, tinggi nya bakal secukupnya utk nampung content */}
          <Grid item xs={12}>
            <Paper>row of info here</Paper>
            <div>ehehhe</div>
          </Grid>
          <Grid item xs={9}>
            <Paper>hihi</Paper>
          </Grid>
          <Grid item xs={3} style={{ backgroundColor: "salmon" }}>
            {/* <Paper>hoho</Paper> */}
          </Grid>
        </Grid>
        <Grid container className="flex-1 mb-4">
          {/* TODO disini area yg utk canvas, dimana tinggi bakal nge expand sampe nyentuh bawah layar */}
          <Grid item xs={2}>
            <ImageList cols={1}>
              {Array.from(
                { length: story?.data?.pages || 0 },
                (_, i) => i + 1
              ).map((pageIndex) => (
                <ImageListItem key={pageIndex}>
                  <img
                    src={
                      restAPI.gallery.getAsset(
                        classroomId,
                        sessionId,
                        pageIndex,
                        "image.png"
                      ).url
                    }
                    // srcSet={`${item.img}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}

                    loading="lazy"
                  />
                </ImageListItem>
              ))}
            </ImageList>
            slideshow
          </Grid>
          <Grid item xs={10}>
            <div
              className="grid place-items-stretch h-full"
              style={{
                border: "3px solid black",
              }}
            >
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
                  // isShown
                  isShown={
                    !getStoryLoading &&
                    !!story &&
                    !getManifestLoading &&
                    !!manifest
                  } // ensures canvas is loaded withh proper dimensions
                  isGallery
                  setTextShapes={setTextShapes}
                  textShapes={textShapes}
                  audioPaths={audioPaths}
                  setAudioPaths={setAudioPaths}
                />
              </div>
              {/* TODO ini gw tambahin classname supaya image nya ke center, ref supaya bisa itung desired width <img /> */}
              <div
                className="grid place-items-center"
                ref={imgContainerRef}
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 1,
                  pointerEvents: "none", // forwards pointer events to next layer
                }}
              >
                <img
                  width={`${getImageWidth()}px`}
                  src={
                    restAPI.gallery.getAsset(
                      classroomId,
                      sessionId,
                      page,
                      "image.png"
                    ).url
                  }
                  alt={story?.data?.title}
                  style={{
                    // borderWidth: 4,
                    borderRadius: "30px",
                  }}
                />
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
}
