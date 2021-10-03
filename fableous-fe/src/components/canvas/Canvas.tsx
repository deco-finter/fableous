/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
} from "react";
import cloneDeep from "lodash.clonedeep";
import { WSMessage } from "../../data";

import {
  convHEXtoRGBA,
  getTextBounds,
  scaleDownXY,
  scaleUpXY,
  translateXY,
} from "./helpers";
import { SCALE, SELECT_PADDING } from "./constants";
import { Cursor } from "./CursorScreen";
import { ImperativeCanvasRef, TextShape, TextShapeMap } from "./data";
import { ToolMode } from "../../constant";
import { restAPI } from "../../api";
import { proto as pb } from "../../proto/message_pb";

interface Checkpoint {
  tool: ToolMode;
  data: ImageData | TextShapeMap;
  timestamp: number;
}

interface CanvasProps {
  wsConn: WebSocket | undefined;
  role: pb.ControllerRole;
  layer: pb.ControllerRole;
  pageNum: number;
  isGallery?: boolean;
  isShown?: boolean;
  offsetWidth: number;
  offsetHeight: number;
  onDraw?: () => void;
  setCursor?: React.Dispatch<Cursor | undefined>;
  textShapes: TextShapeMap;
  setTextShapes: React.Dispatch<React.SetStateAction<TextShapeMap>>;
  // eslint-disable-next-line react/no-unused-prop-types
  audioPaths: string[];
  setAudioPaths: React.Dispatch<React.SetStateAction<string[]>>;
  // toolbar states
  toolMode?: ToolMode;
  setToolMode?: React.Dispatch<React.SetStateAction<ToolMode>>;
  toolColor?: string;
  toolWidth?: number;
}

const defaultProps = {
  isGallery: false,
  isShown: true,
  onDraw: () => {},
  setCursor: undefined,
  toolColor: "#000000ff",
  toolMode: ToolMode.None,
  setToolMode: () => {},
  toolWidth: 8 * SCALE,
};

interface SimplePointerEventData {
  clientX: number;
  clientY: number;
  pointerType: "mouse" | "pen" | "touch";
  onLeave: boolean;
}

