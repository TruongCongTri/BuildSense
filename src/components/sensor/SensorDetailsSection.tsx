import React from 'react';
import type { Sensor } from '../../../shared/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface SensorDetailsSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export const SensorDetailsSection: React.FC<SensorDetailsSectionProps> = ({ sensor, isOpen, onToggle }) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="bg-[#1A1D21] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-white/5 transition-colors focus:outline-none">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-blue-500/10 rounded-full">
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-white">Sensor Metadata</h3>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="p-4 space-y-3">
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-gray-500">ID</span>
          <span className="text-gray-200 font-medium">{sensor.id.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Location</span>
          <span className="text-gray-200">{sensor.location || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Type</span>
          <span className="text-gray-200">{sensor.type}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Manufacturer</span>
          <span className="text-gray-200">{sensor.manufacturer}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};