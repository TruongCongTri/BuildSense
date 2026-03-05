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
      className="absolute z-50 w-64 p-4 shadow-lg pointer-events-none -translate-y-1/2"
      style={{ top: `${y}px`, left: `${x + 20}px` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          sensor.markerColor === 'red' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
        }`}>
          {getSensorIcon(sensor.type, 16, 'currentColor')}
        </div>
        <strong className="text-sm font-semibold">{sensor.name}</strong>
      </div>
      
      {/* Body */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs font-medium uppercase">Type</span> 
          <span className="font-medium">{sensor.type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs font-medium uppercase">Location</span> 
          <span className="font-medium">{sensor.location || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-muted-foreground text-xs font-medium uppercase">Status</span> 
          <Badge variant={sensor.status === 'Warning' ? 'destructive' : 'secondary'}>
            {sensor.status}
          </Badge>
        </div>
        
        {/* Live Data */}
        {liveData && (
          <>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs font-medium uppercase">Live Value</span> 
              <span className="font-mono font-bold text-primary">
                {liveData.value} <span className="text-xs font-normal text-muted-foreground">{sensor.unit}</span>
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};