// TODO after width of canvas DOM element is dynamic, attempt to make canvas drawing scaling dynamic
// that is, resizing screen allows drawing without issue (no translation error)
const Canvas = forwardRef<ImperativeCanvasRef, CanvasProps>(
  (props: CanvasProps, ref) => {
    let FRAME_COUNTER = 0;
    const {
      layer,
      role,
      pageNum,
      isGallery,
      isShown,
      offsetWidth,
      offsetHeight,
      onDraw = defaultProps.onDraw,
      setCursor,
      setTextShapes,
      textShapes,
      setAudioPaths,
      // make variables not optional
      toolMode = defaultProps.toolMode,
      setToolMode = defaultProps.setToolMode,
      toolColor = defaultProps.toolColor,
      toolWidth = defaultProps.toolWidth,
      wsConn,
    } = props;
    // useImperativeHandle of type ImperativeCanvasRef defined at bottom
    const canvasRef = useRef<HTMLCanvasElement>(
      document.createElement("canvas")
    );
    const onScreenKeyboardRef = useRef<HTMLInputElement>(
      document.createElement("input")
    );
    const [allowDrawing, setAllowDrawing] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [hasLifted, setHasLifted] = useState(false);
    const [lastPos, setLastPos] = useState([0, 0]);
    const [dragOffset, setDragOffset] = useState([0, 0]); // offset is in normalized scale
    const [audioMediaRecorder, setAudioMediaRecorder] =
      useState<MediaRecorder>();
    const [audioRecording, setAudioRecording] = useState(false);
    const textShapesRef = useRef<TextShapeMap>(textShapes);
    textShapesRef.current = textShapes; // inject ref to force sync, see: https://stackoverflow.com/questions/57847594/react-hooks-accessing-up-to-date-state-from-within-a-callback
    const [textId, setTextId] = useState(1);
    const [editingTextId, setEditingTextId] = useState(0);
    const editingTextIdRef = useRef(editingTextId);
    editingTextIdRef.current = editingTextId;
    const [, setCheckpointHistory] = useState<Checkpoint[]>([]);

    const showKeyboard = (show: boolean) => {
      if (show) {
        onScreenKeyboardRef.current.focus();
      } else {
        onScreenKeyboardRef.current.blur();
      }
    };

    const placePaint = useCallback(
      (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        targetColor: string,
        targetWidth: number
      ) => {
        const ctx = canvasRef.current.getContext(
          "2d"
        ) as CanvasRenderingContext2D;
        const isCoordEq = x1 === x2 && y1 === y2;
        // lay down path
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(isCoordEq ? x1 + 0.1 : x2, isCoordEq ? y1 + 0.1 : y2);
        ctx.closePath();
        // clear overlapped pixels
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "white";
        ctx.lineWidth = targetWidth - 3; // compensate aliased edges
        ctx.stroke();
        // draw new pixels
        ctx.globalCompositeOperation = "source-over";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = targetColor;
        ctx.lineWidth = targetWidth;
        ctx.moveTo(x1, y1);
        ctx.lineTo(isCoordEq ? x1 + 0.1 : x2, isCoordEq ? y1 + 0.1 : y2);
        ctx.closePath();
        ctx.stroke();
        if (role !== pb.ControllerRole.HUB) {
          const [normX1, normY1] = scaleDownXY(canvasRef, x1, y1);
          const [normX2, normY2] = scaleDownXY(canvasRef, x2, y2);
          const [normWidth] = scaleDownXY(canvasRef, targetWidth, 0);
          wsConn?.send(
            pb.WSMessage.encode({
              role,
              type: pb.WSMessageType.PAINT,
              paint: {
                x1: normX1,
                y1: normY1,
                x2: normX2,
                y2: normY2,
                color: targetColor,
                width: normWidth,
              },
            }).finish()
          );
        }
      },
      [canvasRef, role, wsConn]
    );

    const placeFill = useCallback(
      (startX: number, startY: number, targetColor: string) => {
        const ctx = canvasRef.current.getContext(
          "2d"
        ) as CanvasRenderingContext2D;
        startX = Math.floor(startX);
        startY = Math.floor(startY);
        const { width, height } = canvasRef.current;
        const image = ctx.getImageData(0, 0, width, height);
        const startPixel = (startY * width + startX) * 4;
        const startColor = [
          image.data[startPixel],
          image.data[startPixel + 1],
          image.data[startPixel + 2],
          image.data[startPixel + 3],
        ];
        const setPixel = (pixel: number, rgb: number[]) => {
          [
            image.data[pixel],
            image.data[pixel + 1],
            image.data[pixel + 2],
            image.data[pixel + 3],
          ] = rgb;
        };
        const checkPixel = (pixel: number, rgb: number[]) => {
          return (
            image.data[pixel] === rgb[0] &&
            image.data[pixel + 1] === rgb[1] &&
            image.data[pixel + 2] === rgb[2] &&
            image.data[pixel + 3] === rgb[3]
          );
        };
        const colorRGB = convHEXtoRGBA(targetColor);
        const stack = [[startX, startY]];
        if (checkPixel(startPixel, colorRGB)) return;
        while (stack.length) {
          // eslint-disable-next-line prefer-const
          let [x, y] = stack.pop() || [startX, startY];
          let pixel = (y * width + x) * 4;
          while (y > 0 && checkPixel(pixel, startColor)) {
            y--;
            pixel -= width * 4;
          }
          y++;
          pixel += width * 4;
          let expandLeft = false;
          let expandRight = false;
          while (y < height - 1 && checkPixel(pixel, startColor)) {
            setPixel(pixel, colorRGB);
            if (x > 0) {
              if (checkPixel(pixel - 4, startColor) && !expandLeft) {
                stack.push([x - 1, y]);
                expandLeft = true;
              } else {
                expandLeft = false;
              }
            }
            if (x < width) {
              if (checkPixel(pixel + 4, startColor) && !expandRight) {
                stack.push([x + 1, y]);
                expandRight = true;
              } else {
                expandRight = false;
              }
            }
            y++;
            pixel += width * 4;
          }
        }
        ctx.putImageData(image, 0, 0);
        if (role !== pb.ControllerRole.HUB) {
          const [normX, normY] = scaleDownXY(canvasRef, startX, startY);
          wsConn?.send(
            pb.WSMessage.encode({
              role,
              type: pb.WSMessageType.FILL,
              paint: { x1: normX, y1: normY, color: targetColor },
            }).finish()
          );
        }
      },
      [canvasRef, role, wsConn]
    );

    const placeText = useCallback(
      (id, textShape) => {
        setTextShapes(() => ({
          ...textShapesRef.current,
          [id]: textShape,
        }));
        if (role !== pb.ControllerRole.HUB) {
          wsConn?.send(
            pb.WSMessage.encode({
              role,
              type: pb.WSMessageType.TEXT,
              paint: {
                id,
                x1: textShape.normX,
                y1: textShape.normY,
                text: textShape.text,
                width: textShape.normFontSize,
              },
            }).finish()
          );
        }
      },
      [role, wsConn, setTextShapes]
    );

    const refreshText = () => {
      window.requestAnimationFrame(refreshText);
      FRAME_COUNTER = (FRAME_COUNTER + 1) % 60;
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const { width, height } = canvasRef.current;
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      Object.entries(textShapesRef.current).forEach(([id, shape]) => {
        const [x, y] = scaleUpXY(canvasRef, shape.normX, shape.normY);
        const [fontSize] = scaleUpXY(canvasRef, shape.normFontSize, 0);
        const [x1, y1, x2, y2] = getTextBounds(
          canvasRef,
          x,
          y,
          shape.text,
          fontSize
        );
        ctx.fillStyle = isGallery ? "#00000000" : "#000000";
        ctx.font = `${fontSize * SCALE}px Comic Sans MS`;
        ctx.fillText(shape.text, x, y);
        if (parseInt(id, 10) === editingTextIdRef.current) {
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#00dd88";
          ctx.rect(
            x1 - SELECT_PADDING,
            y1 - SELECT_PADDING,
            x2 -
              x1 +
              2 * SELECT_PADDING +
              (role !== pb.ControllerRole.HUB ? 6 : 0),
            y2 - y1 + 2 * SELECT_PADDING
          );
          ctx.stroke();
          ctx.closePath();
          if (role !== pb.ControllerRole.HUB && FRAME_COUNTER > 30) {
            ctx.beginPath();
            ctx.rect(x2 + 2, y1 - 2, 2, y2 - y1 + 2);
            ctx.fill();
            ctx.closePath();
          }
        } else if (role !== pb.ControllerRole.HUB) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#00aaaa";
          ctx.rect(
            x1 - SELECT_PADDING,
            y1 - SELECT_PADDING,
            x2 - x1 + 2 * SELECT_PADDING,
            y2 - y1 + 2 * SELECT_PADDING
          );
          ctx.stroke();
          ctx.closePath();
        }
      });
    };

    const interactCanvas = (
      cursorX: number,
      cursorY: number,
      isEditingText: boolean,
      hover: boolean
    ) => {
      let targetId: number | undefined;
      let targetShape: TextShape | undefined;
      Object.entries(textShapesRef.current).forEach(([id, shape]) => {
        const [x, y] = scaleUpXY(canvasRef, shape.normX, shape.normY);
        const [fontSize] = scaleUpXY(canvasRef, shape.normFontSize, 0);
        const [x1, y1, x2, y2] = getTextBounds(
          canvasRef,
          x,
          y,
          shape.text,
          fontSize
        );
        if (
          !targetShape &&
          cursorX >= x1 - SELECT_PADDING &&
          cursorX <= x2 + SELECT_PADDING &&
          cursorY >= y1 - SELECT_PADDING &&
          cursorY <= y2 + SELECT_PADDING
        ) {
          targetId = parseInt(id, 10);
          targetShape = shape;
        }
      });
      if (hover) {
        if (targetId) {
          canvasRef.current.style.cursor = "pointer";
          setEditingTextId(targetId);
        } else {
          canvasRef.current.style.cursor = "default";
          setEditingTextId(0);
        }
      } else if (isEditingText) {
        const [normCursorX, normCursorY] = scaleDownXY(
          canvasRef,
          cursorX,
          cursorY
        );
        if (targetId && targetShape) {
          // edit clicked text
          setEditingTextId(targetId);
          setDragOffset([
            targetShape.normX - normCursorX,
            targetShape.normY - normCursorY,
          ]);
        } else if (editingTextId) {
          // deselect currently editing text
          setEditingTextId(0);
          showKeyboard(false);
        } else {
          // insert new text
          const [normFontSize] = scaleDownXY(canvasRef, 18, 0);
          placeText(textId, {
            normX: normCursorX,
            normY: normCursorY,
            normFontSize,
            text: "",
          } as TextShape);
          setEditingTextId(textId);
          setTextId(textId + 1);
          setHasLifted(true); // disable dragging for new texts
        }
      } else if (targetShape) {
        window.speechSynthesis.speak(
          new SpeechSynthesisUtterance(targetShape.text)
        );
      }
    };

    const placeAudio = useCallback(
      (path: string) => {
        const player = document.createElement("audio");
        player.src = restAPI.gallery.getAssetByPath(path).url || "";
        player.play();
        setAudioPaths((prev) => [...prev, path]);
      },
      [setAudioPaths]
    );

    const initAudio = () => {
      navigator.mediaDevices?.getUserMedia({ audio: true }).then(
        (stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = ({ data }) => {
            const reader = new FileReader();
            reader.readAsDataURL(
              new Blob([data], { type: "audio/ogg;codecs=opus" })
            );
            reader.onloadend = () => {
              wsConn?.send(
                pb.WSMessage.encode({
                  role,
                  type: pb.WSMessageType.AUDIO,
                  paint: {
                    text: reader.result as string,
                  },
                }).finish()
              );
            };
          };
          setAudioMediaRecorder(mediaRecorder);
        },
        (e) => console.error(e)
      );
    };

    const recordAudio = useCallback(() => {
      if (!audioMediaRecorder) return;
      if (!audioRecording) {
        setAudioRecording(true);
        audioMediaRecorder.start();
      } else {
        setAudioRecording(false);
        audioMediaRecorder.stop();
      }
    }, [audioMediaRecorder, audioRecording]);

    const placeCheckpoint = useCallback(
      (tool: ToolMode) => {
        if (tool === ToolMode.Paint || tool === ToolMode.Fill) {
          const ctx = canvasRef.current.getContext(
            "2d"
          ) as CanvasRenderingContext2D;
          setCheckpointHistory((prev) => {
            const checkpoint = {
              tool,
              data: ctx.getImageData(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              ),
              timestamp: Date.now(),
            } as Checkpoint;

            return [...prev, checkpoint];
          });
        } else if (tool === ToolMode.Text) {
          const filtered = Object.fromEntries(
            Object.entries(textShapesRef.current).filter(
              ([, shape]) => shape.text.length > 0
            )
          );
          setTextShapes(filtered);
          setCheckpointHistory((prev) => {
            const checkpoint = {
              tool,
              data: filtered,
              timestamp: Date.now(),
            } as Checkpoint;

            // deep copy needed, else editting text
            // change past textshapes change somehow
            return [...prev, cloneDeep(checkpoint)];
          });
        }
        if (role !== pb.ControllerRole.HUB) {
          wsConn?.send(
            pb.WSMessage.encode({
              role,
              type: pb.WSMessageType.CHECKPOINT,
              paint: {
                text: tool,
              },
            }).finish()
          );
        }
      },
      [canvasRef, role, setTextShapes, wsConn]
    );

    const placeUndo = useCallback(() => {
      setCheckpointHistory((prev) => {
        const newCheckpoint = prev.length >= 2 ? prev[prev.length - 2] : null;
        const ctx = canvasRef.current.getContext(
          "2d"
        ) as CanvasRenderingContext2D;
        if (!newCheckpoint) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          setTextShapes({});
        } else if (
          newCheckpoint.tool === ToolMode.Paint ||
          newCheckpoint.tool === ToolMode.Fill
        ) {
          ctx.putImageData(newCheckpoint.data as ImageData, 0, 0);
        } else if (newCheckpoint.tool === ToolMode.Text) {
          setTextShapes(newCheckpoint.data as TextShapeMap);
        }
        return prev.slice(0, -1);
      });
      if (role !== pb.ControllerRole.HUB) {
        wsConn?.send(
          pb.WSMessage.encode({
            role,
            type: pb.WSMessageType.UNDO,
          }).finish()
        );
      }
    }, [canvasRef, role, setTextShapes, wsConn]);

    const placeCursor = useCallback(
      (
        normX: number,
        normY: number,
        normWidth: number,
        targetMode: ToolMode
      ) => {
        if (setCursor)
          setCursor({
            normX,
            normY,
            normWidth,
            toolMode: targetMode,
          } as Cursor);
        if (role !== pb.ControllerRole.HUB) {
          wsConn?.send(
            pb.WSMessage.encode({
              role,
              type: pb.WSMessageType.CURSOR,
              paint: {
                x1: normX,
                y1: normY,
                width: normWidth,
                text: targetMode,
              },
            }).finish()
          );
        }
      },
      [setCursor, role, wsConn]
    );

    const readMessage = useCallback(
      (ev: MessageEvent) => {
        try {
          const msg: WSMessage = JSON.parse(ev.data);
          if (msg.role === layer || msg.type === pb.WSMessageType.CONTROL) {
            const [x1, y1] = scaleUpXY(
              canvasRef,
              msg.data.x1 || 0,
              msg.data.y1 || 0
            );
            const [x2, y2] = scaleUpXY(
              canvasRef,
              msg.data.x2 || 0,
              msg.data.y2 || 0
            );
            const [width] = scaleUpXY(canvasRef, msg.data.width || 0, 0);
            switch (msg.type) {
              case pb.WSMessageType.PAINT:
                placePaint(
                  x1,
                  y1,
                  x2,
                  y2,
                  msg.data.color || "#000000ff",
                  width || 8
                );
                break;
              case pb.WSMessageType.FILL:
                placeFill(x1, y1, msg.data.color || "#000000ff");
                break;
              case pb.WSMessageType.TEXT:
                placeText(msg.data.id || 1, {
                  normX: msg.data.x1 || 0, // use normalized coords
                  normY: msg.data.y1 || 0,
                  normFontSize: msg.data.width || 0,
                  text: msg.data.text || "",
                } as TextShape);
                break;
              case pb.WSMessageType.AUDIO:
                placeAudio(msg.data.text || "");
                break;
              case pb.WSMessageType.CHECKPOINT:
                placeCheckpoint(msg.data.text as ToolMode);
                break;
              case pb.WSMessageType.UNDO:
                placeUndo();
                break;
              case pb.WSMessageType.CURSOR:
                placeCursor(
                  msg.data.x1 || 0, // no need to denormalize
                  msg.data.y1 || 0,
                  msg.data.width || 0,
                  msg.data.text as ToolMode.Paint
                );
                break;
              default:
            }
          }
        } catch (e) {
          console.error(e);
        }
      },
      [
        layer,
        canvasRef,
        placePaint,
        placeFill,
        placeText,
        placeCheckpoint,
        placeUndo,
        placeCursor,
        placeAudio,
      ]
    );

    const onPointerDown = (event: SimplePointerEventData) => {
      const [x, y] = translateXY(canvasRef, event.clientX, event.clientY);
      const [normX, normY] = scaleDownXY(canvasRef, x, y);
      const [normWidth] = scaleDownXY(canvasRef, toolWidth, 0);
      placeCursor(normX, normY, normWidth, toolMode);
      onDraw();
      switch (toolMode) {
        case ToolMode.Paint:
          setDragging(true);
          placePaint(x, y, x, y, toolColor, toolWidth);
          setLastPos([x, y]);
          break;
        case ToolMode.Fill:
          placeFill(x, y, toolColor);
          break;
        case ToolMode.Text:
          setHasLifted(false);
          interactCanvas(x, y, true, false);
          break;
        case ToolMode.None:
          interactCanvas(x, y, false, false);
          break;
        default:
      }
    };

    const onPointerMove = (event: SimplePointerEventData) => {
      const [lastX, lastY] = lastPos;
      const [x, y] = translateXY(canvasRef, event.clientX, event.clientY);
      const [normX, normY] = scaleDownXY(canvasRef, x, y);
      const [normWidth] = scaleDownXY(canvasRef, toolWidth, 0);
      if (allowDrawing) placeCursor(normX, normY, normWidth, toolMode);
      switch (toolMode) {
        case ToolMode.Paint:
          if (!dragging || !allowDrawing) return;
          if (
            Math.round(lastX) === Math.round(x) &&
            Math.round(lastY) === Math.round(y)
          )
            return;
          placePaint(lastX, lastY, x, y, toolColor, toolWidth);
          break;
        case ToolMode.Text:
          if (!editingTextId || hasLifted || !allowDrawing) return;
          const shape = textShapesRef.current[editingTextId];
          setDragging(true);
          showKeyboard(false);
          placeText(editingTextId, {
            ...shape,
            normX: normX + dragOffset[0],
            normY: normY + dragOffset[1],
          } as TextShape);
          break;
        case ToolMode.None:
          interactCanvas(x, y, false, true);
          break;
        default:
      }
      if (allowDrawing) setLastPos([x, y]);
    };

    const onPointerUp = (event: SimplePointerEventData) => {
      if (!allowDrawing) return;
      const [lastX, lastY] = lastPos;
      const [x, y] = translateXY(canvasRef, event.clientX, event.clientY);
      switch (toolMode) {
        case ToolMode.Paint:
          if (dragging) {
            placePaint(lastX, lastY, x, y, toolColor, toolWidth);
            const [normX, normY] = scaleDownXY(canvasRef, x, y);
            const [normWidth] = scaleDownXY(canvasRef, toolWidth, 0);
            placeCursor(normX, normY, normWidth, toolMode);
            placeCheckpoint(toolMode);
          }
          break;
        case ToolMode.Fill:
          if (!event.onLeave) placeCheckpoint(toolMode);
          break;
        default:
      }
      if (dragging) {
        setEditingTextId(0);
      }
      setDragging(false);
      setHasLifted(true);
    };

    const onPointerOut = (event: SimplePointerEventData) => {
      event.onLeave = true;
      onPointerUp(event);
      if (setCursor) {
        setCursor(undefined);
      }
    };

    const wrapPointerHandler =
      (handler: ((event: SimplePointerEventData) => void) | undefined) =>
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.isPrimary && handler) {
          handler({
            clientX: event.clientX,
            clientY: event.clientY,
            pointerType: event.pointerType,
            onLeave: false,
          });
        }
      };

    const onKeyDown = useCallback(
      (text: string) => {
        if (!allowDrawing) return;
        const shape = textShapesRef.current[editingTextId];
        if (!shape) return;
        placeText(editingTextId, { ...shape, text } as TextShape);
      },
      [allowDrawing, editingTextId, placeText]
    );

    const adjustCanvasSize = useCallback(() => {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * SCALE;
      canvas.height = canvas.offsetHeight * SCALE;
    }, [canvasRef]);

    // exposes callbacks to parent, to be used by toolbar
    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        runUndo: () => {
          placeUndo();
          onDraw();
        },
        runAudio: () => {
          recordAudio();
          onDraw();
        },
      }),
      [canvasRef, onDraw, placeUndo, recordAudio]
    );

    // setup on component mount
    useEffect(() => {
      adjustCanvasSize();
      setAllowDrawing(role !== pb.ControllerRole.HUB);
      switch (role) {
        case pb.ControllerRole.STORY:
          initAudio();
          setToolMode(ToolMode.Text);
          break;
        case pb.ControllerRole.CHARACTER:
          setToolMode(ToolMode.Paint);
          break;
        case pb.ControllerRole.BACKGROUND:
          setToolMode(ToolMode.Paint);
          break;
        default:
          setToolMode(ToolMode.None);
      }
      wsConn?.addEventListener("message", readMessage);
      return () => {
        wsConn?.removeEventListener("message", readMessage);
      };
      // only trigger on new websocket connection
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, wsConn, adjustCanvasSize]);

    // cleanup before moving to next page
    useEffect(() => {
      const ctx = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const { width, height } = canvasRef.current;
      ctx.clearRect(0, 0, width, height);
      setAudioPaths([]);
      setTextShapes({});
      setTextId(1);
      setEditingTextId(0);
      setCheckpointHistory([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNum]);

    // workaround to recalculate width when canvas appears or becomes hidden
    useEffect(() => {
      adjustCanvasSize();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustCanvasSize, isShown]);

    // initialize text event listener
    useEffect(() => {
      if (isShown && role !== pb.ControllerRole.HUB) {
        const textEventHandler = (event: KeyboardEvent) => {
          if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
            placeUndo();
          }
          if (event.key === "Escape" || event.key === "Enter") {
            setEditingTextId(0);
            showKeyboard(false);
          }
        };
        document.addEventListener("keydown", textEventHandler);
        return () => {
          document.removeEventListener("keydown", textEventHandler);
        };
      }
      return () => {};
    }, [isShown, layer, placeUndo, role]);

    // start text layer animation
    useEffect(() => {
      if (isShown && layer === pb.ControllerRole.STORY) {
        const anim = window.requestAnimationFrame(refreshText);
        return () => {
          window.cancelAnimationFrame(anim);
        };
      }
      return () => {};
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isShown, layer]);

    // unselect text on tool change
    useEffect(() => {
      setEditingTextId(0);
    }, [toolMode]);

    // place checkpoint on finish text editing
    useEffect(() => {
      if (editingTextId === 0 && textId > 1) {
        placeCheckpoint(ToolMode.Text);
      }
    }, [editingTextId, textId, placeCheckpoint]);

    return (
      <div
        className="relative place-self-center"
        style={{
          width: offsetWidth,
          // -1 so height can shrink
          height: offsetHeight - 1,
          maxHeight: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={wrapPointerHandler(onPointerDown)}
          onPointerMove={wrapPointerHandler(onPointerMove)}
          onPointerUp={wrapPointerHandler(onPointerUp)}
          onPointerCancel={wrapPointerHandler(onPointerUp)}
          onPointerEnter={wrapPointerHandler(undefined)}
          onPointerLeave={wrapPointerHandler(undefined)}
          onPointerOut={wrapPointerHandler(onPointerOut)}
          onPointerOver={wrapPointerHandler(undefined)}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            if (editingTextId && role !== pb.ControllerRole.HUB)
              showKeyboard(true);
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "24px",
            // allows onPointerMove to be fired continuously on touch,
            // else will be treated as pan gesture leading to short strokes
            touchAction: "none",
            msTouchAction: "none",
            msTouchSelect: "none",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            userSelect: "none",
            cursor:
              role === pb.ControllerRole.HUB || toolMode === ToolMode.Audio
                ? "auto"
                : "none",
          }}
        />
        <input
          ref={onScreenKeyboardRef}
          value={textShapesRef.current[editingTextId]?.text || ""}
          onChange={(e) => {
            onKeyDown(e.target.value);
          }}
          tabIndex={0}
          style={{
            position: "absolute",
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
);

Canvas.defaultProps = defaultProps;

export default Canvas;
