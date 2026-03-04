import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { Sensor, DataParadigm, LiveDataPayload, WebhookAlertPayload } from '../shared/types';

const app = express();
app.use(cors());

// --- 1. SENSOR INVENTORY & REALISTIC MAPPING ---
// We add 'locations', 'zRange' (min/max elevation), and 'exactCount' to make them realistic.
const SENSOR_TYPES: Array<{
  type: string;
  paradigm: DataParadigm;
  unit: string;
  base: number;
  manufacturer: string;
  locations: string[];
  zRange: [number, number]; // 0.0 is foundation, 1.0 is roof
  exactCount?: number; // Forces a specific number of sensors (e.g., 1 for weather)
}> = [
  // Weather sensors strictly on the roof
  { type: 'Wind', paradigm: 'websocket', unit: 'm/s', base: 5, manufacturer: 'MeteoTech', locations: ['Roof'], zRange: [1.0, 1.0], exactCount: 1 },
  { type: 'Rain', paradigm: 'rest', unit: 'mm/h', base: 0, manufacturer: 'MeteoTech', locations: ['Roof'], zRange: [1.0, 1.0], exactCount: 1 },
  
  // Structural displacement and movement
  { type: '3DSensor', paradigm: 'websocket', unit: 'mm', base: 0, manufacturer: 'Nerve-Sensors', locations: ['Foundation', 'Main Pillar'], zRange: [0.0, 0.3] },
  { type: 'PDS', paradigm: 'webhook', unit: '%', base: 0.1, manufacturer: 'Nerve-Sensors', locations: ['Floor Base', 'Foundation'], zRange: [0.0, 0.1] },
  
  // Cracks and structural fatigue
  { type: 'SmartCrackDetection', paradigm: 'webhook', unit: 'mm', base: 0.5, manufacturer: 'structuraltestingtools', locations: ['Exterior Wall', 'Ceiling', 'Pillar'], zRange: [0.2, 0.8] },
  { type: 'EpsilonPeak', paradigm: 'websocket', unit: 'µε', base: 300, manufacturer: 'Nerve-Sensors', locations: ['Load-bearing Beam', 'Pillar'], zRange: [0.3, 0.9] },
  
  // Strain gauges attached to specific materials/systems
  { type: 'EpsilonSensor', paradigm: 'rest', unit: 'µε', base: 100, manufacturer: 'Nerve-Sensors', locations: ['Main Water Pipe', 'Technical Shaft'], zRange: [0.1, 0.9] },
  { type: 'EpsilonFlat', paradigm: 'rest', unit: 'µε', base: 80, manufacturer: 'Nerve-Sensors', locations: ['Floor', 'Floor Base'], zRange: [0.2, 0.8] },
  { type: 'EpsilonRebar', paradigm: 'rest', unit: 'µε', base: 150, manufacturer: 'Nerve-Sensors', locations: ['Pillar Rebar', 'Foundation'], zRange: [0.0, 0.5] },
  { type: 'EpsilonGraph', paradigm: 'rest', unit: 'µε', base: 50, manufacturer: 'Nerve-Sensors', locations: ['Ceiling', 'Dome Roof'], zRange: [0.8, 0.95] },
];

const sensors: Sensor[] = [];

SENSOR_TYPES.forEach(profile => {
  // If exactCount is defined, use it. Otherwise, spawn 3 to 6 sensors randomly.
  const count = profile.exactCount !== undefined ? profile.exactCount : Math.floor(Math.random() * 4) + 3; 
  
  for (let i = 1; i <= count; i++) {
    // Pick a random physical location from the allowed list
    const locationName = profile.locations[Math.floor(Math.random() * profile.locations.length)];
    
    // Calculate realistic Z (elevation) based on the restricted range
    const [zMin, zMax] = profile.zRange;
    const randomZ = zMin + Math.random() * (zMax - zMin);

    sensors.push({
      id: `${profile.type.toLowerCase()}_${i}`,
      // Make the name readable and context-aware (e.g., "Wind - Mái nhà")
      name: `${profile.type} (${locationName}${count > 1 ? ' ' + i : ''})`,
      location: locationName,
      type: profile.type,
      manufacturer: profile.manufacturer,
      paradigm: profile.paradigm,
      status: Math.random() > 0.85 ? 'Warning' : 'Healthy', // 15% chance of warning
      unit: profile.unit,
      markerColor: profile.paradigm === 'webhook' ? 'red' : 'darkGrey',
      position: { 
        x: Math.random().toFixed(3), 
        y: Math.random().toFixed(3),
        z: randomZ.toFixed(3) // Z is now logically bounded!
      }
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
    // Add realistic noise to the base value
    const noise = (Math.random() - 0.5) * (sensor.type === 'Wind' ? 10 : 2);
    history.push({
      timestamp: timestamp.toISOString(),
      value: Math.max(0, sensor.type === 'Rain' ? Math.random() * 5 : (SENSOR_TYPES.find(p => p.type === sensor.type)?.base || 50) + noise), 
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
    const liveData: LiveDataPayload[] = liveSensors.map(s => {
      const base = SENSOR_TYPES.find(p => p.type === s.type)?.base || 10;
      const noise = (Math.random() - 0.5) * (s.type === 'Wind' ? 5 : 1); // Wind changes faster
      return {
        type: 'realtime_data',
        sensorId: s.id,
        value: +(Math.max(0, base + noise)).toFixed(2),
        timestamp: new Date().toISOString()
      };
    });
    ws.send(JSON.stringify(liveData));
  }, 2000);

  const simulateWebhookAlert = () => {
    const alertSensors = sensors.filter(s => s.paradigm === 'webhook');
    if (alertSensors.length > 0) {
      const randomSensor = alertSensors[Math.floor(Math.random() * alertSensors.length)];
      
      const alertPayload: WebhookAlertPayload = {
        type: 'webhook_alert',
        sensorId: randomSensor.id,
        severity: 'CRITICAL',
        message: `${randomSensor.type} at ${randomSensor.name.split('(')[1].replace(')','')} exceeds safety threshold!`,
        timestamp: new Date().toISOString()
      };
      
      ws.send(JSON.stringify([alertPayload]));
    }
    setTimeout(simulateWebhookAlert, Math.random() * 20000 + 10000);
  };
  
  setTimeout(simulateWebhookAlert, 5000); 

  ws.on('close', () => clearInterval(streamInterval));
});

server.listen(3001, () => {
  console.log('TypeScript Hybrid API/WS Server running on http://localhost:3001');
});