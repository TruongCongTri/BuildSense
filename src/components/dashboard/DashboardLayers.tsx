import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, WifiOff, Wrench } from 'lucide-react';
import type { Sensor } from '../../../shared/types';

interface DashboardLayersProps {
  sensorsOfSelectedType: Sensor[];
  alertingSensorIds: string[];
  visibleSensors: Record<string, boolean>;
  toggleSensorVisibility: (id: string) => void;
  sensorColors: string[];
}

export const DashboardLayers: React.FC<DashboardLayersProps> = ({
  sensorsOfSelectedType, alertingSensorIds, visibleSensors, toggleSensorVisibility, sensorColors
}) => {
  return (
    <Card className="col-span-3 lg:col-span-2 flex flex-col bg-card border-border transition-colors duration-200 shadow-md rounded-xl">
      <CardHeader className="border-b border-border/50 pb-6 pt-6">
        <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Active Data Layers</CardTitle>
        <CardDescription className="text-muted-foreground text-[13px] mt-1">Toggle sensors on the chart</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[400px] px-6 pt-4 pb-6">
          <div className="flex flex-col gap-2">
            {sensorsOfSelectedType.map((sensor, idx) => {
              const hasAlert = alertingSensorIds.includes(sensor.id);
              const isOffline = sensor.healthStatus === 'Offline' || sensor.healthStatus === 'Error';
              const isMaintenance = sensor.adminStatus === 'Maintenance';

              return (
                <div key={sensor.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors duration-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Checkbox 
                      checked={visibleSensors[sensor.id] || false} 
                      onCheckedChange={() => toggleSensorVisibility(sensor.id)}
                    />
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sensorColors[idx % sensorColors.length] }} />
                    <div className="truncate text-sm font-medium text-foreground">{sensor.name}</div>
                  </div>
                  {isMaintenance && (
                      <span title="In Maintenance" className="flex items-center">
                        <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
                      </span>
                    )}
                    {isOffline && !isMaintenance && (
                      <span title="Offline" className="flex items-center">
                        <WifiOff className="w-4 h-4 text-slate-500 shrink-0" />
                      </span>
                    )}
                  {hasAlert && (
                    <div className="flex items-center gap-2" title="Active Alert">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                      </span>
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};