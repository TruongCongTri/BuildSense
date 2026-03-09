import express from "express";
import cors from "cors";
import http from "http";
import { MockSensor } from "../shared/types";
import { generateHistoricalData, generateLoadData, generateStrainData, generateTemperatureData } from "../shared/helpers";
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(cors());

const PORT = 3001;

// --- 2. THE HIGHWAY MODEL ---
const BUILDINGS = [
  {
    id: "hanoi-nguyenvanlinh-highway",
    name: "Nguyen Van Linh Highway (QL5)",
    modelUrl: "",
    coordinates: [105.9069, 21.0376], // Centers camera on the Flyover
  },
];

// --- 3. HARDCODED SENSOR PLACEMENTS (27 SENSORS) ---
const HWY = "hanoi-nguyenvanlinh-highway";

const SENSORS: MockSensor[] = [
  // ==========================================
  // 📍 WEST STRETCH (Near Savico Megamall) - Z: 15
  // ========================================== ,
  {
    id: "temp-west",
    buildingId: HWY,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "West Stretch - Surface Temp",
    location: "West Stretch",
    position: { x: 105.893558, y: 21.047632, z: 15 },
  },

  // Fiber Optic Strain Interrogator Nodes
  {
    id: "fiber-west-e2w",
    buildingId: HWY,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "West Inbound (E->W) Fiber Node",
    location: "West Stretch",
    position: { x: 105.893399, y: 21.048023, z: 15 },
  },
  {
    id: "fiber-west-w2e",
    buildingId: HWY,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "West Outbound (W->E) Fiber Node",
    location: "West Stretch",
    position: { x: 105.894268, y: 21.04615, z: 15 },
  },

  // E2W (Inbound) Load Sensors
  {
    id: "load-west-e2w-L1",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Inbound (E->W) - L1 Fast",
    location: "West Stretch",
    position: { x: 105.894559, y: 21.046035, z: 15 },
  },
  {
    id: "load-west-e2w-L2",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Inbound (E->W) - L2 Mixed",
    location: "West Stretch",
    position: { x: 105.894546, y: 21.046, z: 15 },
  },
  {
    id: "load-west-e2w-L3",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Inbound (E->W) - L3 Trucks",
    location: "West Stretch",
    position: { x: 105.894548, y: 21.045942, z: 15 },
  },

  // W2E (Outbound) Load Sensors
  {
    id: "load-west-w2e-L1",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Outbound (W->E) - L1 Fast",
    location: "West Stretch",
    position: { x: 105.893794, y: 21.04685, z: 15 },
  },
  {
    id: "load-west-w2e-L2",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Outbound (W->E) - L2 Mixed",
    location: "West Stretch",
    position: { x: 105.893841, y: 21.04683, z: 15 },
  },
  {
    id: "load-west-w2e-L3",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Outbound (W->E) - L3 Trucks",
    location: "West Stretch",
    position: { x: 105.893892, y: 21.0468, z: 15 },
  },

  // ==========================================
  // 📍 CENTER STRETCH (Chu Huy Man Flyover) - Z: 24 (Elevated)
  // ==========================================
  {
    id: "temp-center",
    buildingId: HWY,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "Center Flyover - Surface Temp",
    location: "Center Flyover",
    position: { x: 105.903286, y: 21.035291, z: 15 },
  },

  // Fiber Optic Strain Interrogator Nodes
  {
    id: "fiber-center-e2w",
    buildingId: HWY,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "Center Inbound (E->W) Fiber Node",
    location: "Center Flyover",
    position: { x: 105.903455, y: 21.035209, z: 15 },
  },
  {
    id: "fiber-center-w2e",
    buildingId: HWY,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "Center Outbound (W->E) Fiber Node",
    location: "Center Flyover",
    position: { x: 105.900097, y: 21.036637, z: 15 },
  },

  // E2W (Inbound) Load Sensors
  {
    id: "load-center-e2w-L1",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Inbound (E->W) - L1 Fast",
    location: "Center Flyover",
    position: { x: 105.903117, y: 21.035404, z: 15 },
  },
  {
    id: "load-center-e2w-L2",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Inbound (E->W) - L2 Mixed",
    location: "Center Flyover",
    position: { x: 105.903039, y: 21.035412, z: 15 },
  },
  {
    id: "load-center-e2w-L3",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Inbound (E->W) - L3 Trucks",
    location: "Center Flyover",
    position: { x: 105.902975, y: 21.035416, z: 15 },
  },

  // W2E (Outbound) Load Sensors
  {
    id: "load-center-w2e-L1",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Outbound (W->E) - L1 Fast",
    location: "Center Flyover",
    position: { x: 105.900689, y: 21.036332, z: 15 },
  },
  {
    id: "load-center-w2e-L2",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Outbound (W->E) - L2 Mixed",
    location: "Center Flyover",
    position: { x: 105.900755, y: 21.036332, z: 15 },
  },
  {
    id: "load-center-w2e-L3",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Outbound (W->E) - L3 Trucks",
    location: "Center Flyover",
    position: { x: 105.900831, y: 21.036325, z: 15 },
  },

  // ==========================================
  // 📍 EAST STRETCH (Near Thach Ban) - Z: 15
  // ==========================================
  {
    id: "temp-east",
    buildingId: HWY,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "East Stretch - Surface Temp",
    location: "East Stretch",
    position: { x: 105.912892, y: 21.030524, z: 15 },
  },

  // Fiber Optic Strain Interrogator Nodes
  {
    id: "fiber-east-e2w",
    buildingId: HWY,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "East Inbound (E->W) Fiber Node",
    location: "East Stretch",
    position: { x: 105.912166, y: 21.030851, z: 15 },
  },
  {
    id: "fiber-east-w2e",
    buildingId: HWY,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "East Outbound (W->E) Fiber Node",
    location: "East Stretch",
    position: { x: 105.912091, y: 21.03073, z: 15 },
  },

  // E2W (Inbound) Load Sensors
  {
    id: "load-east-e2w-L1",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Inbound (E->W) - L1 Fast",
    location: "East Stretch",
    position: { x: 105.913855, y: 21.030132, z: 15 },
  },
  {
    id: "load-east-e2w-L2",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Inbound (E->W) - L2 Mixed",
    location: "East Stretch",
    position: { x: 105.913882, y: 21.030093, z: 15 },
  },
  {
    id: "load-east-e2w-L3",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Inbound (E->W) - L3 Trucks",
    location: "East Stretch",
    position: { x: 105.913913, y: 21.030055, z: 15 },
  },

  // W2E (Outbound) Load Sensors
  {
    id: "load-east-w2e-L1",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Outbound (W->E) - L1 Fast",
    location: "East Stretch",
    position: { x: 105.913268, y: 21.030151, z: 15 },
  },
  {
    id: "load-east-w2e-L2",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Outbound (W->E) - L2 Mixed",
    location: "East Stretch",
    position: { x: 105.913244, y: 21.030187, z: 15 },
  },
  {
    id: "load-east-w2e-L3",
    buildingId: HWY,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Outbound (W->E) - L3 Trucks",
    location: "East Stretch",
    position: { x: 105.913209, y: 21.030231, z: 15 },
  },
];

