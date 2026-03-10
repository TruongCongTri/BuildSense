import React from 'react';
import { Activity, AlertCircle, WifiOff, Wrench } from 'lucide-react';
import type { Sensor } from '../../../shared/types';
import { Card, CardContent } from '../ui/card';

interface SensorLiveReadingSectionProps {
  sensor: Sensor;
  displayValue: number | null;
  healthStatus: string;
  adminStatus: string;
  dataStatus: string;
}

export const SensorLiveReadingSection: React.FC<SensorLiveReadingSectionProps> = ({
  sensor,
  displayValue,
  healthStatus,
  adminStatus,
  dataStatus
}) => {
  // Determine UI state based on priority of statuses
  let badgeText = "NORMAL";
  let StatusIcon = Activity;
  let colorClass = "bg-green-500/10 text-green-600 border-green-500/20";
  let dotClass = "bg-green-500";
  let pingClass = "bg-green-400";
  let glowClass = "bg-primary";

  if (adminStatus === 'Maintenance') {
    badgeText = "MAINTENANCE";
    StatusIcon = Wrench;
    colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    dotClass = "bg-amber-500"; pingClass = "hidden"; glowClass = "bg-amber-500";
  } else if (healthStatus === 'Offline' || healthStatus === 'Error') {
    badgeText = healthStatus.toUpperCase();
    StatusIcon = WifiOff;
    colorClass = "bg-slate-500/10 text-slate-500 border-slate-500/20";
    dotClass = "bg-slate-500"; pingClass = "hidden"; glowClass = "bg-slate-500";
  } else if (dataStatus === 'Critical') {
    badgeText = "CRITICAL ALERT";
    StatusIcon = AlertCircle;
    colorClass = "bg-destructive/10 text-destructive border-destructive/20";
    dotClass = "bg-destructive"; pingClass = "bg-destructive"; glowClass = "bg-destructive";
  } else if (dataStatus === 'Warning') {
    badgeText = "WARNING";
    StatusIcon = AlertCircle;
    colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    dotClass = "bg-amber-500"; pingClass = "bg-amber-400"; glowClass = "bg-amber-500";
  }

  const isOffline = healthStatus === 'Offline' || adminStatus === 'Maintenance';

  return (
    <Card className="relative overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
      <CardContent className="p-5 flex items-center justify-between">
        
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${glowClass}`}></div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingClass}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotClass}`}></span>
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Reading</span>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-extrabold tracking-tight tabular-nums ${isOffline ? 'text-muted-foreground/50' : 'text-foreground'}`}>
              {isOffline ? '--' : (displayValue !== null ? displayValue.toFixed(2) : "...")}
            </span>
            {!isOffline && (
              <span className="text-lg font-medium text-muted-foreground ml-1">
                {sensor.unit}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {badgeText}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
};