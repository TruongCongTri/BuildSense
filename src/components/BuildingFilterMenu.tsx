import React from 'react';
import type { Building } from '../../shared/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, LocateFixed } from 'lucide-react';

interface BuildingFilterMenuProps {
  buildings: Building[];
  buildingFilters: Record<string, boolean>;
  toggleBuildingFilter: (id: string) => void;
  onBuildingLocate: (building: Building) => void;
}

export const BuildingFilterMenu: React.FC<BuildingFilterMenuProps> = ({
  buildings, buildingFilters, toggleBuildingFilter, onBuildingLocate
}) => {
  return (
    <Card className="w-80 shadow-2xl border-border bg-popover text-popover-foreground z-50 transition-colors duration-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/50 transition-colors duration-200">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" /> Global Portfolio
        </h4>
      </div>

      {/* Building List */}
      <ScrollArea className="h-[250px] p-2">
        <div className="flex flex-col gap-1">
          {buildings.map((bldg) => (
            <div 
              key={bldg.id} 
              className="flex items-center justify-between group p-2 rounded-md hover:bg-accent transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={buildingFilters[bldg.id] ?? true} 
                  onCheckedChange={() => toggleBuildingFilter(bldg.id)}
                />
                <span 
                  className="text-sm font-medium text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => onBuildingLocate(bldg)}
                >
                  {bldg.name}
                </span>
              </div>
              
              {/* Optional: Added the same Quick Locate button found in TopSearchBar for consistency */}
              <button 
                className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80 transition-opacity" 
                onClick={() => onBuildingLocate(bldg)}
                title="Locate Building"
              >
                <LocateFixed className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};