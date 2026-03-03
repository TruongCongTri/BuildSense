import { useEffect } from 'react';
import type { WebhookAlertPayload } from '../../shared/types';

export const useSensorAlerts = (
  onAlertReceived: (alert: WebhookAlertPayload) => void,
  wsUrl: string = 'ws://localhost:3001'
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