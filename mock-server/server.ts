import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { Sensor, DataParadigm, LiveDataPayload, WebhookAlertPayload } from '../shared/types';

const app = express();
app.use(cors());

// --- 1. SENSOR INVENTORY ---
const SENSOR_TYPES: Array<{
  type: string;
  paradigm: DataParadigm;
  unit: string;
  base: number;
  manufacturer: string;
}> = [
  { type: 'Wind', paradigm: 'websocket', unit: 'm/s', base: 5, manufacturer: 'MeteoTech' },
  { type: 'Rain', paradigm: 'rest', unit: 'mm/h', base: 0, manufacturer: 'MeteoTech' },
  { type: '3DSensor', paradigm: 'websocket', unit: 'mm', base: 0, manufacturer: 'Nerve-Sensors' },
  { type: 'EpsilonPeak', paradigm: 'websocket', unit: 'µε', base: 300, manufacturer: 'Nerve-Sensors' },
  { type: 'SmartCrackDetection', paradigm: 'webhook', unit: 'mm', base: 0.5, manufacturer: 'structuraltestingtools' },
  { type: 'PDS', paradigm: 'webhook', unit: '%', base: 0.1, manufacturer: 'Nerve-Sensors' },
  { type: 'EpsilonSensor', paradigm: 'rest', unit: 'µε', base: 100, manufacturer: 'Nerve-Sensors' },
  { type: 'EpsilonFlat', paradigm: 'rest', unit: 'µε', base: 80, manufacturer: 'Nerve-Sensors' },
  { type: 'EpsilonRebar', paradigm: 'rest', unit: 'µε', base: 150, manufacturer: 'Nerve-Sensors' },
  { type: 'EpsilonGraph', paradigm: 'rest', unit: 'µε', base: 50, manufacturer: 'Nerve-Sensors' },
];

const sensors: Sensor[] = [];

SENSOR_TYPES.forEach(profile => {
  const count = Math.floor(Math.random() * 6) + 5; 
  for (let i = 1; i <= count; i++) {
    sensors.push({
      id: `${profile.type.toLowerCase()}_${i}`,
      name: `${profile.type} - Unit ${i}`,
      type: profile.type,
      manufacturer: profile.manufacturer,
      paradigm: profile.paradigm,
      unit: profile.unit,
      markerColor: profile.paradigm === 'webhook' ? 'red' : 'darkGrey',
      position: { x: Math.random().toFixed(2), y: Math.random().toFixed(2) }
    });
  }
});

// --- 2. REST ENDPOINTS ---
app.get('/api/sensors', (req: Request, res: Response) => {
  res.json(sensors);
});

app.get('/api/sensors/:id/data', (req: Request, res: Response) => {
  const { id } = req.params;
  const days = parseInt(req.query.days as string) || 7; 
  const sensor = sensors.find(s => s.id === id);
  
  if (!sensor) {
    return res.status(404).send('Sensor not found');
  }

  const history = [];
  const now = new Date();
  
  for(let i = days * 24; i > 0; i--) { 
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    history.push({
      timestamp: timestamp.toISOString(),
      value: (Math.random() * 10) + 50, 
      unit: sensor.unit
    });
  }
  res.json(history);
});

const server = http.createServer(app);

// --- 3. WEBSOCKETS ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Frontend connected to WebSocket stream');

  const streamInterval = setInterval(() => {
    const liveSensors = sensors.filter(s => s.paradigm === 'websocket');
    const liveData: LiveDataPayload[] = liveSensors.map(s => ({
      type: 'realtime_data',
      sensorId: s.id,
      value: +(Math.random() * 10 + 5).toFixed(2),
      timestamp: new Date().toISOString()
    }));
    ws.send(JSON.stringify(liveData));
  }, 2000);

  const simulateWebhookAlert = () => {
    const alertSensors = sensors.filter(s => s.paradigm === 'webhook');
    const randomSensor = alertSensors[Math.floor(Math.random() * alertSensors.length)];
    
    const alertPayload: WebhookAlertPayload = {
      type: 'webhook_alert',
      sensorId: randomSensor.id,
      severity: 'CRITICAL',
      message: `${randomSensor.type} threshold exceeded!`,
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify([alertPayload]));
    setTimeout(simulateWebhookAlert, Math.random() * 20000 + 10000);
  };
  
  setTimeout(simulateWebhookAlert, 5000); 

  ws.on('close', () => clearInterval(streamInterval));
});

server.listen(3001, () => {
  console.log('TypeScript Hybrid API/WS Server running on http://localhost:3001');
});