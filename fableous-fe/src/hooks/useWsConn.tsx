import { useCallback, useEffect, useState } from "react";
import { WSMessageType } from "../Data";

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
        wsConn.send(JSON.stringify({ type: WSMessageType.Ping }));
      }, 5000);
    };
    const teardownPing = () => {
      clearInterval(interval);
    };
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
    setWsConn(undefined);
  }, []);

  return [
    wsConn,
    setWsConn as React.Dispatch<React.SetStateAction<WebSocket>>,
    clearWsConn,
  ];
}
