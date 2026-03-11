import { useEffect } from 'react';
import type { WebhookAlertPayload } from '../../shared/types';

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const useSensorAlerts = (
  onAlertReceived: (alert: WebhookAlertPayload) => void,
  wsUrl: string = DEFAULT_WS_URL
) => {
  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const payloads = JSON.parse(event.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alerts = payloads.filter((p: any) => p.type === 'webhook_alert') as WebhookAlertPayload[];
      
      alerts.forEach(alert => {
        // Trigger whatever action the component requested
        onAlertReceived(alert);
      });
    };

    return () => ws.close();
  }, [wsUrl, onAlertReceived]);
};