import {
  Grid,
  Paper,
  ImageList,
  ImageListItem,
  IconButton,
  Button,
} from "@material-ui/core";
import { ArrowDownwardOutlined, ArrowUpwardOutlined } from "@material-ui/icons";
import useAxios from "axios-hooks";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { restAPI } from "../api";
import { APIResponse, Manifest, Session } from "../data";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole } from "../constant";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import { ASPECT_RATIO } from "../components/canvas/constants";
import useContainRatio from "../hooks/useContainRatio";

export default function StoryDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [textShapes, setTextShapes] = useState<TextShapeMap>({});
  const canvasRef = useRef<ImperativeCanvasRef>({
    getCanvas: () => document.createElement("canvas"),
    runUndo: () => {},
    runAudio: () => {},
  });

  const [{ data: story, loading: getStoryLoading }, executeGetClassroomDetail] =
    useAxios<APIResponse<Session>, APIResponse<undefined>>(
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
  const canvasContainerRef = useRef<HTMLDivElement>(
    document.createElement("div")
  );
  const [canvasOffsetWidth, canvasOffsetHeight] = useContainRatio({
    containerRef: canvasContainerRef,
    ratio: 1 / ASPECT_RATIO,
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
    if (manifest) setAudioPaths(manifest.audios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  return (
    <Grid container className="relative">
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
            ehe
          </Grid>
          <Grid item xs={9}>
            <Paper>hihi</Paper>
          </Grid>
          <Grid
            item
            xs={3}
            style={{ backgroundColor: "salmon", justifyContent: "center" }}
          >
            {/* <Paper>hoho</Paper> */}
          </Grid>
        </Grid>
        <Grid container className="flex-1 mb-4">
          {/* TODO disini area yg utk canvas, dimana tinggi bakal nge expand sampe nyentuh bawah layar */}
          <Grid
            item
            xs={2}
            style={{
              backgroundColor: "white",
              alignSelf: "center",
              display: "flex",
              flexDirection: "column",
              borderRadius: "30px",
            }}
          >
            <IconButton
              onClick={() => page > 1 && setPage(page - 1)}
              disabled={page === 1}
              style={{ alignSelf: "center" }}
            >
              <ArrowUpwardOutlined fontSize="medium" />
            </IconButton>
            <ImageList
              cols={1}
              gap={0}
              rowHeight={canvasOffsetHeight / (story?.data?.pages || 1)}
            >
              {Array.from(
                { length: story?.data?.pages || 0 },
                (_, i) => i + 1
              ).map((pageIndex) => (
                <ImageListItem key={pageIndex}>
                  <Button onClick={() => setPage(pageIndex)}>
                    <img
                      src={
                        restAPI.gallery.getAsset(
                          classroomId,
                          sessionId,
                          pageIndex,
                          "image.png"
                        ).url
                      }
                      alt={story?.data?.title}
                      loading="lazy"
                    />
                  </Button>
                </ImageListItem>
              ))}
            </ImageList>
            <div className="place-self-center">
              <IconButton
                onClick={() =>
                  page < (story?.data?.pages || 1) && setPage(page + 1)
                }
                disabled={page === story?.data?.pages}
              >
                <ArrowDownwardOutlined fontSize="medium" />
              </IconButton>
            </div>
          </Grid>
          <Grid item xs={10}>
            <div
              className="grid place-items-stretch h-full"
              style={{
                border: "3px solid black",
              }}
              ref={canvasContainerRef}
            >
              <div
                className="grid"
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
                  offsetWidth={canvasOffsetWidth}
                />
              </div>
              {/* TODO ini gw tambahin classname supaya image nya ke center, ref supaya bisa itung desired width <img /> */}
              <div
                className="grid place-items-center"
                style={{
                  gridRowStart: 1,
                  gridColumnStart: 1,
                  zIndex: 1,
                  pointerEvents: "none", // forwards pointer events to next layer
                }}
              >
                <img
                  width={canvasOffsetWidth}
                  height={canvasOffsetHeight}
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
