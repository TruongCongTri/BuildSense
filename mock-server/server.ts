import express from "express";
import "dotenv/config";
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
    id: "hcmc-conghoa-street",
    name: "Cong Hoa Street",
    modelUrl: "",
    coordinates: [106.64793660009003, 10.801986328115923],
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
  },
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
  },
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
  },
];

// --- ASSET D: Cộng Hoà Street ---
const CH_ID = "hcmc-conghoa-street";
const congHoaSensors: Sensor[] = [
  // ==========================================
  // LOCATION 1: Near Hoang Van Thu Park (Start)
  // ==========================================
  {
    id: "temp-ch-hvt",
    buildingId: CH_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "HVT Park - Surface Temp",
    location: "HVT Park Intersection",
    position: { x: 106.65751367605625, y: 10.801054782558227, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "strain-ch-hvt",
    buildingId: CH_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "HVT Park - Surface Strain",
    location: "HVT Park Intersection",
    position: { x: 106.65815860690002, y: 10.80099609785462, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Inbound (Towards Truong Chinh)
  {
    id: "load-ch-hvt-in-car",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HVT Inbound - L1 (Car Only)",
    location: "HVT Park Intersection",
    position: { x: 106.65906514304105, y: 10.800967435660228, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-hvt-in-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HVT Inbound - L2 (Mixed)",
    location: "HVT Park Intersection",
    position: { x: 106.65907855408554, y: 10.800987195843444, z: 10 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-hvt-in-moto",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HVT Inbound - L3 (2-3 Wheels)",
    location: "HVT Park Intersection",
    position: { x: 106.65939773694454, y: 10.80098126778861, z: 10 },  
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Outbound (Towards Airport/Center)
  {
    id: "load-ch-hvt-out-car",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HVT Outbound - L1 (Car Only)",
    location: "HVT Park Intersection",
    position: { x: 106.6585306981998, y: 10.800948407419524, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-hvt-out-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HVT Outbound - L2 (Mixed)",
    location: "HVT Park Intersection",
    position: { x: 106.65817579480976, y: 10.800934080734965, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-hvt-out-moto",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HVT Outbound - L3 (2-3 Wheels)",
    location: "HVT Park Intersection",
    position: { x: 106.65775159085644, y: 10.800922504585097, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // ==========================================
  // LOCATION 2: Hoang Hoa Tham Overpass
  // ==========================================
  {
    id: "temp-ch-hht",
    buildingId: CH_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "HHT Overpass - Temp",
    location: "HHT Overpass",
    position: { x: 106.6474713841709, y: 10.80191968142021, z: 20 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },
  {
    id: "strain-ch-hht",
    buildingId: CH_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "HHT Overpass - Structural Strain",
    location: "HHT Overpass",
    position: { x: 106.64701608106398, y: 10.801950525252352, z: 20 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },

  // ON THE BRIDGE (2 Lanes total - 1 each side, Mixed)
  {
    id: "load-ch-hht-bridge-in-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HHT Bridge Inbound (Mixed)",
    location: "HHT Overpass (Top)",
    position: { x: 106.64770825839408, y: 10.80191688675322, z: 20 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },
  {
    id: "load-ch-hht-bridge-out-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HHT Bridge Outbound (Mixed)",
    location: "HHT Overpass (Top)",
    position: { x: 106.64709282231607, y: 10.801931700235412, z: 20 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },

  // BENEATH THE BRIDGE (4 Lanes total - 2 each side: Mix & Moto)
  {
    id: "load-ch-hht-under-in-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HHT Under Inbound - L1 (Mixed)",
    location: "HHT Overpass (Under)",
    position: { x: 106.64765511688908, y: 10.801969086639572, z: 10 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },
  {
    id: "load-ch-hht-under-in-moto",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HHT Under Inbound - L2 (2-3 Wheels)",
    location: "HHT Overpass (Under)",
    position: { x: 106.6479035893313, y: 10.80197543527378, z: 10 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },
  {
    id: "load-ch-hht-under-out-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HHT Under Outbound - L1 (Mixed)",
    location: "HHT Overpass (Under)",
    position: { x: 106.64641259749753, y: 10.801952254028127, z: 10 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },
  {
    id: "load-ch-hht-under-out-moto",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "HHT Under Outbound - L2 (2-3 Wheels)",
    location: "HHT Overpass (Under)",
    position: { x: 106.64639930708455, y: 10.801915265089606, z: 10 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "orange",
  },

  // ==========================================
  // LOCATION 3: End of Airport (Towards Truong Chinh)
  // ==========================================
  {
    id: "temp-ch-end",
    buildingId: CH_ID,
    type: "Temperature",
    manufacturer: "ThermoTech",
    paradigm: "websocket",
    unit: "°C",
    name: "Airport End - Surface Temp",
    location: "Airport End Stretch",
    position: { x: 106.63647110087875, y: 10.805779186069744, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "strain-ch-end",
    buildingId: CH_ID,
    type: "Strain",
    manufacturer: "OptiSense Fiber",
    paradigm: "websocket",
    unit: "με",
    name: "Airport End - Surface Strain",
    location: "Airport End Stretch",
    position: { x: 106.63652711728078, y: 10.805708751359253, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Inbound
  {
    id: "load-ch-end-in-car",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Airport End Inbound - L1 (Car Only)",
    location: "Airport End Stretch",
    position: { x: 106.63647587703, y: 10.80571489352651, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-end-in-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Airport End Inbound - L2 (Mixed)",
    location: "Airport End Stretch",
    position: { x: 106.63643689040454, y: 10.805729419343715, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-end-in-moto",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Airport End Inbound - L3 (2-3 Wheels)",
    location: "Airport End Stretch",
    position: { x: 106.63637773828313, y: 10.805769695469566, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },

  // Outbound
  {
    id: "load-ch-end-out-car",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Airport End Outbound - L1 (Car Only)",
    location: "Airport End Stretch",
    position: { x: 106.63645436716766, y: 10.805868074836212, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-end-out-mix",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Airport End Outbound - L2 (Mixed)",
    location: "Airport End Stretch",
    position: { x: 106.6365323404186, y: 10.805799407362219, z: 10 },
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
  {
    id: "load-ch-end-out-moto",
    buildingId: CH_ID,
    type: "Load",
    manufacturer: "WeightDynamics",
    paradigm: "websocket",
    unit: "T",
    name: "Airport End Outbound - L3 (2-3 Wheels)",
    location: "Airport End Stretch",
    position: { x: 106.63653363900808, y: 10.80593766926372, z: 10 }, 
    adminStatus: "Active",
    healthStatus: "Healthy",
    dataStatus: "Normal",
    markerColor: "darkGrey",
  },
];

// ==========================================
// 3. MASTER SENSOR REGISTRY
// Combines all individual arrays into one global state
// ==========================================
const SENSORS: Sensor[] = [
  ...highwaySensors,
  ...congHoaSensors,
  ...landmarkSensors,
  ...bridgeSensors,
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
        console.log(
          `🔧 REPAIRED: [${sensor.buildingId}] Sensor ${sensor.id} is back online.`,
        );
      }
    } else {
      const problemType = Math.random();
      if (problemType < 0.4) {
        sensor.healthStatus = "Warning";
        console.log(
          `⚠️ DEGRADED: [${sensor.buildingId}] Sensor ${sensor.id} low battery.`,
        );
      } else if (problemType < 0.7) {
        sensor.healthStatus = "Offline";
        console.log(
          `🔌 OFFLINE: [${sensor.buildingId}] Sensor ${sensor.id} dropped connection!`,
        );
      } else {
        sensor.healthStatus = "Error";
        sensor.adminStatus = "Maintenance";
        console.log(
          `🚨 FAULT: [${sensor.buildingId}] Sensor ${sensor.id} hardware failure.`,
        );
      }
    }
  });
}, 60000);

// Broadcast Engine: Generates physics data for all assets
setInterval(() => {
  const now = new Date();
  const timeInHours =
    now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const liveValues: Record<
    string,
    {
      value: number;
      dataStatus: string;
      healthStatus: string;
      adminStatus: string;
    }
  > = {};
  const alerts: Array<{
    sensorId: string;
    buildingId: string;
    type: string;
    message: string;
  }> = [];

  SENSORS.forEach((sensor) => {
    if (
      sensor.healthStatus === "Offline" ||
      sensor.adminStatus === "Maintenance"
    ) {
      liveValues[sensor.id] = {
        value: 0,
        dataStatus: "Normal",
        healthStatus: sensor.healthStatus,
        adminStatus: sensor.adminStatus,
      };
      return;
    }

    let baseValue = 0;
    if (sensor.type === "Temperature")
      baseValue = generateTemperatureData(sensor, timeInHours);
    else if (sensor.type === "Load")
      baseValue = generateLoadData(sensor, timeInHours, now);
    else if (sensor.type === "Strain")
      baseValue = generateStrainData(sensor, timeInHours, now);

    const jitter =
      (Math.random() - 0.5) * (sensor.type === "Strain" ? 15 : 0.8);
    const finalValue = Number((baseValue + jitter).toFixed(2));

    let currentDataStatus: "Normal" | "Warning" | "Critical" = "Normal";

    if (sensor.type === "Load" && finalValue > 22) {
      currentDataStatus = "Warning";
      alerts.push({
        sensorId: sensor.id,
        buildingId: sensor.buildingId,
        type: "Warning",
        message: "Overweight vehicle detected",
      });
    }
    if (sensor.type === "Strain" && finalValue > 150) {
      currentDataStatus = "Critical";
      alerts.push({
        sensorId: sensor.id,
        buildingId: sensor.buildingId,
        type: "Critical",
        message: "High structural strain",
      });
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(
    `🚀 Multi-Asset Mock Server running on http://localhost:${process.env.PORT}`,
  );
  console.log(
    `📊 Tracking ${SENSORS.length} sensors across ${BUILDINGS.length} infrastructures.`,
  );
});
