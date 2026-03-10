import React from 'react';
import type { Sensor } from '../../../shared/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface SensorDetailsSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export const SensorDetailsSection: React.FC<SensorDetailsSectionProps> = ({ sensor, isOpen, onToggle }) => {
  return (
    <Card className="overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
      <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
        {/* Dynamic border-b: only shows the line when the section is expanded */}
        <CollapsibleTrigger 
          className={`w-full flex items-center justify-between p-4 hover:bg-accent transition-colors focus:outline-none ${
            isOpen ? 'border-b border-border/50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1 bg-primary/10 rounded-full">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Sensor Metadata</h3>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-muted-foreground">ID</span>
              <span className="text-foreground font-medium">{sensor.id.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Location</span>
              <span className="text-foreground">{sensor.location || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="text-foreground">{sensor.type}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Admin Status</span>
              <span className="text-foreground">{sensor.adminStatus}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Network Health</span>
              <span className="text-foreground">{sensor.healthStatus}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Manufacturer</span>
              <span className="text-foreground">{sensor.manufacturer}</span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};