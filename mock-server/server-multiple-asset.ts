import express from "express";
import cors from "cors";
import http from "http";
import { Sensor } from "../shared/types";
import {
  generateHistoricalData,
  generateLoadData,
  generateStrainData,
  generateTemperatureData,
} from "../shared/helpers";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
app.use(cors());

const PORT = 3001;

// ==========================================
// 1. INFRASTRUCTURE & BUILDINGS (Add new roads/buildings here)
// ==========================================
const BUILDINGS = [
  {
    id: "hanoi-nguyenvanlinh-highway",
    name: "Nguyen Van Linh Highway (QL5)",
    modelUrl: "", // Add ArcGIS/3D model URL here
    coordinates: [105.9069, 21.0376],
    type: "highway",
  },
  {
    id: "hcmc-landmark-81",
    name: "Landmark 81 Tower",
    modelUrl: "",
    coordinates: [106.7218, 10.7946],
    type: "building",
  },
  {
    id: "danang-dragon-bridge",
    name: "Dragon Bridge",
    modelUrl: "",
    coordinates: [108.2268, 16.0611],
    type: "bridge",
  }
];

// ==========================================
// 2. SENSOR DEPLOYMENTS (Organized by Location)
// ==========================================

// --- ASSET A: Nguyen Van Linh Highway ---
const HWY_ID = "hanoi-nguyenvanlinh-highway";
const highwaySensors: Sensor[] = [
  // ==========================================
  // WEST STRETCH (Near Savico Megamall) - Z: 15
  // ========================================== ,
  {
    id: "temp-west",
    buildingId: HWY_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "West Stretch - Surface Temp",
    location: "West Stretch",
    position: { x: 105.893558, y: 21.047632, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Fiber Optic Strain Interrogator Nodes
  {
    id: "fiber-west-e2w",
    buildingId: HWY_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "West Inbound (E->W) Fiber Node",
    location: "West Stretch",
    position: { x: 105.893399, y: 21.048023, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "fiber-west-w2e",
    buildingId: HWY_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "West Outbound (W->E) Fiber Node",
    location: "West Stretch",
    position: { x: 105.894268, y: 21.04615, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // E2W (Inbound) Load Sensors
  {
    id: "load-west-e2w-L1",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Inbound (E->W) - L1 Fast",
    location: "West Stretch",
    position: { x: 105.894559, y: 21.046035, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-west-e2w-L2",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Inbound (E->W) - L2 Mixed",
    location: "West Stretch",
    position: { x: 105.894546, y: 21.046, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-west-e2w-L3",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Inbound (E->W) - L3 Trucks",
    location: "West Stretch",
    position: { x: 105.894548, y: 21.045942, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // W2E (Outbound) Load Sensors
  {
    id: "load-west-w2e-L1",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Outbound (W->E) - L1 Fast",
    location: "West Stretch",
    position: { x: 105.893794, y: 21.04685, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-west-w2e-L2",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Outbound (W->E) - L2 Mixed",
    location: "West Stretch",
    position: { x: 105.893841, y: 21.04683, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-west-w2e-L3",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "West Outbound (W->E) - L3 Trucks",
    location: "West Stretch",
    position: { x: 105.893892, y: 21.0468, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // ==========================================
  // CENTER STRETCH (Chu Huy Man Flyover) - Z: 24 (Elevated)
  // ==========================================
  {
    id: "temp-center",
    buildingId: HWY_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "Center Flyover - Surface Temp",
    location: "Center Flyover",
    position: { x: 105.903286, y: 21.035291, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Fiber Optic Strain Interrogator Nodes
  {
    id: "fiber-center-e2w",
    buildingId: HWY_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "Center Inbound (E->W) Fiber Node",
    location: "Center Flyover",
    position: { x: 105.903455, y: 21.035209, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "fiber-center-w2e",
    buildingId: HWY_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "Center Outbound (W->E) Fiber Node",
    location: "Center Flyover",
    position: { x: 105.900097, y: 21.036637, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // E2W (Inbound) Load Sensors
  {
    id: "load-center-e2w-L1",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Inbound (E->W) - L1 Fast",
    location: "Center Flyover",
    position: { x: 105.903117, y: 21.035404, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-center-e2w-L2",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Inbound (E->W) - L2 Mixed",
    location: "Center Flyover",
    position: { x: 105.903039, y: 21.035412, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-center-e2w-L3",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Inbound (E->W) - L3 Trucks",
    location: "Center Flyover",
    position: { x: 105.902975, y: 21.035416, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // W2E (Outbound) Load Sensors
  {
    id: "load-center-w2e-L1",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Outbound (W->E) - L1 Fast",
    location: "Center Flyover",
    position: { x: 105.900689, y: 21.036332, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-center-w2e-L2",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Outbound (W->E) - L2 Mixed",
    location: "Center Flyover",
    position: { x: 105.900755, y: 21.036332, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-center-w2e-L3",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Center Outbound (W->E) - L3 Trucks",
    location: "Center Flyover",
    position: { x: 105.900831, y: 21.036325, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // ==========================================
  // EAST STRETCH (Near Thach Ban) - Z: 15
  // ==========================================
  {
    id: "temp-east",
    buildingId: HWY_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "East Stretch - Surface Temp",
    location: "East Stretch",
    position: { x: 105.912892, y: 21.030524, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Fiber Optic Strain Interrogator Nodes
  {
    id: "fiber-east-e2w",
    buildingId: HWY_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "East Inbound (E->W) Fiber Node",
    location: "East Stretch",
    position: { x: 105.912166, y: 21.030851, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "fiber-east-w2e",
    buildingId: HWY_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "East Outbound (W->E) Fiber Node",
    location: "East Stretch",
    position: { x: 105.912091, y: 21.03073, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // E2W (Inbound) Load Sensors
  {
    id: "load-east-e2w-L1",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Inbound (E->W) - L1 Fast",
    location: "East Stretch",
    position: { x: 105.913855, y: 21.030132, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-east-e2w-L2",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Inbound (E->W) - L2 Mixed",
    location: "East Stretch",
    position: { x: 105.913882, y: 21.030093, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-east-e2w-L3",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Inbound (E->W) - L3 Trucks",
    location: "East Stretch",
    position: { x: 105.913913, y: 21.030055, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // W2E (Outbound) Load Sensors
  {
    id: "load-east-w2e-L1",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Outbound (W->E) - L1 Fast",
    location: "East Stretch",
    position: { x: 105.913268, y: 21.030151, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-east-w2e-L2",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Outbound (W->E) - L2 Mixed",
    location: "East Stretch",
    position: { x: 105.913244, y: 21.030187, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-east-w2e-L3",
    buildingId: HWY_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "East Outbound (W->E) - L3 Trucks",
    location: "East Stretch",
    position: { x: 105.913209, y: 21.030231, z: 15 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
];

// --- ASSET B: Landmark 81 Tower ---
const L81_ID = "hcmc-landmark-81";
const landmarkSensors: Sensor[] = [
  {
    id: "temp-l81-roof",
    buildingId: L81_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "Roof Ambient Temperature",
    location: "Level 81 Roof",
    position: { x: 106.7218, y: 10.7946, z: 461 }, // 461m high!
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "blue",
  },
  {
    id: "strain-l81-core",
    buildingId: L81_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "Core Pillar Strain",
    location: "Level 40 Core",
    position: { x: 106.7218, y: 10.7946, z: 200 },
    adminStatus: "Active",
    healthStatus: "Warning", // Let's simulate a starting warning
    dataStatus: "Normal",
    markerColor: "blue",
  }
];

// --- ASSET C: Dragon Bridge ---
const BRIDGE_ID = "danang-dragon-bridge";
const bridgeSensors: Sensor[] = [
  {
    id: "load-dragon-midspan",
    buildingId: BRIDGE_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Midspan Traffic Load",
    location: "Center Span",
    position: { x: 108.2268, y: 16.0611, z: 25 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  }
];

// ==========================================
// 3. MASTER SENSOR REGISTRY
// Combines all individual arrays into one global state
// ==========================================
const SENSORS: Sensor[] = [
  ...highwaySensors,
  ...landmarkSensors,
  ...bridgeSensors
];

// ==========================================
// 4. EXPRESS REST ENDPOINTS (Dynamically handles all arrays)
// ==========================================
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

// ==========================================
// 5. LIVE WEBSOCKET SERVER & CHAOS ENGINE
// Automatically loops through ALL sensors regardless of building
// ==========================================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("🟢 Frontend Client connected to Live Multi-Asset Stream!");
  ws.on("close", () => console.log("🔴 Client disconnected"));
});

// Chaos Engine: Simulates hardware wear and tear across all assets
setInterval(() => {
  SENSORS.forEach((sensor) => {
    if (Math.random() > 0.05) return;

    if (sensor.healthStatus !== "Healthy" || sensor.adminStatus !== "Active") {
      if (Math.random() > 0.6) {
        sensor.healthStatus = "Healthy";
        sensor.adminStatus = "Active";
        console.log(`🔧 REPAIRED: [${sensor.buildingId}] Sensor ${sensor.id} is back online.`);
      }
    } else {
      const problemType = Math.random();
      if (problemType < 0.4) {
        sensor.healthStatus = "Warning";
        console.log(`⚠️ DEGRADED: [${sensor.buildingId}] Sensor ${sensor.id} low battery.`);
      } else if (problemType < 0.7) {
        sensor.healthStatus = "Offline";
        console.log(`🔌 OFFLINE: [${sensor.buildingId}] Sensor ${sensor.id} dropped connection!`);
      } else {
        sensor.healthStatus = "Error";
        sensor.adminStatus = "Maintenance";
        console.log(`🚨 FAULT: [${sensor.buildingId}] Sensor ${sensor.id} hardware failure.`);
      }
    }
  });
}, 60000); 

// Broadcast Engine: Generates physics data for all assets
setInterval(() => {
  const now = new Date();
  const timeInHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const liveValues: Record<string, { value: number; dataStatus: string; healthStatus: string; adminStatus: string; }> = {};
  const alerts: Array<{ sensorId: string; buildingId: string; type: string; message: string }> = [];

  SENSORS.forEach((sensor) => {
    if (sensor.healthStatus === 'Offline' || sensor.adminStatus === 'Maintenance') {
      liveValues[sensor.id] = { 
        value: 0, 
        dataStatus: 'Normal',
        healthStatus: sensor.healthStatus,
        adminStatus: sensor.adminStatus 
      };
      return;
    }

    let baseValue = 0;
    if (sensor.type === "Temperature") baseValue = generateTemperatureData(sensor, timeInHours);
    else if (sensor.type === "Load") baseValue = generateLoadData(sensor, timeInHours, now);
    else if (sensor.type === "Strain") baseValue = generateStrainData(sensor, timeInHours, now);

    const jitter = (Math.random() - 0.5) * (sensor.type === "Strain" ? 15 : 0.8);
    const finalValue = Number((baseValue + jitter).toFixed(2));

    let currentDataStatus: "Normal" | "Warning" | "Critical" = "Normal";

    if (sensor.type === "Load" && finalValue > 22) {
      currentDataStatus = "Warning";
      alerts.push({ sensorId: sensor.id, buildingId: sensor.buildingId, type: "Warning", message: "Overweight vehicle detected" });
    }
    if (sensor.type === "Strain" && finalValue > 150) {
      currentDataStatus = "Critical";
      alerts.push({ sensorId: sensor.id, buildingId: sensor.buildingId, type: "Critical", message: "High structural strain" });
    }

    sensor.dataStatus = currentDataStatus;

    liveValues[sensor.id] = {
      value: finalValue,
      dataStatus: currentDataStatus,
      healthStatus: sensor.healthStatus,
      adminStatus: sensor.adminStatus,
    };
  });

  const payload = JSON.stringify({ type: "LIVE_DATA", liveValues, alerts });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}, 2000); 

server.listen(PORT, () => {
  console.log(`🚀 Multi-Asset Mock Server running on http://localhost:${PORT}`);
  console.log(`📊 Tracking ${SENSORS.length} sensors across ${BUILDINGS.length} infrastructures.`);
});