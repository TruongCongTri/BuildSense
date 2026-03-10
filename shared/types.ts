export type DataParadigm = 'websocket' | 'rest' | 'webhook';

export interface Position {
  x: number;
  y: number;
  z: number;
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
  adminStatus: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned';
  healthStatus: 'Healthy' | 'Warning' | 'Error' | 'Offline';
  dataStatus: 'Normal' | 'Warning' | 'Critical';
}

export interface HistoricalData {
  timestamp: string;
  value: number;
  unit?: string;
  adminStatus: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned';
  healthStatus: 'Healthy' | 'Warning' | 'Error' | 'Offline';
  dataStatus: 'Normal' | 'Warning' | 'Critical';
}

// Defines the shape of the actual data inside the live dictionary
export interface LiveSensorValue {
  value: number;
  dataStatus: 'Normal' | 'Warning' | 'Critical';
  healthStatus: 'Healthy' | 'Warning' | 'Error' | 'Offline';
  adminStatus: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned';
}

export interface WebhookAlertPayload {
  type?: string;
  sensorId: string;
  severity?: string;
  message: string;
  timestamp?: string; // Made optional so live auto-alerts don't crash TS
}

//  Defines the shape of the overall incoming WS message
export interface LiveDataPayload {
  type: 'LIVE_DATA';
  liveValues: Record<string, LiveSensorValue>;
  alerts: WebhookAlertPayload[];
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
  modelUrl: string;
  coordinates?: [number, number];
  bounds: BuildingBounds;
  defaultCamera: {
    x: number;
    y: number;
    z: number;
    tilt: number;
  };
  type?: 'highway' | 'bridge' | 'building' | 'tunnel' | string;
}