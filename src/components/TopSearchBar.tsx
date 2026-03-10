import React, { useState, useEffect, useRef } from 'react';
import { Building2, Activity, Search, ChevronDown, ChevronRight, LocateFixed, X, MapPin, Route, Mountain } from 'lucide-react';
import type { Building, Sensor } from '../../shared/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TopSearchBarProps {
  buildings: Building[];
  sensors: Sensor[];
  buildingFilters: Record<string, boolean>;
  sensorFilters: Record<string, boolean>;
  onApplyBuildingFilters: (filters: Record<string, boolean>) => void;
  onApplySensorFilters: (filters: Record<string, boolean>) => void;
  onBuildingLocate: (bldg: Building) => void;
  onSensorLocate: (sensor: Sensor) => void;
}

// Helper to get the right icon based on the infrastructure type
const getInfraIcon = (type?: string, className = "w-4 h-4 text-muted-foreground") => {
  if (type === 'highway' || type === 'road') return <Route className={className} />;
  if (type === 'bridge') return <Mountain className={className} />;
  return <Building2 className={className} />;
};

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  buildings, sensors, buildingFilters, sensorFilters,
  onApplyBuildingFilters, onApplySensorFilters, onBuildingLocate, onSensorLocate
}) => {
  const [activeMenu, setActiveMenu] = useState<'buildings' | 'sensors' | null>(null);
  
  // Independent Search From URL
  const [bldgSearchQuery, setBldgSearchQuery] = useState('');
  const [sensorSearchQuery, setSensorSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  
  const isFirstSearchMount = useRef(true);
  
  // Auto-open results if loaded with a query
  useEffect(() => {
    if (globalSearchQuery) setShowGlobalResults(true);
  }, []);

  // --- SYNC SEARCH TO URL ON CHANGE ---
  useEffect(() => {
    if (isFirstSearchMount.current) {
      isFirstSearchMount.current = false;
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (globalSearchQuery) {
      urlParams.set('q', globalSearchQuery);
    } else {
      urlParams.delete('q');
    }
    
    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [globalSearchQuery]);


  // Local "Draft" states for the apply workflow
  const [draftBldgFilters, setDraftBldgFilters] = useState<Record<string, boolean>>(buildingFilters);
  const [draftSensorFilters, setDraftSensorFilters] = useState<Record<string, boolean>>(sensorFilters);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Sync draft state if props change externally
  useEffect(() => { setDraftBldgFilters(buildingFilters); }, [buildingFilters]);
  useEffect(() => { setDraftSensorFilters(sensorFilters); }, [sensorFilters]);

  // --- ACTIONS ---
  // --- ACTION-DRIVEN URL SYNCING ---
  const handleApplyBuildings = () => {
    onApplyBuildingFilters(draftBldgFilters);
    
    const urlParams = new URLSearchParams(window.location.search);
    const activeIds = Object.keys(draftBldgFilters).filter(id => draftBldgFilters[id]);
    
    if (activeIds.length > 0 && activeIds.length < buildings.length) {
      urlParams.set('buildings', activeIds.join(','));
    } else {
      urlParams.delete('buildings');
    }
    
    // Changing buildings usually invalidates current sensor selections, so we wipe it from the URL
    urlParams.delete('sensors'); 
    
    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);

    setActiveMenu('sensors'); 
  };

  const handleApplySensors = () => {
    onApplySensorFilters(draftSensorFilters);
    
    const urlParams = new URLSearchParams(window.location.search);
    const activeIds = Object.keys(draftSensorFilters).filter(id => draftSensorFilters[id]);
    
    if (activeIds.length > 0 && activeIds.length < sensors.length) {
      urlParams.set('sensors', activeIds.join(','));
    } else {
      urlParams.delete('sensors');
    }
    
    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);

    setActiveMenu(null);
  };

  const handleClearSensors = () => {
    const cleared: Record<string, boolean> = {};
    sensors.forEach(s => cleared[s.id] = false);
    setDraftSensorFilters(cleared);
  };

  // --- SELECT ALL LOGIC ---
  const filteredBuildings = buildings.filter(b => b.name.toLowerCase().includes(bldgSearchQuery.toLowerCase()));
  const allBuildingsSelected = filteredBuildings.length > 0 && filteredBuildings.every(b => draftBldgFilters[b.id]);
  
  // GROUP BUILDINGS BY CATEGORY (e.g. 'highway', 'bridge', 'building')
  const groupedBuildings = filteredBuildings.reduce((acc, bldg) => {
    const type = bldg.type || 'building';
    if (!acc[type]) acc[type] = [];
    acc[type].push(bldg);
    return acc;
  }, {} as Record<string, Building[]>);

  const handleSelectAllBuildings = (checked: boolean) => {
    const next: Record<string, boolean> = { ...draftBldgFilters };
    filteredBuildings.forEach(b => next[b.id] = checked);
    setDraftBldgFilters(next);
  };

  const handleSelectGroupBuildings = (type: string, checked: boolean) => {
    const next: Record<string, boolean> = { ...draftBldgFilters };
    groupedBuildings[type].forEach(b => next[b.id] = checked);
    setDraftBldgFilters(next);
  };

  const handleSelectAllSensors = (checked: boolean) => {
    const next: Record<string, boolean> = { ...draftSensorFilters };
    sensors.forEach(s => next[s.id] = checked);
    setDraftSensorFilters(next);
  };

  const handleSelectBuildingGroup = (bldgId: string, checked: boolean) => {
    const bldgSensors = sensors.filter(s => s.buildingId === bldgId && s.name.toLowerCase().includes(sensorSearchQuery.toLowerCase()));
    setDraftSensorFilters(prev => {
      const next = { ...prev };
      bldgSensors.forEach(s => next[s.id] = checked);
      return next;
    });
  };

  // --- GLOBAL SEARCH LOGIC ---
  const globalMatchingBuildings = buildings.filter(b => b.name.toLowerCase().includes(globalSearchQuery.toLowerCase()));
  const globalMatchingSensors = sensors.filter(s => 
    s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
    s.type.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const handleGlobalBuildingClick = (bldg: Building) => {
    onBuildingLocate(bldg);
    setShowGlobalResults(false);
    setGlobalSearchQuery('');
  };

  const handleGlobalSensorClick = (sensor: Sensor) => {
    onSensorLocate(sensor);
    setShowGlobalResults(false);
    setGlobalSearchQuery('');
  };

  // For the active counts in the button labels
  const activeBldgCount = buildings.filter(b => buildingFilters[b.id]).length;
  const activeSensorCount = sensors.filter(s => sensorFilters[s.id]).length;

  return (
    <div className="absolute top-6 left-6 z-50 flex gap-2">
      
      {/* --- INFRASTRUCTURE MENU --- */}
      <div className="relative">
        <Button 
          variant="secondary" 
          className={`h-11 px-4 text-sm border shadow-sm transition-colors duration-200 ${
            activeMenu === 'buildings' 
              ? 'bg-accent text-foreground border-primary' 
              : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => { setActiveMenu(activeMenu === 'buildings' ? null : 'buildings'); setShowGlobalResults(false); }}
        >
          <Building2 className="w-4 h-4 mr-2" /> 
          {activeBldgCount === buildings.length ? "All Infrastructure" : `${activeBldgCount} Assets`}
          <ChevronDown className="w-4 h-4 ml-3" />
        </Button>

        {activeMenu === 'buildings' && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-2xl overflow-hidden transition-colors duration-200">
            <div className="p-3 border-b border-border bg-muted/50">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Search infrastructure..." 
                   className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors duration-200"
                   value={bldgSearchQuery}
                   onChange={(e) => setBldgSearchQuery(e.target.value)}
                 />
               </div>
            </div>

            <div className="p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={allBuildingsSelected}
                  onCheckedChange={(val) => handleSelectAllBuildings(!!val)}
                />
                <span className="font-semibold text-foreground">Select All Infrastructure</span>
              </div>
            </div>
            
            <ScrollArea className="h-[280px] p-2">
              <div className="flex flex-col gap-3">
                {Object.keys(groupedBuildings).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground mt-4">No assets found.</p>
                ) : (
                  Object.keys(groupedBuildings).map(type => {
                    const groupItems = groupedBuildings[type];
                    const allInGroupSelected = groupItems.every(b => draftBldgFilters[b.id]);
                    const someInGroupSelected = groupItems.some(b => draftBldgFilters[b.id]);

                    return (
                      <div key={type} className="mb-2">
                        {/* Group Header */}
                        <div className="flex items-center gap-2 px-2 py-1 mb-1">
                          <Checkbox 
                            checked={allInGroupSelected ? true : (someInGroupSelected ? "indeterminate" : false)}
                            onCheckedChange={(val) => handleSelectGroupBuildings(type, !!val)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{type}s</span>
                        </div>
                        
                        {/* Group Items */}
                        <div className="pl-4 border-l-2 border-border/50 ml-3 flex flex-col gap-1">
                          {groupItems.map(bldg => (
                            <div key={bldg.id} className="flex items-center justify-between group p-1.5 rounded-md hover:bg-accent transition-colors duration-200">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={draftBldgFilters[bldg.id] ?? true}
                                  onCheckedChange={(val) => setDraftBldgFilters(p => ({ ...p, [bldg.id]: !!val }))}
                                />
                                {getInfraIcon(bldg.type, "w-4 h-4 text-muted-foreground")}
                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[160px]" title={bldg.name}>{bldg.name}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80" onClick={() => onBuildingLocate(bldg)}>
                                <LocateFixed className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border bg-muted/50 flex justify-end">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6" onClick={handleApplyBuildings}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- SENSORS MENU --- */}
      <div className="relative">
        <Button 
          variant="secondary" 
          className={`h-11 px-4 text-sm border shadow-sm transition-colors duration-200 ${
            activeMenu === 'sensors' 
              ? 'bg-accent text-foreground border-primary' 
              : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => { setActiveMenu(activeMenu === 'sensors' ? null : 'sensors'); setShowGlobalResults(false); }}
        >
          <Activity className="w-4 h-4 mr-2" /> 
          {activeSensorCount === sensors.length && sensors.length > 0 ? "All Sensors" : activeSensorCount > 0 ? "Multiple Sensors" : "No Sensors"}
          <ChevronDown className="w-4 h-4 ml-3" />
        </Button>

        {activeMenu === 'sensors' && (
          <div className="absolute top-full left-0 mt-2 w-[340px] bg-popover border border-border rounded-lg shadow-2xl overflow-hidden transition-colors duration-200">
             
             {/* Sensor Search */}
             <div className="p-3 border-b border-border bg-muted/50">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Search sensors..." 
                   className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors duration-200"
                   value={sensorSearchQuery}
                   onChange={(e) => setSensorSearchQuery(e.target.value)}
                 />
               </div>
             </div>

             <div className="p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={sensors.length > 0 && sensors.every(s => draftSensorFilters[s.id])}
                  onCheckedChange={(val) => handleSelectAllSensors(!!val)}
                />
                <span className="font-semibold text-foreground">Select All Sensors</span>
              </div>
            </div>

             {sensors.length === 0 ? (
               <div className="p-6 text-center text-sm text-muted-foreground">Select a building first to view sensors.</div>
             ) : (
               <ScrollArea className="h-[280px] p-2">
                <div className="flex flex-col gap-1">
                  
                  {buildings.filter(b => draftBldgFilters[b.id]).map(bldg => {
                    const bldgSensors = sensors.filter(s => s.buildingId === bldg.id && s.name.toLowerCase().includes(sensorSearchQuery.toLowerCase()));
                    if (bldgSensors.length === 0) return null;

                    const isExpanded = expandedGroups[bldg.id] ?? true;
                    const allInBldgSelected = bldgSensors.every(s => draftSensorFilters[s.id]);
                    const someInBldgSelected = bldgSensors.some(s => draftSensorFilters[s.id]);

                    return (
                      <div key={bldg.id} className="mb-2">
                        <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-md group transition-colors duration-200">
                          <button onClick={() => setExpandedGroups(p => ({...p, [bldg.id]: !isExpanded}))} className="text-muted-foreground hover:text-foreground transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <Checkbox 
                            checked={allInBldgSelected ? true : (someInBldgSelected ? "indeterminate" : false)}
                            onCheckedChange={(val) => handleSelectBuildingGroup(bldg.id, !!val)}
                          />
                          {getInfraIcon(bldg.type, "w-4 h-4 text-muted-foreground")}
                          <span className="text-sm font-medium text-foreground">{bldg.name}</span>
                        </div>

                        {isExpanded && (
                          <div className="ml-8 border-l border-border pl-2 mt-1 flex flex-col gap-1">
                            {bldgSensors.map(sensor => (
                              <div key={sensor.id} className="flex items-center justify-between group p-1.5 rounded-md hover:bg-accent transition-colors duration-200">
                                <div className="flex items-center gap-3">
                                  <Checkbox 
                                    checked={draftSensorFilters[sensor.id] ?? true}
                                    onCheckedChange={(val) => setDraftSensorFilters(p => ({ ...p, [sensor.id]: !!val }))}
                                  />
                                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[180px]">{sensor.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80" onClick={() => onSensorLocate(sensor)}>
                                  <LocateFixed className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
             )}

            <div className="p-3 border-t border-border bg-muted/50 flex justify-between items-center">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground px-4" onClick={handleClearSensors}>
                Clear
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6" onClick={handleApplySensors}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- GLOBAL UNIFIED SEARCH BAR --- */}
      <div className="relative ml-2">
        <div className="flex items-center bg-card border border-border hover:border-primary transition-colors duration-200 rounded-md px-3 h-11 w-72 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Search all assets..." 
            className="bg-transparent border-none text-sm text-foreground w-full focus:outline-none placeholder:text-muted-foreground"
            value={globalSearchQuery}
            onChange={(e) => {
               setGlobalSearchQuery(e.target.value);
               setShowGlobalResults(true);
               setActiveMenu(null); 
            }}
            onFocus={() => { if(globalSearchQuery) setShowGlobalResults(true); setActiveMenu(null); }}
          />
          {globalSearchQuery && (
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={() => { setGlobalSearchQuery(''); setShowGlobalResults(false); }} />
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showGlobalResults && globalSearchQuery && (
           <div className="absolute top-full left-0 mt-2 w-full bg-popover border border-border rounded-lg shadow-2xl overflow-hidden z-50 transition-colors duration-200">
              <ScrollArea className="max-h-[300px]">
                {globalMatchingBuildings.length === 0 && globalMatchingSensors.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No matching assets found.</div>
                ) : (
                  <div className="py-2">
                    
                    {/* Building Results */}
                    {globalMatchingBuildings.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buildings</div>
                        {globalMatchingBuildings.map(bldg => (
                          <div 
                            key={bldg.id} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            onClick={() => handleGlobalBuildingClick(bldg)}
                          >
                            {getInfraIcon(bldg.type, "w-4 h-4 text-muted-foreground")}
                            {bldg.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sensor Results */}
                    {globalMatchingSensors.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sensors</div>
                        {globalMatchingSensors.map(sensor => (
                          <div 
                            key={sensor.id} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            onClick={() => handleGlobalSensorClick(sensor)}
                          >
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <div>
                              <div className="font-medium text-foreground">{sensor.name}</div>
                              <div className="text-xs text-muted-foreground">{sensor.type}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                  </div>
                )}
              </ScrollArea>
           </div>
        )}
      </div>
    </div>
  );
};