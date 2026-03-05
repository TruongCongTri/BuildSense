import React from 'react';
import type { Sensor } from '../../../shared/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface SensorFilterMenuProps {
  sensorsByType: Record<string, Sensor[]>;
  alertingSensorIds: string[];
  typeFilters: Record<string, boolean>;
  toggleTypeFilter: (type: string) => void;
  expandedTypes: Record<string, boolean>;
  toggleExpandType: (type: string) => void;
  sensorFilters: Record<string, boolean>;
  toggleSensorFilter: (id: string) => void;
  onSensorLocate: (sensor: Sensor) => void;
}

export const SensorFilterMenu: React.FC<SensorFilterMenuProps> = ({
  sensorsByType,
  alertingSensorIds,
  typeFilters,
  toggleTypeFilter,
  expandedTypes,
  toggleExpandType,
  sensorFilters,
  toggleSensorFilter,
  onSensorLocate
}) => {
  return (
    <Card className="w-80 p-4 shadow-lg border-border">
      <h4 className="text-sm font-semibold mb-3 pb-2 border-b text-foreground">
        Sensor Checklist
      </h4>
      <ScrollArea className="h-[400px] pr-4">
        {Object.keys(sensorsByType).map(type => {
          const typeHasAlert = sensorsByType[type].some(s => alertingSensorIds.includes(s.id));
          
          return (
            <div key={type} className="mb-3">
              <div className="flex items-center justify-between font-medium text-sm">
                
                <div className={`flex items-center gap-3 ${typeHasAlert ? 'text-destructive' : 'text-foreground'}`}>
                  <Checkbox 
                    checked={typeFilters[type] || false} 
                    onCheckedChange={() => toggleTypeFilter(type)} 
                    className={`rounded-full ${typeHasAlert && 'border-destructive data-[state=checked]:bg-destructive'}`}
                  />
                  <span>{type}</span>
                </div>

                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => toggleExpandType(type)}>
                  {expandedTypes[type] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              {expandedTypes[type] && (
                <div className="pl-7 mt-2 flex flex-col gap-2 pb-2">
                  {sensorsByType[type].map(sensor => {
                    const hasAlert = alertingSensorIds.includes(sensor.id);
                    return (
                      <div key={sensor.id} className={`flex items-center justify-between text-sm p-1.5 rounded-md transition-colors ${hasAlert ? 'text-destructive font-medium bg-destructive/5' : 'text-muted-foreground hover:bg-muted/50'}`}>
                        <div className="flex items-center gap-3">
                          
                          <Checkbox 
                            checked={sensorFilters[sensor.id] || false} 
                            onCheckedChange={() => toggleSensorFilter(sensor.id)}
                            className={`rounded-full ${hasAlert && 'border-destructive data-[state=checked]:bg-destructive'}`}
                          />
                          
                          <span 
                            className="hover:text-primary hover:underline cursor-pointer transition-all"
                            onClick={() => onSensorLocate(sensor)}
                          >
                            {sensor.name}
                          </span>
                        </div>
                        
                        {hasAlert && (
                          <div className="flex items-center gap-1.5 pr-2" title="Active Alert">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                            </span>
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </ScrollArea>
    </Card>
  );
};