import React, { useEffect, useState, useRef } from "react";
import type { LiveDataPayload, WebhookAlertPayload } from "../../shared/types";
import { WebSocketContext } from "./WebSocketContext";

// Define exactly what a raw incoming message looks like to satisfy TypeScript
interface IncomingMessage {
  type: string;
  [key: string]: unknown; // It can have other properties, but we only care about 'type' right now
}
export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
  wsUrl?: string;
}> = ({ children, wsUrl = "ws://localhost:3001" }) => {
  const [liveValues, setLiveValues] = useState<Record<string, LiveDataPayload>>(
    {},
  );
  const [alerts, setAlerts] = useState<WebhookAlertPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Use a ref to keep track of the WS instance without triggering re-renders
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Open the single connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      // Tell TypeScript that the parsed JSON is an array of IncomingMessage objects
      const payloads = JSON.parse(event.data) as IncomingMessage[];

      // Handle Live Data Stream
      const streamData = payloads.filter(
        (p) => p.type === "realtime_data",
      ) as unknown as LiveDataPayload[];
      if (streamData.length > 0) {
        setLiveValues((prev) => {
          const newState = { ...prev };
          streamData.forEach((data) => {
            newState[data.sensorId] = data;
          });
          return newState;
        });
      }

      // Handle Webhook Alerts
      const newAlerts = payloads.filter(
        (p) => p.type === "webhook_alert",
      ) as unknown as WebhookAlertPayload[];
      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev, ...newAlerts]); // Append new alerts to the list
      }
    };

    // Cleanup on unmount
    return () => {
      ws.close();
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
