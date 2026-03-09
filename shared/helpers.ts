// --- 4. DATA GENERATION HELPERS ---

import { MockSensor } from "./types";

// A. TEMPERATURE HELPER (Temp stays roughly the same regardless of day)
export function generateTemperatureData(sensor: MockSensor, timeInHours: number): number {
  const baseTemp = 29.5 - 5.5 * Math.cos(((timeInHours - 14) / 24) * 2 * Math.PI);
  const isOverpass = sensor.id.includes("center");
  
  const multiplier = (timeInHours >= 10 && timeInHours <= 16) ? (isOverpass ? 1.2 : 1.4) : (isOverpass ? 0.9 : 1.05);
  return baseTemp * multiplier + (Math.random() * 1.5);
}

// 🌟 B. LOAD HELPER (Now completely changes based on Weekends vs Weekdays!)
export function generateLoadData(sensor: MockSensor, timeInHours: number, date: Date): number {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
  
  const isMorningRush = timeInHours >= 7 && timeInHours <= 9.5;
  const isEveningRush = timeInHours >= 16.5 && timeInHours <= 19;
  const isNightTrucks = timeInHours >= 22 || timeInHours <= 4; 

  const isE2W = sensor.id.includes('e2w');
  const lane = sensor.id.includes('L1') ? 1 : sensor.id.includes('L2') ? 2 : 3;

  let baseTraffic = 0;

  // Traffic Volume shifts drastically on weekends
  if (isWeekend) {
    baseTraffic = 0.6; // No dense commuter rush hour, just steady light traffic
  } else {
    if (isMorningRush) baseTraffic = isE2W ? 2.5 : 0.8; 
    else if (isEveningRush) baseTraffic = isE2W ? 1.0 : 2.5; 
    else if (isNightTrucks) baseTraffic = 0.5; 
    else baseTraffic = 1.0; 
  }

  // Lane 1 & 2 (Cars / SUVs)
  if (lane === 1) return baseTraffic * (1.5 + Math.random() * 0.5);
  if (lane === 2) return baseTraffic * (4.0 + Math.random() * 3.0);
  
  // Lane 3 (Heavy Trucks)
  if (isNightTrucks || isWeekend) {
    // Trucks are allowed during the day on Weekends! Massive spikes.
    return 25.0 + Math.random() * 15.0; 
  } else {
    return baseTraffic * (8.0 + Math.random() * 4.0);
  }
}

// 🌟 C. FIBER OPTIC STRAIN HELPER
export function generateStrainData(sensor: MockSensor, timeInHours: number, date: Date): number {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isOverpass = sensor.id.includes("center");
  
  const baseStrain = isOverpass ? 250 : 120; 
  const thermalStrain = 30 * Math.sin(((timeInHours - 6) / 24) * 2 * Math.PI);

  const isNightTrucks = timeInHours >= 22 || timeInHours <= 4;
  // Road takes a beating all day on weekends due to truck access
  const trafficSpike = (isNightTrucks || isWeekend) ? Math.random() * 80 : Math.random() * 20;

  return baseStrain + thermalStrain + trafficSpike;
}

// --- 5. MAIN DATA GENERATOR ---
export function generateHistoricalData(sensor: MockSensor, days: number, limit: number) {
  const history = [];
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000; 
  const totalPoints = Math.min(limit, (days * 24 * 60 * 60 * 1000) / intervalMs);

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = now - (i * intervalMs);
    const date = new Date(timestamp);
    const timeInHours = date.getHours() + (date.getMinutes() / 60);
    
    let value = 0;

    if (sensor.type === "Temperature") {
      value = generateTemperatureData(sensor, timeInHours);
    } else if (sensor.type === "Load") {
      value = generateLoadData(sensor, timeInHours, date); // Pass Date
    } else if (sensor.type === "Strain") {
      value = generateStrainData(sensor, timeInHours, date); // Pass Date
    }

    history.push({ timestamp, value: Number(value.toFixed(2)) });
  }

  return history.reverse(); 
}