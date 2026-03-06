import React from 'react';
import type { Building } from '../../shared/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2 } from 'lucide-react';

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
    <Card className="w-80 p-4 shadow-lg border-border">
      <h4 className="text-sm font-semibold mb-3 pb-2 border-b text-foreground flex items-center gap-2">
        <Building2 className="w-4 h-4" /> Global Portfolio
      </h4>
      <ScrollArea className="h-[250px] pr-4">
        <div className="flex flex-col gap-2">
          {buildings.map((bldg) => (
            <div key={bldg.id} className="flex items-center justify-between text-sm p-1.5 rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={buildingFilters[bldg.id] ?? true} 
                  onCheckedChange={() => toggleBuildingFilter(bldg.id)}
                />
                <span 
                  className="hover:text-primary hover:underline cursor-pointer transition-all font-medium"
                  onClick={() => onBuildingLocate(bldg)}
                >
                  {bldg.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};