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
  const health = liveData?.healthStatus || sensor.healthStatus;
  const admin = liveData?.adminStatus || sensor.adminStatus;
  const dataStat = liveData?.dataStatus || sensor.dataStatus;

  return (
    <Card 
      className="absolute z-50 w-56 p-3 shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-popover border-border text-popover-foreground transition-colors duration-200"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0">
          {getSensorIcon(sensor.type, 14, 'currentColor')}
        </div>
        <h4 className="text-[13px] font-semibold tracking-wide truncate text-foreground">
          {sensor.name}
        </h4>
      </div>
      
      <div className="flex flex-col gap-2 text-[12px] pt-2">
        
        {/* Hardware Health */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Hardware</span>
          {health === 'Offline' ? (
             <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase font-semibold px-2 py-0">Offline</Badge>
          ) : health === 'Warning' ? (
             <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase font-semibold px-2 py-0">Warning</Badge>
          ) : health === 'Error' ? (
             <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-semibold px-2 py-0">Error</Badge>
          ) : (
             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-semibold px-2 py-0">Healthy</Badge>
          )}
        </div>

        {/* Data Alerts (Only show if healthy & active) */}
        {health !== 'Offline' && admin !== 'Maintenance' && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Data Alert</span>
            {dataStat === 'Critical' ? (
               <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-semibold px-2 py-0">Critical</Badge>
            ) : dataStat === 'Warning' ? (
               <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase font-semibold px-2 py-0">Warning</Badge>
            ) : (
               <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-semibold px-2 py-0">Normal</Badge>
            )}
          </div>
        )}
        
        {liveData && health !== 'Offline' && admin !== 'Maintenance' && (
            <div className="flex justify-between items-center mt-1 border-t border-border/50 pt-2.5">
              <span className="text-muted-foreground">Live Reading</span> 
              <span className="font-mono font-bold text-foreground text-[13px]">
                {liveData.value} <span className="font-normal text-muted-foreground ml-0.5">{sensor.unit}</span>
              </span>
            </div>
        )}
      </div>

      <div className="absolute left-1/2 bottom-[-6px] transform -translate-x-1/2 w-3 h-3 bg-popover border-b border-r border-border rotate-45 transition-colors duration-200"></div>
    </Card>
  );
};