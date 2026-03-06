export type DataParadigm = 'websocket' | 'rest' | 'webhook';

export interface Sensor {
  id: string;
  buildingId: string;
  name: string;
  location: string;
  type: string;
  manufacturer: string;
  paradigm: DataParadigm;
  status: string;
  unit: string;
  markerColor: string;
  position: {
    x: string;
    y: string;
    z: string;
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

export interface BuildingBounds {
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
  height: number;
  groundElevation: number;
}

export interface Building {
  id: string;
  name: string;
  modelUrl: string; // The ArcGIS Scene Server URL
  bounds: BuildingBounds;
  defaultCamera: {
    x: number;
    y: number;
    z: number;
    tilt: number;
  };
}