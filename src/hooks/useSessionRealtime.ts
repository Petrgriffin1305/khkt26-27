import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { API_URL, getAccessToken } from "@/services/api";
import { useSetupStore } from "@/store/setupStore";
/** Realtime is advisory. The local deadline keeps the timer usable when offline. */
export function useSessionRealtime(active: boolean) {
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = async () => {
      try {
        const token = await getAccessToken();
        if (stopped) return;
        const url = new URL(API_URL);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        url.pathname = "/ws/v1";
        url.searchParams.set("token", token);
        const socket = new WebSocket(url.toString());
        socketRef.current = socket;
        socket.onopen = () => {
          const s = useSetupStore.getState();
          socket.send(
            JSON.stringify({
              event: "session:start",
              payload: {
                session_id: s.clientId,
                topic_id: s.topicId,
                target_duration: s.targetDurationSeconds,
              },
            }),
          );
        };
        socket.onclose = () => {
          if (!stopped)
            retry = setTimeout(() => {
              void connect();
            }, 10000);
        };
        socket.onerror = () => socket.close();
      } catch {
        if (!stopped)
          retry = setTimeout(() => {
            void connect();
          }, 10000);
      }
    };
    void connect();
    const subscription = AppState.addEventListener("change", (state) => {
      if (
        state === "active" &&
        socketRef.current?.readyState !== WebSocket.OPEN &&
        socketRef.current?.readyState !== WebSocket.CONNECTING
      ) {
        clearTimeout(retry);
        void connect();
      }
    });
    return () => {
      stopped = true;
      clearTimeout(retry);
      subscription.remove();
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        const s = useSetupStore.getState();
        socket.send(
          JSON.stringify({
            event: "session:end",
            payload: {
              session_id: s.clientId,
              actual_duration: s.actualDurationSeconds,
              is_completed: s.isCompleted,
            },
          }),
        );
      }
      socket?.close();
      socketRef.current = null;
    };
  }, [active]);
  return useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN)
      socket.send(
        JSON.stringify({
          event: "distraction:attempt",
          payload: {
            session_id: useSetupStore.getState().clientId,
            app_id: "unknown",
            timestamp: new Date().toISOString(),
          },
        }),
      );
  }, []);
}
