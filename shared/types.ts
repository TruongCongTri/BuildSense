export type DataParadigm = 'websocket' | 'rest' | 'webhook';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface MockSensor {
  id: string;
  buildingId: string;
  name: string;
  type: string;
  manufacturer: string;
  paradigm: DataParadigm;
  unit: string;
  location: string;
  position: Position;
}

export interface Sensor {
  id: string;
  buildingId: string;
  name: string;
  type: string;
  manufacturer: string;
  paradigm: DataParadigm;
  unit: string;
  markerColor: string;
  location: string;
  position: Position;
  status: string;
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
  coordinates?: [number, number];
  bounds: BuildingBounds;
  defaultCamera: {
    x: number;
    y: number;
    z: number;
    tilt: number;
  };
}