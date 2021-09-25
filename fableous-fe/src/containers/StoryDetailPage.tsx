import {
  Grid,
  ImageList,
  ImageListItem,
  IconButton,
  Button,
  Chip,
  Icon,
  ChipProps,
} from "@material-ui/core";
import { ArrowDownwardOutlined, ArrowUpwardOutlined } from "@material-ui/icons";
import useAxios from "axios-hooks";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import AchievementButton from "../components/achievement/AchievementButton";
import { restAPI } from "../api";
import { APIResponse, Manifest, Session } from "../data";
import Canvas from "../components/canvas/Canvas";
import { ControllerRole } from "../constant";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import { ASPECT_RATIO } from "../components/canvas/constants";
import useContainRatio from "../hooks/useContainRatio";
import ChipRow from "../components/ChipRow";
import { EmptyAchievement } from "../components/achievement/achievement";

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
  const listContainerRef = useRef<HTMLUListElement>(
    document.createElement("ul")
  );
  const [, listOffsetHeight] = useContainRatio({
    containerRef: listContainerRef,
    ratio: 1 / ASPECT_RATIO,
  });
  const playAudio = useCallback(() => {
    if (audioPaths.length === 0) {
      return;
    }

    const player = document.createElement("audio");
    player.src =
      restAPI.gallery.getAssetByPath(audioPaths[audioPaths.length - 1]).url ||
      "";
    player.play();
  }, [audioPaths]);
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
      <div
        className="flex flex-col absolute w-full"
        style={{
          height: "calc(100vh - 84px)",
        }}
      >
        <Grid container className="mb-4">
          <Grid item xs={2} />

          <Grid item xs={10}>
            <ChipRow
              primary
              chips={[
                <Chip label={story?.data?.title} color="primary" />,
                <div className="flex gap-4">
                  {(story?.data?.description.split(",") || []).map((tag) => (
                    <Chip label={tag} color="secondary" />
                  ))}
                </div>,
              ]}
            />
          </Grid>
        </Grid>
        <Grid container className="flex-1 mb-4">
          <Grid
            item
            xs={2}
            style={{
              backgroundColor: "white",
              alignSelf: "center",
              display: "flex",
              flexDirection: "column",
              borderRadius: "30px",
              height: canvasOffsetHeight || "100%",
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
              ref={listContainerRef}
              className="overflow-y-auto"
              style={{ alignSelf: "center" }}
              cols={1}
              gap={0}
              classes={{ root: "flex-grow" }}
              rowHeight={listOffsetHeight}
            >
              {Array.from(
                { length: story?.data?.pages || 0 },
                (_, i) => i + 1
              ).map((pageIndex) => (
                <ImageListItem
                  key={pageIndex}
                  classes={{ item: "flex flex-col justify-center" }}
                >
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
                  offsetHeight={canvasOffsetHeight}
                />
              </div>

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
        <Grid container className="mb-4">
          <Grid item xs={2} />
          <Grid item xs={10}>
            <ChipRow
              chips={[
                `Page ${page} of ${story?.data?.pages || ""}`,
                <AchievementButton
                  achievements={manifest?.achievements || EmptyAchievement}
                  notify={false}
                />,
                {
                  icon: <Icon fontSize="medium">music_note</Icon>,
                  label: "Play Audio",
                  onClick: playAudio,
                  disabled: audioPaths.length === 0,
                } as ChipProps,
              ]}
            />
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
}
