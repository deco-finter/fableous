import {
  Grid,
  ImageList,
  ImageListItem,
  Chip,
  Icon,
  ChipProps,
  Button,
} from "@material-ui/core";

import useAxios from "axios-hooks";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  createRef,
  RefObject,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import Joyride, { Step } from "react-joyride";
import { restAPI } from "../api";
import AchievementButton from "../components/achievement/AchievementButton";
import { EmptyAchievement } from "../components/achievement/achievement";
import Canvas from "../components/canvas/Canvas";
import { ImperativeCanvasRef, TextShapeMap } from "../components/canvas/data";
import { ASPECT_RATIO } from "../components/canvas/constants";
import ChipRow from "../components/ChipRow";
import BackButton from "../components/BackButton";
import { colors } from "../colors";
import { APIResponse, Manifest, Session } from "../data";
import useContainRatio from "../hooks/useContainRatio";
import { proto as pb } from "../proto/message_pb";
import { TutorialTargetId } from "../tutorialTargetIds";
import useTutorial from "../hooks/useTutorial";

const GALLERY_TUTORIAL_KEY = "galleryTutorial";
export default function StoryDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [textShapes, setTextShapes] = useState<TextShapeMap>({});
  const [audioPaths, setAudioPaths] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [isTutorialRunning, handleJoyrideCallback] = useTutorial({
    showTutorialButton: useMemo(() => true, []),
    localStorageKey: GALLERY_TUTORIAL_KEY,
    onManualStartCallback: useCallback(() => {}, []),
  });
  const canvasRef = useRef<ImperativeCanvasRef>({
    getCanvas: () => document.createElement("canvas"),
    runUndo: () => {},
    runAudio: () => {},
  });
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
  const imageItemRefs = useRef<RefObject<HTMLImageElement>[]>([]);
  const [{ data: story, loading: getStoryLoading }, executeGetClassroomDetail] =
    useAxios<APIResponse<Session>, APIResponse<undefined>>(
      restAPI.session.getOne(classroomId, sessionId),
      { manual: true }
    );
  const [{ data: manifest, loading: getManifestLoading }, executeGetManifest] =
    useAxios<Manifest, undefined>(
      restAPI.gallery.getAsset(classroomId, sessionId, page, "manifest.json"),
      {
        manual: true,
      }
    );
  const [{ data: achievements }, executeGetAchievements] = useAxios<
    Manifest,
    undefined
  >(
    restAPI.gallery.getAsset(
      classroomId,
      sessionId,
      story?.data?.pages,
      "manifest.json"
    ),
    {
      manual: true,
    }
  );

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

  const commonTutorialSteps: Step[] = useMemo(
    () => [
      {
        target: `#${TutorialTargetId.NavbarTutorial}`,
        content:
          "Do you want to go through the tutorial? You can access it anytime by clicking the help icon.",
        placement: "bottom",
        disableBeacon: true,
        // wierdly, close behavior is like next step, unsure on how to fix it
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.Image}`,
        content: "You will see the result of tbe combined drawing here.",
        placement: "center",
        disableBeacon: true,
        // wierdly, close behavior is like next step, unsure on how to fix it
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.ImageButton}`,
        content:
          "You will see the list of the pages here, click on one to show larger version.",
        placement: "right",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.AchievementButton}`,
        content: "You can see this story achievement here.",
        placement: "top",
        disableBeacon: true,
        hideCloseButton: true,
      },
      {
        target: `#${TutorialTargetId.AudioTool}`,
        content: "You can access this story audio here.",
        placement: "top",
        disableBeacon: true,
        hideCloseButton: true,
      },
    ],
    []
  );
  const tutorialSteps = commonTutorialSteps;

  useEffect(() => {
    executeGetClassroomDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!story) return;
    executeGetAchievements();
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < (story?.data?.pages || 0); i++) {
      imageItemRefs.current.push(createRef<HTMLImageElement>());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story]);

  useEffect(() => {
    executeGetManifest();
    if (page - 1 < imageItemRefs.current.length) {
      imageItemRefs.current[page - 1].current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (manifest) setTextShapes(manifest.texts);
    if (manifest) setAudioPaths(manifest.audios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  return (
    <Grid container className="relative">
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={isTutorialRunning}
        scrollToFirstStep
        showProgress
        showSkipButton
        disableOverlayClose
        disableScrollParentFix
        disableScrolling
        steps={tutorialSteps}
        floaterProps={{
          disableAnimation: true,
        }}
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      />
      <div
        className="flex flex-col absolute w-full"
        style={{
          height: "calc(100vh - 84px)",
        }}
      >
        <Grid container className="mb-4">
          <Grid item xs="auto">
            <BackButton />
          </Grid>
          <Grid item xs>
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
        <Grid container spacing={2} className="flex-1 mb-4">
          <Grid
            item
            xs={2}
            style={{
              backgroundColor: "white",
              alignSelf: "center",
              display: "flex",
              flexDirection: "column",
              borderRadius: "24px",
              height: canvasOffsetHeight || "100%",
            }}
          >
            <ImageList
              id={TutorialTargetId.ImageButton}
              ref={listContainerRef}
              className="overflow-y-auto gap-y-2 flex content-between"
              style={{ alignSelf: "center", borderRadius: 16 }}
              cols={1}
              gap={0}
              classes={{ root: "flex-grow" }}
              rowHeight={listOffsetHeight}
            >
              {Array.from(
                { length: story?.data?.pages || 0 },
                (_, i) => i + 1
              ).map((pageIndex) => {
                return (
                  <ImageListItem key={pageIndex}>
                    <Button
                      onClick={() => setPage(pageIndex)}
                      className="p-0 m-0"
                    >
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          borderRadius: 16,
                          boxShadow: `inset 0 0 0 ${
                            page === pageIndex ? 4 : 2
                          }px ${
                            page === pageIndex
                              ? colors.orange.main
                              : colors.gray.light
                          }`,
                        }}
                      />
                      <img
                        ref={imageItemRefs.current[pageIndex - 1]}
                        src={
                          restAPI.gallery.getAsset(
                            classroomId,
                            sessionId,
                            pageIndex,
                            "image.png"
                          ).url
                        }
                        alt={story?.data?.title}
                        style={{
                          borderRadius: 16,
                        }}
                        loading="lazy"
                      />
                    </Button>
                  </ImageListItem>
                );
              })}
            </ImageList>
          </Grid>
          <Grid item xs={10}>
            <div
              className="grid place-items-stretch h-full"
              style={{
                border: "1px solid #0000",
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
                  rootId={TutorialTargetId.Image}
                  ref={canvasRef}
                  wsConn={undefined}
                  role={pb.ControllerRole.HUB}
                  layer={pb.ControllerRole.STORY}
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
                    borderRadius: "24px",
                  }}
                />
              </div>
            </div>
          </Grid>
        </Grid>
        <Grid container className="mb-4">
          <Grid item xs={12}>
            <ChipRow
              chips={[
                `Page ${page} of ${story?.data?.pages || ""}`,
                <AchievementButton
                  rootId={TutorialTargetId.AchievementButton}
                  achievements={achievements?.achievements || EmptyAchievement}
                  notify={false}
                />,
                {
                  id: TutorialTargetId.AudioTool,
                  icon: <Icon fontSize="medium">music_note</Icon>,
                  label: "Play Audio",
                  onClick: playAudio,
                  disabled: audioPaths.length === 0,
                } as ChipProps,
                {
                  icon: <Icon fontSize="medium">skip_previous</Icon>,
                  label: "Previous Page",
                  onClick: () => page > 1 && setPage(page - 1),
                  disabled: page === 1,
                } as ChipProps,
                {
                  icon: <Icon fontSize="medium">skip_next</Icon>,
                  label: "Next Page",
                  onClick: () =>
                    page < (story?.data?.pages || 1) && setPage(page + 1),
                  disabled: page === story?.data?.pages,
                } as ChipProps,
              ]}
            />
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
}
