
// --- 4. DATA GENERATION HELPERS ---

import { MockSensor } from "./types";

// A. TEMPERATURE HELPER
export function generateTemperatureData(sensor: MockSensor, timeInHours: number): number {
  const baseTemp = 29.5 - 5.5 * Math.cos(((timeInHours - 14) / 24) * 2 * Math.PI);
  const isOverpass = sensor.id.includes("center");
  
  // Overpasses freeze faster at night, asphalt retains heat longer into the evening
  const multiplier = (timeInHours >= 10 && timeInHours <= 16) ? (isOverpass ? 1.2 : 1.4) : (isOverpass ? 0.9 : 1.05);
  return baseTemp * multiplier + (Math.random() * 1.5);
}

// B. LOAD HELPER
export function generateLoadData(sensor: MockSensor, timeInHours: number): number {
  const isMorningRush = timeInHours >= 7 && timeInHours <= 9.5;
  const isEveningRush = timeInHours >= 16.5 && timeInHours <= 19;
  const isNightTrucks = timeInHours >= 22 || timeInHours <= 4; 

  const isE2W = sensor.id.includes('e2w');
  const lane = sensor.id.includes('L1') ? 1 : sensor.id.includes('L2') ? 2 : 3;

  let baseTraffic = 0;

  // Traffic Direction Logic (Inbound vs Outbound)
  if (isMorningRush) baseTraffic = isE2W ? 2.5 : 0.8; // E2W inbound to Hanoi is packed in the morning
  else if (isEveningRush) baseTraffic = isE2W ? 1.0 : 2.5; // W2E outbound to Hai Phong is packed in evening
  else if (isNightTrucks) baseTraffic = 0.5; // Sparse traffic overall, but heavy individuals
  else baseTraffic = 1.0; // Normal mid-day

  // Lane Weight Logic
  if (lane === 1) {
    // Fast lane: Cars only (1-2 tons). Steady but low weight.
    return baseTraffic * (1.5 + Math.random() * 0.5);
  } else if (lane === 2) {
    // Middle lane: Mixed SUVs, light trucks (3-8 tons)
    return baseTraffic * (4.0 + Math.random() * 3.0);
  } else {
    // Outer lane (L3): Massive containers/logistics (15-40 tons)
    if (isNightTrucks) {
      // Nighttime: Container trucks allowed into the city. Massive spikes.
      return 25.0 + Math.random() * 15.0; 
    } else {
      // Daytime: Only light delivery trucks allowed
      return baseTraffic * (8.0 + Math.random() * 4.0);
    }
  }
}

// C. FIBER OPTIC STRAIN HELPER
export function generateStrainData(sensor: MockSensor, timeInHours: number): number {
  // Strain is a combination of Structural Flexing (from heavy trucks) and Thermal Expansion
  const isOverpass = sensor.id.includes("center");
  
  // Base strain of the concrete/asphalt segment
  const baseStrain = isOverpass ? 250 : 120; 

  // Thermal effect: Expands at noon, causing strain to drop or shift
  const thermalStrain = 30 * Math.sin(((timeInHours - 6) / 24) * 2 * Math.PI);

  // Traffic effect: Spikes when heavy trucks drive over the segment (Lane 3 at night)
  const isNightTrucks = timeInHours >= 22 || timeInHours <= 4;
  const trafficSpike = isNightTrucks ? Math.random() * 80 : Math.random() * 20;

  return baseStrain + thermalStrain + trafficSpike;
}

// --- 5. MAIN DATA GENERATOR ---
export function generateHistoricalData(sensor: MockSensor, days: number, limit: number) {
  const history = [];
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000; // 15 min intervals
  const totalPoints = Math.min(limit, (days * 24 * 60 * 60 * 1000) / intervalMs);

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = now - (i * intervalMs);
    const date = new Date(timestamp);
    const timeInHours = date.getHours() + (date.getMinutes() / 60);
    
    let value = 0;

    // Route to the appropriate helper based on sensor type
    if (sensor.type === "Temperature") {
      value = generateTemperatureData(sensor, timeInHours);
    } else if (sensor.type === "Load") {
      value = generateLoadData(sensor, timeInHours);
    } else if (sensor.type === "Strain") {
      value = generateStrainData(sensor, timeInHours);
    }

    history.push({ timestamp, value: Number(value.toFixed(2)) });
  }

  // Ensure chronological order for charts
  return history.reverse(); 
}