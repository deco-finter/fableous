/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
import React, {
  MutableRefObject,
  forwardRef,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import Button from "@material-ui/core/Button";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Slider from "@material-ui/core/Slider";
import { ControllerRole, ToolMode, WSMessage, WSMessageType } from "../../Data";
import {
  convHEXtoRGBA,
  getTextBounds,
  scaleDownXY,
  scaleUpXY,
  translateXY,
} from "./helpers";
import { ASPECT_RATIO, SCALE, SELECT_PADDING } from "./constants";
import { Cursor } from "./CursorScreen";

interface Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface TextShape extends Shape {
  text: string;
  fontSize: number;
}

type TextShapeMap = { [id: string]: TextShape };

interface Checkpoint {
  tool: ToolMode;
  data: ImageData | TextShapeMap;
  timestamp: number;
}

interface CanvasProps {
  wsConn: WebSocket | undefined;
  role: ControllerRole;
  layer: ControllerRole;
  pageNum: number;
  isShown?: boolean;
  setCursor: React.Dispatch<Cursor | undefined>;
}

interface SimplePointerEventData {
  clientX: number;
  clientY: number;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  (props: CanvasProps, ref) => {
    let FRAME_COUNTER = 0;
    const { layer, role, pageNum, isShown, setCursor, wsConn } = props;
    const canvasRef = ref as MutableRefObject<HTMLCanvasElement>;
    const [allowDrawing, setAllowDrawing] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [hasLifted, setHasLifted] = useState(false);
    const [lastPos, setLastPos] = useState([0, 0]);
    const [audioB64Strings, setAudioB64Strings] = useState<string[]>([]);
    const [audioMediaRecorder, setAudioMediaRecorder] =
      useState<MediaRecorder>();
    const [audioRecording, setAudioRecording] = useState(false);
    const [textShapes, setTextShapes] = useState<TextShapeMap>({});
    const textShapesRef = useRef<TextShapeMap>(textShapes);
    textShapesRef.current = textShapes; // inject ref to force sync, see: https://stackoverflow.com/questions/57847594/react-hooks-accessing-up-to-date-state-from-within-a-callback
    const [textId, setTextId] = useState(1);
    const [editingTextId, setEditingTextId] = useState(0);
    const editingTextIdRef = useRef(editingTextId);
    editingTextIdRef.current = editingTextId;
    const [toolColor, setToolColor] = useState("#000000ff");
    const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.None);
    const [toolWidth, setToolWidth] = useState(8 * SCALE);
    const [, setCheckpointHistory] = useState<Checkpoint[]>([]);

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
        if (role !== ControllerRole.Hub) {
          const [normX1, normY1] = scaleDownXY(canvasRef, x1, y1);
          const [normX2, normY2] = scaleDownXY(canvasRef, x2, y2);
          const [normWidth] = scaleDownXY(canvasRef, targetWidth, 0);
          wsConn?.send(
            JSON.stringify({
              role,
              type: WSMessageType.Paint,
              data: {
                x1: normX1,
                y1: normY1,
                x2: normX2,
                y2: normY2,
                color: targetColor,
                width: normWidth,
              },
            } as WSMessage)
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
        if (role !== ControllerRole.Hub) {
          const [normX, normY] = scaleDownXY(canvasRef, startX, startY);
          wsConn?.send(
            JSON.stringify({
              role,
              type: WSMessageType.Fill,
              data: { x1: normX, y1: normY, color: targetColor },
            } as WSMessage)
          );
        }
      },
      [canvasRef, role, wsConn]
    );

    const placeText = useCallback(
      (x, y, id, text, fontSize) => {
        const ctx = canvasRef.current.getContext(
          "2d"
        ) as CanvasRenderingContext2D;
        ctx.font = `${fontSize * SCALE}px Arial`;
        const [x1, y1, x2, y2] = getTextBounds(canvasRef, x, y, text, fontSize);
        setTextShapes(() => ({
          ...textShapesRef.current,
          [id]: {
            text,
            fontSize,
            x1,
            y1,
            x2,
            y2,
          } as TextShape,
        }));
        if (role !== ControllerRole.Hub) {
          const [normX, normY] = scaleDownXY(canvasRef, x, y);
          const [normFontSize] = scaleDownXY(canvasRef, fontSize, 0);
          wsConn?.send(
            JSON.stringify({
              role,
              type: WSMessageType.Text,
              data: {
                x1: normX,
                y1: normY,
                id,
                text,
                width: normFontSize,
              },
            } as WSMessage)
          );
        }
      },
      [canvasRef, role, wsConn]
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
        ctx.font = `${shape.fontSize * SCALE}px Arial`;
        ctx.fillText(
          shape.text,
          (shape.x1 + shape.x2) / 2,
          (shape.y1 + shape.y2) / 2
        );
        if (parseInt(id, 10) === editingTextIdRef.current) {
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#00dd88";
          ctx.rect(
            shape.x1 - SELECT_PADDING,
            shape.y1 - SELECT_PADDING,
            shape.x2 -
              shape.x1 +
              2 * SELECT_PADDING +
              (role !== ControllerRole.Hub ? 6 : 0),
            shape.y2 - shape.y1 + 2 * SELECT_PADDING
          );
          ctx.stroke();
          ctx.closePath();
          if (role !== ControllerRole.Hub && FRAME_COUNTER > 30) {
            ctx.beginPath();
            ctx.rect(shape.x2 + 2, shape.y1 - 2, 2, shape.y2 - shape.y1 + 2);
            ctx.fill();
            ctx.closePath();
          }
        } else if (role !== ControllerRole.Hub) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#00aaaa";
          ctx.rect(
            shape.x1 - SELECT_PADDING,
            shape.y1 - SELECT_PADDING,
            shape.x2 - shape.x1 + 2 * SELECT_PADDING,
            shape.y2 - shape.y1 + 2 * SELECT_PADDING
          );
          ctx.stroke();
          ctx.closePath();
        }
      });
    };

    const interactCanvas = (
      x: number,
      y: number,
      isEditingText: boolean,
      hover: boolean
    ) => {
      let targetId: number | undefined;
      let targetShape: TextShape | undefined;
      Object.entries(textShapesRef.current).forEach(([id, shape]) => {
        if (
          !targetShape &&
          x >= shape.x1 - SELECT_PADDING &&
          x <= shape.x2 + SELECT_PADDING &&
          y >= shape.y1 - SELECT_PADDING &&
          y <= shape.y2 + SELECT_PADDING
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
        if (targetId) {
          // edit clicked text
          setEditingTextId(targetId);
        } else if (editingTextId) {
          // deselect currently editing text
          setEditingTextId(0);
        } else {
          // insert new text
          placeText(x, y, textId, "", 18);
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

    const placeAudio = (b64Audio: string) => {
      const player = document.createElement("audio");
      player.src = b64Audio;
      player.play();
      setAudioB64Strings((prev) => [...prev, b64Audio]);
    };

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
                JSON.stringify({
                  role,
                  type: WSMessageType.Audio,
                  data: {
                    text: reader.result,
                  },
                } as WSMessage)
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
        let checkpoint: Checkpoint;
        if (tool === ToolMode.Paint || tool === ToolMode.Fill) {
          const ctx = canvasRef.current.getContext(
            "2d"
          ) as CanvasRenderingContext2D;
          checkpoint = {
            tool,
            data: ctx.getImageData(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            ),
            timestamp: Date.now(),
          };
        } else if (tool === ToolMode.Text) {
          const filtered = Object.fromEntries(
            Object.entries(textShapesRef.current).filter(
              ([, shape]) => shape.text.length > 0
            )
          );
          setTextShapes(filtered);
          checkpoint = {
            tool,
            data: filtered,
            timestamp: Date.now(),
          };
        }
        setCheckpointHistory((prev) => {
          return [...prev, checkpoint];
        });
        if (role !== ControllerRole.Hub) {
          wsConn?.send(
            JSON.stringify({
              role,
              type: WSMessageType.Checkpoint,
              data: {
                text: tool,
              },
            } as WSMessage)
          );
        }
      },
      [canvasRef, role, wsConn]
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
      if (role !== ControllerRole.Hub) {
        wsConn?.send(
          JSON.stringify({
            role,
            type: WSMessageType.Undo,
            data: {},
          } as WSMessage)
        );
      }
    }, [canvasRef, role, wsConn]);

    const placeCursor = useCallback(
      (
        normX: number,
        normY: number,
        normWidth: number,
        targetMode: ToolMode
      ) => {
        setCursor({
          normX,
          normY,
          normWidth,
          toolMode: targetMode,
        } as Cursor);
        if (role !== ControllerRole.Hub) {
          wsConn?.send(
            JSON.stringify({
              role,
              type: WSMessageType.Cursor,
              data: {
                x1: normX,
                y1: normY,
                width: normWidth,
                text: targetMode,
              },
            } as WSMessage)
          );
        }
      },
      [setCursor, role, wsConn]
    );

    const readMessage = useCallback(
      (ev: MessageEvent) => {
        try {
          const msg: WSMessage = JSON.parse(ev.data);
          if (msg.role === layer || msg.type === WSMessageType.Control) {
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
              case WSMessageType.Paint:
                placePaint(
                  x1,
                  y1,
                  x2,
                  y2,
                  msg.data.color || "#000000ff",
                  width || 8
                );
                break;
              case WSMessageType.Fill:
                placeFill(x1, y1, msg.data.color || "#000000ff");
                break;
              case WSMessageType.Text:
                placeText(
                  x1,
                  y1,
                  msg.data.id || 1,
                  msg.data.text || "",
                  width || 0
                );
                break;
              case WSMessageType.Audio:
                placeAudio(msg.data.text || "");
                break;
              case WSMessageType.Checkpoint:
                placeCheckpoint(msg.data.text as ToolMode);
                break;
              case WSMessageType.Undo:
                placeUndo();
                break;
              case WSMessageType.Cursor:
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
      ]
    );

    const onPointerDown = (event: SimplePointerEventData) => {
      const [x, y] = translateXY(canvasRef, event.clientX, event.clientY);
      const [normX, normY] = scaleDownXY(canvasRef, x, y);
      const [normWidth] = scaleDownXY(canvasRef, toolWidth, 0);
      placeCursor(normX, normY, normWidth, toolMode);
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
          placeText(x, y, editingTextId, shape.text, shape.fontSize);
          break;
        case ToolMode.None:
          interactCanvas(x, y, false, true);
          break;
        default:
      }
      if (allowDrawing) setLastPos([x, y]);
    };

    const onPointerUp = (_event: SimplePointerEventData) => {
      if (!allowDrawing) return;
      if (toolMode === ToolMode.Paint || toolMode === ToolMode.Fill) {
        placeCheckpoint(toolMode);
      }
      if (dragging) {
        setEditingTextId(0);
      }
      setDragging(false);
      setHasLifted(true);
      setCursor(undefined);
    };

    const wrapPointerHandler =
      (handler: (event: SimplePointerEventData) => void) =>
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (event.isPrimary) {
          handler({ clientX: event.clientX, clientY: event.clientY });
        }
      };

    const onKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (!allowDrawing) return;
        event.preventDefault();
        const { ctrlKey, metaKey, key } = event;
        if ((ctrlKey || metaKey) && key === "z") {
          placeUndo();
        }
        const shape = textShapesRef.current[editingTextId];
        if (!shape) return;
        if (key === "Escape" || key === "Enter") {
          setEditingTextId(0);
        }
        if (key.length === 1 || key === "Backspace") {
          if (key.length === 1) {
            shape.text += key;
          } else if (key === "Backspace") {
            if (shape.text)
              shape.text = shape.text.substring(0, shape.text.length - 1);
          }
          placeText(
            (shape.x1 + shape.x2) / 2,
            (shape.y1 + shape.y2) / 2,
            editingTextId,
            shape.text,
            shape.fontSize
          );
        }
      },
      [allowDrawing, editingTextId, placeText, placeUndo]
    );

    const adjustCanvasSize = useCallback(() => {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * SCALE;
      canvas.height = canvas.width * ASPECT_RATIO;
    }, [canvasRef]);

    // setup on component mount
    useEffect(() => {
      adjustCanvasSize();
      setAllowDrawing(role !== ControllerRole.Hub);
      switch (role) {
        case ControllerRole.Story:
          initAudio();
          setToolMode(ToolMode.Text);
          break;
        case ControllerRole.Character:
          setToolMode(ToolMode.Paint);
          break;
        case ControllerRole.Background:
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
      setAudioB64Strings([]);
      setTextShapes({});
      setCheckpointHistory([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNum]);

    // workaround to recalculate width when canvas appears or becomes hidden
    useEffect(() => {
      adjustCanvasSize();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustCanvasSize, isShown]);

    // initialize keyboard listener
    useEffect(() => {
      if (isShown) {
        window.addEventListener("keydown", onKeyDown);
      }
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [isShown, layer, onKeyDown]);

    // start text layer animation
    useEffect(() => {
      if (isShown && layer === ControllerRole.Story) {
        const anim = window.requestAnimationFrame(refreshText);
        return () => {
          window.cancelAnimationFrame(anim);
        };
      }
      return () => {};
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isShown, layer]);

    // unselect text on tool change
    useEffect(() => setEditingTextId(0), [toolMode]);

    // place checkpoint on finish text editing
    useEffect(() => {
      if (editingTextId === 0) placeCheckpoint(ToolMode.Text);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingTextId, textId]);

    return (
      <>
        <canvas
          ref={canvasRef}
          onPointerDown={wrapPointerHandler(onPointerDown)}
          onPointerMove={wrapPointerHandler(onPointerMove)}
          onPointerUp={wrapPointerHandler(onPointerUp)}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          style={{
            borderWidth: 4,
            width: "100%",
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
              role === ControllerRole.Hub || toolMode === ToolMode.Audio
                ? "auto"
                : "none",
          }}
        />
        {role === ControllerRole.Hub &&
          audioB64Strings.map((b64Audio) => <audio src={b64Audio} controls />)}
        {toolMode !== ToolMode.None && (
          <div>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={toolMode}
                onChange={(e) => setToolMode(e.target.value as ToolMode)}
              >
                {role === ControllerRole.Story && (
                  <>
                    <FormControlLabel
                      value={ToolMode.Text}
                      control={<Radio />}
                      label="Text"
                      disabled={audioRecording}
                    />
                    <FormControlLabel
                      value={ToolMode.Audio}
                      control={<Radio />}
                      label="Audio"
                      disabled={audioRecording}
                    />
                  </>
                )}
                {(role === ControllerRole.Character ||
                  role === ControllerRole.Background) && (
                  <>
                    <FormControlLabel
                      value={ToolMode.Paint}
                      control={<Radio />}
                      label="Paint"
                    />
                    <FormControlLabel
                      value={ToolMode.Fill}
                      control={<Radio />}
                      label="Fill"
                    />
                  </>
                )}
              </RadioGroup>
            </FormControl>
          </div>
        )}
        {toolMode === ToolMode.Text && (
          <div>
            Click on canvas insert text. Press ESC or ENTER when finished. Click
            on text again to edit text.
          </div>
        )}
        {role !== ControllerRole.Hub && role !== ControllerRole.Story && (
          <div>
            <Slider
              disabled={toolMode !== ToolMode.Paint}
              defaultValue={8}
              valueLabelDisplay="auto"
              value={toolWidth}
              onChange={(e, width) => setToolWidth(width as number)}
              step={4 * SCALE}
              marks
              min={4 * SCALE}
              max={32 * SCALE}
            />
          </div>
        )}
        {(toolMode === ToolMode.Fill || toolMode === ToolMode.Paint) && (
          <div>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={toolColor}
                onChange={(e) => setToolColor(e.target.value)}
              >
                <FormControlLabel
                  value="#000000ff"
                  control={<Radio />}
                  label="Black"
                />
                <FormControlLabel
                  value="#ff0000ff"
                  control={<Radio />}
                  label="Red"
                />
                <FormControlLabel
                  value="#ffff00ff"
                  control={<Radio />}
                  label="Yellow"
                />
                <FormControlLabel
                  value="#00ff00ff"
                  control={<Radio />}
                  label="Green"
                />
                <FormControlLabel
                  value="#00ffffff"
                  control={<Radio />}
                  label="Cyan"
                />
                <FormControlLabel
                  value="#0000ffff"
                  control={<Radio />}
                  label="Blue"
                />
                <FormControlLabel
                  value="#00000000"
                  control={<Radio />}
                  label="Erase"
                />
              </RadioGroup>
            </FormControl>
          </div>
        )}
        {toolMode === ToolMode.Audio && (
          <div>
            <FormControl component="fieldset">
              <Button onClick={recordAudio}>
                {audioRecording ? "Stop" : "Record"}
              </Button>
            </FormControl>
          </div>
        )}
        {role !== ControllerRole.Hub && (
          <div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                placeUndo();
              }}
            >
              Undo
            </Button>
          </div>
        )}
      </>
    );
  }
);

Canvas.defaultProps = {
  isShown: true,
};

export default Canvas;
