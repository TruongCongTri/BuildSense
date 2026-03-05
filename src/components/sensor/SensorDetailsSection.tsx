import React from 'react';
import type { Sensor } from '../../../shared/types';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Info } from 'lucide-react';

interface SensorDetailsSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export const SensorDetailsSection: React.FC<SensorDetailsSectionProps> = ({ sensor, isOpen, onToggle }) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="border-b">
      <div 
        className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 transition-colors cursor-pointer" 
        onClick={() => onToggle(!isOpen)}
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Info className="w-4 h-4 text-muted-foreground" /> Sensor Details
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        </Button>
      </div>
      <CollapsibleContent className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg border border-border/50">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase">Type</span>
            <span className="font-medium">{sensor.type}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase">Location</span>
            <span className="font-medium">{sensor.location || 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase">Manufacturer</span>
            <span className="font-medium">{sensor.manufacturer}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase">Status</span>
            <div>
              <Badge variant={sensor.status === 'Warning' ? 'destructive' : 'default'}>
                {sensor.status}
              </Badge>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};