import React from 'react';
import { Map, Satellite, Mountain, Navigation, Layers } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export type BasemapType = 'hybrid' | 'streets-vector' | 'topo-vector' | 'osm';

interface BasemapSwitcherProps {
  currentBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
}

export const BasemapSwitcher: React.FC<BasemapSwitcherProps> = ({ currentBasemap, onBasemapChange }) => {
  // Common basemaps (these IDs match standard ArcGIS and generic map provider keys)
  const basemaps: { id: BasemapType; label: string; icon: React.ElementType; desc: string }[] = [
    { 
      id: 'hybrid', 
      label: 'Image Mix', 
      icon: Satellite, 
      desc: 'Satellite imagery with street labels' 
    },
    { 
      id: 'streets-vector', 
      label: 'Street', 
      icon: Navigation, 
      desc: 'Standard vector street map' 
    },
    { 
      id: 'topo-vector', 
      label: 'Terrain', 
      icon: Mountain, 
      desc: 'Topographic terrain with elevation' 
    },
    { 
      id: 'osm', 
      label: 'OpenStreetMap', 
      icon: Map, 
      desc: 'Community-driven street map' 
    },
  ];

  return (
    <div className="absolute bottom-36 left-8 z-40">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="secondary" 
            size="icon" 
            className="w-12 h-12 rounded-full shadow-xl bg-background border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            <Layers className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          side="top" 
          className="w-64 p-2 mb-2 bg-card border-border shadow-2xl rounded-xl"
        >
          <div className="mb-2 px-2 pt-1 pb-2 border-b border-border/50">
            <h4 className="text-sm font-semibold text-foreground tracking-wide">Base Map</h4>
            <p className="text-[11px] text-muted-foreground">Select background layer</p>
          </div>
          
          <div className="flex flex-col gap-1">
            {basemaps.map((bm) => {
              const Icon = bm.icon;
              const isActive = currentBasemap === bm.id;
              
              return (
                <button
                  key={bm.id}
                  onClick={() => onBasemapChange(bm.id)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-lg transition-all duration-200 text-left ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-transparent border border-transparent hover:bg-accent'
                  }`}
                >
                  <div className={`p-2 rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-[13px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {bm.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      {bm.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};