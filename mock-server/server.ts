import express, {type Request, type Response} from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import type { DataParadigm, LiveDataPayload, Sensor, WebhookAlertPayload } from '../shared/types';
// import { Sensor, DataParadigm, LiveDataPayload, WebhookAlertPayload } from '../shared/types';

const app = express();
app.use(cors());

// --- ESRI ADMIN BUILDING REAL-WORLD BOUNDARIES ---
// Location: Redlands, California, USA
const BUILDING_BOUNDS = {
  lonMin: -117.1960, lonMax: -117.1953, 
  latMin: 34.0563, latMax: 34.0566,   
  height: 15, 
  groundElevation: 400 
};

// --- SMART COORDINATE GENERATOR ---
function generateBuildingCoordinates(location: string, zMinRatio: number, zMaxRatio: number) {
  let lon, lat;
  
  // 1. Calculate realistic absolute Z (Elevation in meters)
  const zMin = zMinRatio * BUILDING_BOUNDS.height;
  const zMax = zMaxRatio * BUILDING_BOUNDS.height;
  const absoluteZ = BUILDING_BOUNDS.groundElevation + (zMin + Math.random() * (zMax - zMin));

  // 2. Calculate X (Longitude) and Y (Latitude) based on semantic location
  if (location.includes('Roof') || location.includes('Dome')) {
    lon = BUILDING_BOUNDS.lonMin + (BUILDING_BOUNDS.lonMax - BUILDING_BOUNDS.lonMin) * (0.4 + Math.random() * 0.2);
    lat = BUILDING_BOUNDS.latMin + (BUILDING_BOUNDS.latMax - BUILDING_BOUNDS.latMin) * (0.4 + Math.random() * 0.2);
  } 
  else if (location.includes('Exterior Wall')) {
    // Snap to outer edges
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { lat = BUILDING_BOUNDS.latMax; lon = BUILDING_BOUNDS.lonMin + Math.random() * (BUILDING_BOUNDS.lonMax - BUILDING_BOUNDS.lonMin); }
    else if (edge === 1) { lat = BUILDING_BOUNDS.latMin; lon = BUILDING_BOUNDS.lonMin + Math.random() * (BUILDING_BOUNDS.lonMax - BUILDING_BOUNDS.lonMin); }
    else if (edge === 2) { lon = BUILDING_BOUNDS.lonMax; lat = BUILDING_BOUNDS.latMin + Math.random() * (BUILDING_BOUNDS.latMax - BUILDING_BOUNDS.latMin); }
    else { lon = BUILDING_BOUNDS.lonMin; lat = BUILDING_BOUNDS.latMin + Math.random() * (BUILDING_BOUNDS.latMax - BUILDING_BOUNDS.latMin); }
  } 
  else if (location.includes('Foundation')) {
    lon = BUILDING_BOUNDS.lonMin + Math.random() * (BUILDING_BOUNDS.lonMax - BUILDING_BOUNDS.lonMin);
    lat = BUILDING_BOUNDS.latMin + Math.random() * (BUILDING_BOUNDS.latMax - BUILDING_BOUNDS.latMin);
  }
  else {
    // Internal sensors (Pillars, floors, shafts) scattered inside the volume
    lon = BUILDING_BOUNDS.lonMin + (BUILDING_BOUNDS.lonMax - BUILDING_BOUNDS.lonMin) * (0.1 + Math.random() * 0.8);
    lat = BUILDING_BOUNDS.latMin + (BUILDING_BOUNDS.latMax - BUILDING_BOUNDS.latMin) * (0.1 + Math.random() * 0.8);
  }

  return { x: lon.toFixed(6), y: lat.toFixed(6), z: absoluteZ.toFixed(2) };
}

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
    
    const coords = generateBuildingCoordinates(locationName, profile.zRange[0], profile.zRange[1]);

    sensors.push({
      id: `${profile.type.toLowerCase()}_${i}`,
      name: `${profile.type} (${locationName}${count > 1 ? ' ' + i : ''})`,
      location: locationName,
      type: profile.type,
      manufacturer: profile.manufacturer,
      paradigm: profile.paradigm,
      status: Math.random() > 0.85 ? 'Warning' : 'Healthy', // 15% chance of warning
      unit: profile.unit,
      markerColor: profile.paradigm === 'webhook' ? 'red' : 'darkGrey',
      position: coords
    });
  }
});

// --- 2. REST ENDPOINTS ---
app.get('/api/sensors', (req: Request, res: Response) => {
  // 1. Get pagination parameters from the query string (default to page 1, 50 items per page)
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  // 2. Calculate pagination boundaries
  const total = sensors.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // 3. Slice the array to get only the requested page
  const paginatedSensors = sensors.slice(startIndex, endIndex);

  res.status(200).json({
    sensors: paginatedSensors,
    metadata: {
      status: 200,
      message: "Sensors retrieved successfully",
      error: false,
      errorMessage: null,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: total,
        perPage: limit
      }
    }
  });
});

app.get('/api/sensors/:id/data', (req: Request, res: Response) => {
  const { id } = req.params;
  const days = parseInt(req.query.days as string) || 7; 

  // 1. Get pagination params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const sensor = sensors.find(s => s.id === id);
  
  // Handle 404 with the standard error format
  if (!sensor) {
    return res.status(404).json({
      history: [],
      metadata: {
        status: 404,
        message: "Failed to retrieve sensor data",
        error: true,
        errorMessage: `Sensor not found with ID: ${id}`,
        pagination: null
      }
    });
  }

  // Generate the full history first
  const fullHistory = [];
  const now = new Date();
  
  for(let i = days * 24; i > 0; i--) { 
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const noise = (Math.random() - 0.5) * (sensor.type === 'Wind' ? 10 : 2);
    fullHistory.push({
      timestamp: timestamp.toISOString(),
      value: Math.max(0, sensor.type === 'Rain' ? Math.random() * 5 : (SENSOR_TYPES.find(p => p.type === sensor.type)?.base || 50) + noise), 
      unit: sensor.unit
    });
  }

  // 2. Calculate pagination for the history data
  const total = fullHistory.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // 3. Slice the data
  const paginatedHistory = fullHistory.slice(startIndex, endIndex);

  // Return the successful history payload
  res.status(200).json({
    history: paginatedHistory,
    metadata: {
      status: 200,
      message: "Historical data retrieved successfully",
      error: false,
      errorMessage: null,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: total,
        perPage: limit
      }
    }
  });
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