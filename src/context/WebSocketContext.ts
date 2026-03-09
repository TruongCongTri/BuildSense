import { createContext, useContext } from 'react';
import type { LiveDataPayload, WebhookAlertPayload } from '../../shared/types';

export interface WebSocketContextType {
  liveValues: Record<string, LiveDataPayload>;
  alerts: WebhookAlertPayload[];
  isConnected: boolean;
  clearAlert: (timestamp: string) => void;
}

// Export the context itself
export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// 🌟 ADDED: The custom hook so SensorDrawer can use this context easily!
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};