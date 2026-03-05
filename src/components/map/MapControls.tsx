import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Settings2, BarChart3, Building2 } from 'lucide-react';

interface MapControlsProps {
  onOpenDashboard: () => void;
  showBuildingModel: boolean;
  onToggleBuildingModel: () => void;
  isGlobalVisible: boolean;
  onToggleGlobalVisibility: () => void;
  isFilterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onOpenDashboard,
  showBuildingModel,
  onToggleBuildingModel,
  isGlobalVisible,
  onToggleGlobalVisibility,
  isFilterMenuOpen,
  onToggleFilterMenu
}) => {
  return (
    <>
      <Button onClick={onOpenDashboard} className="shadow-md h-12 px-6" size="lg">
        <BarChart3 className="mr-2 h-5 w-5" />
        Global Dashboard
      </Button>

      <div className="flex gap-2">
        <Button 
          variant={showBuildingModel ? "secondary" : "default"} 
          onClick={onToggleBuildingModel}
          className="shadow-sm border border-border"
        >
          <Building2 className="mr-2 h-4 w-4" />
          {showBuildingModel ? 'Hide Building' : 'Show Building'}
        </Button>

        <Button 
          variant={isGlobalVisible ? "secondary" : "default"} 
          onClick={onToggleGlobalVisibility}
          className="shadow-sm border border-border"
        >
          {isGlobalVisible ? <><EyeOff className="mr-2 h-4 w-4" /> Hide Sensors</> : <><Eye className="mr-2 h-4 w-4" /> Show Sensors</>}
        </Button>
        
        <Button 
          variant={isFilterMenuOpen ? "default" : "secondary"} 
          onClick={onToggleFilterMenu}
          className="shadow-sm border border-border"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
    </>
  );
};