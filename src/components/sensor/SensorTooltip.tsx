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
      className="absolute z-50 w-56 p-3 shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-popover border-border text-popover-foreground transition-colors duration-200"
      style={{ left: x, top: y }}
    >
      {/* Top bar with Icon and Title */}
      <div className="flex items-center gap-3 border-b border-border">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0">
          {getSensorIcon(sensor.type, 14, 'currentColor')}
        </div>
        <h4 className="text-[13px] font-semibold tracking-wide truncate text-foreground">
          {sensor.name}
        </h4>
      </div>
      
      {/* Key/Value Data */}
      <div className="flex flex-col gap-2 text-[12px]">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status</span>
          {sensor.status === 'Warning' ? (
             <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-semibold px-2 py-0">Warn</Badge>
          ) : (
             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-semibold px-2 py-0">OK</Badge>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Type</span>
          <span className="text-foreground font-medium">{sensor.type}</span>
        </div>
        
        {liveData && (
            <div className="flex justify-between items-center mt-1 border-t border-border/50 pt-2.5">
              <span className="text-muted-foreground">Live Reading</span> 
              <span className="font-mono font-bold text-foreground text-[13px]">
                {liveData.value} <span className="font-normal text-muted-foreground ml-0.5">{sensor.unit}</span>
              </span>
            </div>
        )}
      </div>

      {/* Small pointer triangle pointing down at the marker */}
      <div className="absolute left-1/2 bottom-[-6px] transform -translate-x-1/2 w-3 h-3 bg-popover border-b border-r border-border rotate-45 transition-colors duration-200"></div>
    </Card>
  );
};