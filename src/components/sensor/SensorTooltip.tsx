import React from 'react';
import type { Sensor } from '../../../shared/types';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getSensorIcon } from '../../utils/iconMap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SensorTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  sensor: Sensor | null;
}

export const SensorTooltip: React.FC<SensorTooltipProps> = ({ visible, x, y, sensor }) => {
  const { liveValues } = useWebSocket();

  if (!visible || !sensor) return null;
  const liveData = liveValues[sensor.id];

  return (
    <Card 
      className="absolute z-50 w-56 p-3 shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-[#1A1D21] border-gray-700 text-white"
      style={{ left: x, top: y }}
    >
      {/* Top bar with Icon and Title */}
      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-500">
          {getSensorIcon(sensor.type, 14, 'currentColor')}
        </div>
        <h4 className="text-sm font-semibold tracking-wide truncate">
          {sensor.name}
        </h4>
      </div>
      
      {/* Key/Value Data */}
      <div className="flex flex-col gap-1.5 text-xs mt-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Status</span>
          {sensor.status === 'Warning' ? (
             <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] uppercase">Warn</Badge>
          ) : (
             <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] uppercase">OK</Badge>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Type</span>
          <span className="text-gray-300 font-medium">{sensor.type}</span>
        </div>
        
        {liveData && (
            <div className="flex justify-between items-center mt-1 border-t border-gray-800/50 pt-2">
              <span className="text-gray-500">Live Reading</span> 
              <span className="font-mono font-bold text-white text-sm">
                {liveData.value} <span className="text-xs font-normal text-gray-500">{sensor.unit}</span>
              </span>
            </div>
        )}
      </div>

      {/* Small pointer triangle pointing down at the marker */}
      <div className="absolute left-1/2 bottom-[-6px] transform -translate-x-1/2 w-3 h-3 bg-[#1A1D21] border-b border-r border-gray-700 rotate-45"></div>
    </Card>
  );
};