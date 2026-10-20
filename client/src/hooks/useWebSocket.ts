import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";

export const useWebSocket = (onMessage: (data: any) => void) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsConnected(false);
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const wsUrl = `${WS_BASE}?token=${encodeURIComponent(token)}`;
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch (err) {
          console.error("Failed to parse WS frame:", err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Retry connection after 3 seconds if token remains valid
        reconnectTimeout = setTimeout(() => {
          if (token) connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
    };
  }, [token]);

  return { isConnected };
};