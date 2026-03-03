export type DataParadigm = 'websocket' | 'rest' | 'webhook';

export interface Sensor {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  paradigm: DataParadigm;
  unit: string;
  markerColor: string;
  position: {
    x: string;
    y: string;
  };
}

export interface HistoricalData {
  timestamp: string;
  value: number;
  unit: string;
}

export interface LiveDataPayload {
  type: 'realtime_data';
  sensorId: string;
  value: number;
  timestamp: string;
}

export interface WebhookAlertPayload {
  type: 'webhook_alert';
  sensorId: string;
  severity: string;
  message: string;
  timestamp: string;
}