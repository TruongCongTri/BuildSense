import { useState, useEffect } from 'react';
import type { LiveDataPayload } from '../../shared/types';

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const useLiveStream = (wsUrl: string = DEFAULT_WS_URL) => {
  // Stores the latest value for each sensor ID
  const [liveValues, setLiveValues] = useState<Record<string, LiveDataPayload>>({});

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const payloads = JSON.parse(event.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const streamData = payloads.filter((p: any) => p.type === 'realtime_data') as LiveDataPayload[];
      
      if (streamData.length > 0) {
        setLiveValues(prev => {
          const newState = { ...prev };
          streamData.forEach(data => {
            newState[data.sensorId] = data; // Update or insert the latest data point
          });
          return newState;
        });
      }
    };

    // Automatically close the connection when the component unmounts
    return () => ws.close();
  }, [wsUrl]);

  return liveValues;
};