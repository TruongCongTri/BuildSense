import type { Sensor, HistoricalData } from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const SensorService = {
  // Fetch the layout and metadata for all sensors
  fetchAllSensors: async (): Promise<Sensor[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
      return [];
    }
  },

  // Fetch historical data for a specific sensor (for the drawer chart)
  fetchSensorHistory: async (sensorId: string, days: number = 7): Promise<HistoricalData[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/${sensorId}/data?days=${days}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch history for ${sensorId}:`, error);
      return [];
    }
  }
};