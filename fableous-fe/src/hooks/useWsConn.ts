import { useCallback, useEffect, useState } from "react";
import { proto as pb } from "../proto/message_pb";

/**
 * Manages websocket state by handling pings to keep connection alive.
 *
 * @return {[WebSocket | undefined, Dispatch<SetStateAction<WebSocket>>, () => void]}
 * websocket state,
 * setstate and
 * function to clear websocket
 */
export default function useWsConn(): [
  WebSocket | undefined,
  React.Dispatch<React.SetStateAction<WebSocket>>,
  () => void
] {
  const [wsConn, setWsConn] = useState<WebSocket>();

  useEffect(() => {
    if (!wsConn) return () => {};

    let interval: NodeJS.Timeout;
    const setupPing = () => {
      interval = setInterval(() => {
        wsConn.send(
          pb.WSMessage.encode({ type: pb.WSMessageType.PING }).finish()
        );
      }, 5000);
    };
    const teardownPing = () => {
      clearInterval(interval);
    };
    wsConn.binaryType = "arraybuffer";
    wsConn.addEventListener("open", setupPing);
    wsConn.addEventListener("error", teardownPing);
    wsConn.addEventListener("close", teardownPing);
    return () => {
      wsConn.removeEventListener("open", setupPing);
      wsConn.removeEventListener("error", teardownPing);
      wsConn.removeEventListener("close", teardownPing);
      teardownPing();
      wsConn.close();
    };
  }, [wsConn]);

  const clearWsConn = useCallback(() => {
    wsConn?.close();
    setWsConn(undefined);
  }, [wsConn]);

  return [
    wsConn,
    setWsConn as React.Dispatch<React.SetStateAction<WebSocket>>,
    clearWsConn,
  ];
}