// --- 6. EXPRESS REST ENDPOINTS ---
app.get("/api/buildings", (req, res) => res.json({ buildings: BUILDINGS }));
app.get("/api/sensors", (req, res) => res.json({ sensors: SENSORS }));
app.get("/api/sensors/by-buildings", (req, res) => {
  const ids = ((req.query.ids as string) || "").split(",");
  res.json({ sensors: SENSORS.filter((s) => ids.includes(s.buildingId)) });
});
app.get("/api/sensors/:id/data", (req, res) => {
  const { id } = req.params;
  const days = parseInt(req.query.days as string) || 7;
  const limit = parseInt(req.query.limit as string) || 500;

  const sensor = SENSORS.find((s) => s.id === id);
  if (!sensor) return res.status(404).json({ error: "Sensor not found" });

  res.json({
    metadata: { sensorId: id, totalRecords: limit, days },
    history: generateHistoricalData(sensor, days, limit),
  });
});

// --- LIVE WEBSOCKET SERVER ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🟢 Frontend Client connected to Live Sensor Stream!');
  ws.on('close', () => console.log('🔴 Client disconnected'));
});

// Broadcast Live Data every 2 seconds
setInterval(() => {
  const now = new Date();
  // Include seconds and milliseconds so the math curves move smoothly in real-time
  const timeInHours = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600);
  
  const liveValues: Record<string, { value: number }> = {};
  const alerts: Array<{ sensorId: string, type: string, message: string }> = [];

  SENSORS.forEach(sensor => {
    let baseValue = 0;

    // Use our realistic math helpers based on the exact current time
    if (sensor.type === "Temperature") baseValue = generateTemperatureData(sensor, timeInHours);
    else if (sensor.type === "Load") baseValue = generateLoadData(sensor, timeInHours);
    else if (sensor.type === "Strain") baseValue = generateStrainData(sensor, timeInHours);

    // Add high-frequency "jitter" so the numbers flicker realistically on the UI like a real sensor
    const jitter = (Math.random() - 0.5) * (sensor.type === "Strain" ? 15 : 0.8);
    const finalValue = Number((baseValue + jitter).toFixed(2));

    liveValues[sensor.id] = { value: finalValue };

    // AUTOMATIC ALERT GENERATION
    // If a heavy truck drives over (Load > 22 Tons) or Strain flexes too hard (> 150 με), trigger a live UI alert
    if (sensor.type === "Load" && finalValue > 22) {
      alerts.push({ sensorId: sensor.id, type: "Warning", message: "Overweight vehicle detected" });
    }
    if (sensor.type === "Strain" && finalValue > 150) {
      alerts.push({ sensorId: sensor.id, type: "Critical", message: "High structural strain" });
    }
  });

  // Package the payload. Make sure this format matches what your frontend `useWebSocket` hook expects!
  const payload = JSON.stringify({
    type: "LIVE_DATA", // Optional: depends on how useWebSocket parses it
    liveValues,
    alerts
  });

  // Broadcast to all connected viewers/investors
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

}, 2000); // 2000ms = Updates every 2 seconds

server.listen(PORT, () => {
  console.log(
    `🚀 Hanoi QL5 Highway Mock Server running on http://localhost:${PORT}`,
  );
  console.log(
    `📊 27 Hardcoded Sensors deployed across 3 stretched Highway Locations`,
  );
});
