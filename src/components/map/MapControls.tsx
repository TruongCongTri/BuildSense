import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Settings2, BarChart3, Globe } from 'lucide-react';

interface MapControlsProps {
  onOpenDashboard: () => void;
  isGlobalVisible: boolean;
  onToggleGlobalVisibility: () => void;
  isFilterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
  isBuildingMenuOpen: boolean;
  onToggleBuildingMenu: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onOpenDashboard, 
  isGlobalVisible, 
  onToggleGlobalVisibility,
  isFilterMenuOpen, 
  onToggleFilterMenu,
  isBuildingMenuOpen, 
  onToggleBuildingMenu
}) => {
  return (
    <>
      <Button onClick={onOpenDashboard} className="shadow-md h-12 px-6" size="lg">
        <BarChart3 className="mr-2 h-5 w-5" />
        Global Dashboard
      </Button>

      <div className="flex gap-2">
        {/* PORTFOLIO TOGGLE BUTTON */}
        <Button 
          variant={isBuildingMenuOpen ? "default" : "secondary"} 
          onClick={onToggleBuildingMenu}
          className="shadow-sm border border-border"
        >
          <Globe className="mr-2 h-4 w-4" />
          Portfolio
        </Button>

        {/* SENSOR VISIBILITY TOGGLE */}
        <Button 
          variant={isGlobalVisible ? "secondary" : "default"} 
          onClick={onToggleGlobalVisibility}
          className="shadow-sm border border-border"
        >
          {isGlobalVisible ? (
            <><EyeOff className="mr-2 h-4 w-4" /> Hide Sensors</>
          ) : (
            <><Eye className="mr-2 h-4 w-4" /> Show Sensors</>
          )}
        </Button>
        
        {/* SENSOR FILTER MENU TOGGLE */}
        <Button 
          variant={isFilterMenuOpen ? "default" : "secondary"} 
          onClick={onToggleFilterMenu}
          className="shadow-sm border border-border"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>
    </>
  );
};