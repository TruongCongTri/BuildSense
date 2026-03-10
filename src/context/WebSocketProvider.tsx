import React, { useEffect, useState, useRef } from "react";
import type { LiveDataPayload, LiveSensorValue, WebhookAlertPayload } from "../../shared/types";
import { WebSocketContext } from "./WebSocketContext";

export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
  wsUrl?: string;
}> = ({ children, wsUrl = "ws://localhost:3001" }) => {
  const [liveValues, setLiveValues] = useState<Record<string, LiveSensorValue>>({});
  const [alerts, setAlerts] = useState<WebhookAlertPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Use a ref to keep track of the WS instance without triggering re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const isIntentionalClose = useRef(false);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          // Parse it as a single object, not an array!
          const payload = JSON.parse(event.data) as LiveDataPayload;

          // Match the exact type string from your server.ts
          if (payload.type === "LIVE_DATA") {
            
            // 1. Update Live Values dynamically
            if (payload.liveValues) {
              setLiveValues((prev) => ({
                ...prev,
                ...payload.liveValues, // React perfectly detects this spread as a new state!
              }));
            }

            // 2. Update Alerts dynamically
            if (payload.alerts && payload.alerts.length > 0) {
              // Automatically tag alerts with a timestamp if they don't have one
              const timestampedAlerts = payload.alerts.map(a => ({
                ...a,
                timestamp: a.timestamp || new Date().toISOString()
              }));
              setAlerts((prev) => [...prev, ...timestampedAlerts]);
            }
          }
        } catch (error) {
          console.error("⚠️ Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect if it dropped unintentionally
        if (!isIntentionalClose.current) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      isIntentionalClose.current = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  // Utility to remove an alert once the UI has displayed it
  const clearAlert = (timestamp: string) => {
    setAlerts((prev) => prev.filter((a) => a.timestamp !== timestamp));
  };

  return (
    <WebSocketContext.Provider
      value={{ liveValues, alerts, isConnected, clearAlert }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};