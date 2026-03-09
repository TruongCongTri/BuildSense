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
      <Button 
        onClick={onOpenDashboard} 
        className="shadow-lg h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200" 
        size="lg"
      >
        <BarChart3 className="mr-2 h-5 w-5" />
        Global Dashboard
      </Button>

      <div className="flex gap-2">
        {/* PORTFOLIO TOGGLE BUTTON */}
        <Button 
          variant="secondary" 
          onClick={onToggleBuildingMenu}
          className={`shadow-sm border transition-colors duration-200 ${
            isBuildingMenuOpen 
              ? 'bg-accent text-foreground border-primary' 
              : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
          }`}
        >
          <Globe className="mr-2 h-4 w-4" />
          Portfolio
        </Button>

        {/* SENSOR VISIBILITY TOGGLE */}
        <Button 
          variant="secondary" 
          onClick={onToggleGlobalVisibility}
          className={`shadow-sm border transition-colors duration-200 ${
            !isGlobalVisible 
              ? 'bg-accent text-foreground border-primary' 
              : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
          }`}
        >
          {isGlobalVisible ? (
            <><EyeOff className="mr-2 h-4 w-4" /> Hide Sensors</>
          ) : (
            <><Eye className="mr-2 h-4 w-4" /> Show Sensors</>
          )}
        </Button>
        
        {/* SENSOR FILTER MENU TOGGLE */}
        <Button 
          variant="secondary" 
          onClick={onToggleFilterMenu}
          className={`shadow-sm border transition-colors duration-200 ${
            isFilterMenuOpen 
              ? 'bg-accent text-foreground border-primary' 
              : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
          }`}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>
    </>
  );
};