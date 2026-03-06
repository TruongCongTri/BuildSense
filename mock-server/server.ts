import express, {type Request, type Response} from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import type { DataParadigm, LiveDataPayload, Sensor, WebhookAlertPayload } from '../shared/types';

const app = express();
app.use(cors());

// Define exactly what the building's geometry looks like
interface BuildingBounds {
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
  height: number;
  groundElevation: number;
}

interface CameraSettings {
  x: number;
  y: number;
  z: number;
  tilt: number;
}

// Define the overall building structure
interface ServerBuilding {
  id: string;
  name: string;
  modelUrl: string;
  bounds: BuildingBounds | null;   // Allow null initially
  defaultCamera: CameraSettings | null; // Allow null initially
}

// --- 1. DYNAMIC BUILDING INVENTORY ---
// const ACTIVE_BUILDING: ServerBuilding = {
//   id: "bldg_esri_admin",
//   name: "Esri Administration Building",
//   modelUrl: "https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/BSL__4326__US_Redlands__EsriAdminBldg_PublicDemo/SceneServer",
//   bounds: null,
//   defaultCamera: null
// };

// THE NEW MULTI-TENANT SINGLE-BUILDING PORTFOLIO!
const ACTIVE_BUILDINGS: ServerBuilding[] = [
  {
    // 1. (STILL WORKING) Esri Admin Building (True BIM)
    id: "bldg_esri_admin",
    name: "Esri Admin Building",
    modelUrl: "https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/BSL__4326__US_Redlands__EsriAdminBldg_PublicDemo/SceneServer",
    bounds: null, defaultCamera: null
  },
  {
    // 2. (STILL WORKING) Milwaukee Airport Concourse (True BIM)
    id: "bldg_mke_airport",
    name: "Milwaukee Airport Concourse",
    modelUrl: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/MKE_Midwest_Express_3D_WSL11/SceneServer",
    bounds: null, defaultCamera: null
  }
];
let sensors: Sensor[] = [];

// --- MAPPING UTILITY: Convert Web Mercator (Meters) to WGS84 (GPS Degrees) ---
function mercatorToLatLon(x: number, y: number) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lon, lat };
}

// --- 2. BACKEND COORDINATE GENERATOR ---
function generateAbsoluteCoordinates(location: string, zMinRatio: number, zMaxRatio: number, sensorId: string, bounds: BuildingBounds) {
  const hash = sensorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomX = (hash % 100) / 100;
  const randomY = ((hash * 7) % 100) / 100;
  const randomZ = ((hash * 13) % 100) / 100;

  let lon, lat;
  const zMin = zMinRatio * bounds.height;
  const zMax = zMaxRatio * bounds.height;
  const absoluteZ = bounds.groundElevation + (zMin + randomZ * (zMax - zMin));

  if (location.includes('Roof') || location.includes('Dome')) {
    lon = bounds.lonMin + (bounds.lonMax - bounds.lonMin) * (0.3 + randomX * 0.4);
    lat = bounds.latMin + (bounds.latMax - bounds.latMin) * (0.3 + randomY * 0.4);
  } else if (location.includes('Exterior Wall')) {
    const edge = hash % 4; 
    if (edge === 0) { lat = bounds.latMax; lon = bounds.lonMin + randomX * (bounds.lonMax - bounds.lonMin); }
    else if (edge === 1) { lat = bounds.latMin; lon = bounds.lonMin + randomX * (bounds.lonMax - bounds.lonMin); }
    else if (edge === 2) { lon = bounds.lonMax; lat = bounds.latMin + randomY * (bounds.latMax - bounds.latMin); }
    else { lon = bounds.lonMin; lat = bounds.latMin + randomY * (bounds.latMax - bounds.latMin); }
  } else {
    lon = bounds.lonMin + (bounds.lonMax - bounds.lonMin) * (0.1 + randomX * 0.8);
    lat = bounds.latMin + (bounds.latMax - bounds.latMin) * (0.1 + randomY * 0.8);
  }

  return { x: lon.toFixed(6), y: lat.toFixed(6), z: absoluteZ.toFixed(2) };
}

// --- 3. SENSOR INVENTORY & REALISTIC MAPPING ---
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

function buildSensors() {
  sensors = [];
  ACTIVE_BUILDINGS.forEach((building, bIndex) => {
    const buildingBounds = building.bounds;
    if (!buildingBounds) return;

    SENSOR_TYPES.forEach(profile => {
      const count = profile.exactCount !== undefined ? profile.exactCount : Math.floor(Math.random() * 4) + 3; 
      for (let i = 1; i <= count; i++) {
        const locationName = profile.locations[Math.floor(Math.random() * profile.locations.length)];
        const sensorId = `b${bIndex}_${profile.type.toLowerCase()}_${i}`;
        const coords = generateAbsoluteCoordinates(locationName, profile.zRange[0], profile.zRange[1], sensorId, buildingBounds);

        sensors.push({
          id: sensorId,
          buildingId: building.id,
          name: `${profile.type} (${locationName}${count > 1 ? ' ' + i : ''})`,
          location: locationName,
          type: profile.type,
          manufacturer: profile.manufacturer,
          paradigm: profile.paradigm,
          status: Math.random() > 0.85 ? 'Warning' : 'Healthy',
          unit: profile.unit,
          markerColor: profile.paradigm === 'webhook' ? 'red' : 'darkGrey',
          position: coords 
        });
      }
    });
  });
}

