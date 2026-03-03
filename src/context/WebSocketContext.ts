import { createContext } from 'react';
import type { LiveDataPayload, WebhookAlertPayload } from '../../shared/types';

export interface WebSocketContextType {
  liveValues: Record<string, LiveDataPayload>;
  alerts: WebhookAlertPayload[];
  isConnected: boolean;
  clearAlert: (timestamp: string) => void;
}

// We only export the context itself here. No React components!
export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);