// --- 4. REST ENDPOINTS ---
app.get('/api/buildings', (req: Request, res: Response) => {
  // 1. Get pagination parameters from the query string (default to page 1, 50 items per page)
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  // 2. Calculate pagination boundaries
  const total = ACTIVE_BUILDINGS.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedBuildings = ACTIVE_BUILDINGS.slice(startIndex, endIndex);

  res.status(200).json({ buildings: paginatedBuildings, metadata: {
      status: 200,
      message: "Buildings retrieved successfully",
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

app.get('/api/buildings/active', (req: Request, res: Response) => {
  const active = ACTIVE_BUILDINGS[0];
  if (!active.bounds) return res.status(503).json({ metadata: { error: true, message: "Initializing" } });
  res.status(200).json({ building: active, metadata: { error: false } });
});

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

app.get('/api/sensors/by-buildings', (req: Request, res: Response) => {
  const idsParam = req.query.ids as string;
  if (!idsParam) {
    return res.status(200).json({ sensors: [] }); // Return empty if no buildings selected
  }
  
  const selectedBuildingIds = idsParam.split(',');
  const filteredSensors = sensors.filter(s => selectedBuildingIds.includes(s.buildingId));
  
  res.status(200).json({ sensors: filteredSensors, metadata: { error: false } });
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

// --- 5. WEBSOCKETS ---
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

// --- 6. ASYNC INITIALIZATION BOOTSTRAP ---
async function startServer() {
  console.log(`Fetching structural metadata for ${ACTIVE_BUILDINGS.length} models...`);

  await Promise.all(ACTIVE_BUILDINGS.map(async (bldg) => {
    try {
      const [rootResponse, layerResponse] = await Promise.all([
        fetch(`${bldg.modelUrl}?f=pjson`),
        fetch(`${bldg.modelUrl}/layers/0?f=pjson`).catch(() => null)
      ]);

      const rootData = await rootResponse.json();
      const layerData = layerResponse ? await layerResponse.json().catch(() => ({})) : {};
      
      let parsedExtent = null;

      const possibleExtents = [
        layerData?.fullExtent,
        layerData?.extent,
        rootData?.fullExtent,
        rootData?.initialExtent,
        rootData?.layers?.[0]?.fullExtent,
        rootData?.store?.extent,
        layerData?.store?.extent
      ];

      for (const ext of possibleExtents) {
        if (!ext) continue;

        if (ext.xmin !== undefined && ext.ymin !== undefined) {
          parsedExtent = {
            xmin: ext.xmin, xmax: ext.xmax,
            ymin: ext.ymin, ymax: ext.ymax,
            zmin: ext.zmin !== undefined ? ext.zmin : 0,
            zmax: ext.zmax !== undefined ? ext.zmax : 100
          };
          break;
        } else if (Array.isArray(ext) && ext.length >= 4) {
          parsedExtent = {
            xmin: ext[0], ymin: ext[1],
            xmax: ext[2], ymax: ext[3],
            zmin: ext.length >= 6 ? ext[4] : 0,
            zmax: ext.length >= 6 ? ext[5] : 100
          };
          break;
        }
      }

      if (parsedExtent) {
        let xmin = parsedExtent.xmin;
        let xmax = parsedExtent.xmax;
        let ymin = parsedExtent.ymin;
        let ymax = parsedExtent.ymax;

        // Convert Web Mercator (meters) to WGS84 (GPS Degrees)
        if (Math.abs(xmin) > 180) {
          const minLL = mercatorToLatLon(xmin, ymin);
          const maxLL = mercatorToLatLon(xmax, ymax);
          xmin = minLL.lon; ymin = minLL.lat;
          xmax = maxLL.lon; ymax = maxLL.lat;
        }

        bldg.bounds = {
          lonMin: xmin, lonMax: xmax,
          latMin: ymin, latMax: ymax,
          height: parsedExtent.zmax - parsedExtent.zmin || 50,
          groundElevation: parsedExtent.zmin
        };

        bldg.defaultCamera = {
          x: (xmin + xmax) / 2, 
          y: (ymin + ymax) / 2, // <-- FIX: Perfectly centered Latitude! (No longer shifting South)
          z: parsedExtent.zmax, 
          tilt: 70              // Slightly steeper tilt for a better architectural view
        };
        console.log(`✅ Synchronized: ${bldg.name}`);
      } else {
        console.log(`⚠️ Warning: Could not parse extent for ${bldg.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch data for ${bldg.name}:`, err);
    }
  }));

  buildSensors();
  
  const activeCount = ACTIVE_BUILDINGS.filter(b => b.bounds !== null).length;
  console.log(`✅ ${sensors.length} virtual sensors anchored across ${activeCount} active structures.`);

  server.listen(3001, () => {
    console.log('🚀 Smart Building API running on http://localhost:3001');
  });
}

startServer();



