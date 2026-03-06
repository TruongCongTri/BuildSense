import React, { useState, useEffect, useRef } from 'react';
import { Building2, Activity, Search, ChevronDown, ChevronRight, LocateFixed, X, MapPin } from 'lucide-react';
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
  
  const handleSelectAllBuildings = (checked: boolean) => {
    const next: Record<string, boolean> = { ...draftBldgFilters };
    filteredBuildings.forEach(b => next[b.id] = checked);
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
      
      {/* --- BUILDINGS MENU --- */}
      <div className="relative">
        <Button 
          variant="outline" 
          className={`h-11 px-4 text-sm border-gray-700 bg-[#1A1D21] hover:bg-[#242938] hover:text-white transition-all ${activeMenu === 'buildings' ? 'bg-[#242938] text-white border-blue-500' : 'text-gray-300'}`}
          onClick={() => { setActiveMenu(activeMenu === 'buildings' ? null : 'buildings'); setShowGlobalResults(false); }}
        >
          <Building2 className="w-4 h-4 mr-2 text-gray-400" /> 
          {activeBldgCount === buildings.length ? "All Buildings" : `${activeBldgCount} Buildings`}
          <ChevronDown className="w-4 h-4 ml-3 text-gray-500" />
        </Button>

        {activeMenu === 'buildings' && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-[#1A1D21] border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
            {/* Building Search */}
            <div className="p-3 border-b border-gray-800 bg-[#1e222a]">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input 
                   type="text" 
                   placeholder="Search buildings..." 
                   className="w-full bg-[#131518] border border-gray-700 rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                   value={bldgSearchQuery}
                   onChange={(e) => setBldgSearchQuery(e.target.value)}
                 />
               </div>
            </div>

            <div className="p-4 border-b border-gray-800 bg-[#1e222a]">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={allBuildingsSelected}
                  onCheckedChange={(val) => handleSelectAllBuildings(!!val)}
                />
                <span className="font-semibold text-white">Select All Buildings</span>
              </div>
            </div>
            
            <ScrollArea className="h-[240px] p-2">
              <div className="flex flex-col gap-1">
                {filteredBuildings.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 mt-4">No buildings found.</p>
                ) : (
                  filteredBuildings.map(bldg => (
                    <div key={bldg.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={draftBldgFilters[bldg.id] ?? true}
                          onCheckedChange={(val) => setDraftBldgFilters(p => ({ ...p, [bldg.id]: !!val }))}
                        />
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{bldg.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300" onClick={() => onBuildingLocate(bldg)}>
                        <LocateFixed className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-gray-800 bg-[#1e222a] flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6" onClick={handleApplyBuildings}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- SENSORS MENU --- */}
      <div className="relative">
        <Button 
          variant="outline" 
          className={`h-11 px-4 text-sm border-gray-700 bg-[#1A1D21] hover:bg-[#242938] hover:text-white transition-all ${activeMenu === 'sensors' ? 'bg-[#242938] text-white border-blue-500' : 'text-gray-300'}`}
          onClick={() => { setActiveMenu(activeMenu === 'sensors' ? null : 'sensors'); setShowGlobalResults(false); }}
        >
          <Activity className="w-4 h-4 mr-2 text-gray-400" /> 
          {activeSensorCount === sensors.length && sensors.length > 0 ? "All Sensors" : activeSensorCount > 0 ? "Multiple Sensors" : "No Sensors"}
          <ChevronDown className="w-4 h-4 ml-3 text-gray-500" />
        </Button>

        {activeMenu === 'sensors' && (
          <div className="absolute top-full left-0 mt-2 w-[340px] bg-[#1A1D21] border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
             
             {/* Sensor Search */}
             <div className="p-3 border-b border-gray-800 bg-[#1e222a]">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input 
                   type="text" 
                   placeholder="Search sensors..." 
                   className="w-full bg-[#131518] border border-gray-700 rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                   value={sensorSearchQuery}
                   onChange={(e) => setSensorSearchQuery(e.target.value)}
                 />
               </div>
             </div>

             <div className="p-4 border-b border-gray-800 bg-[#1e222a]">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={sensors.length > 0 && sensors.every(s => draftSensorFilters[s.id])}
                  onCheckedChange={(val) => handleSelectAllSensors(!!val)}
                />
                <span className="font-semibold text-white">Select All Sensors</span>
              </div>
            </div>

             {sensors.length === 0 ? (
               <div className="p-6 text-center text-sm text-gray-500">Select a building first to view sensors.</div>
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
                        <div className="flex items-center gap-2 p-2 hover:bg-gray-800/50 rounded-md group">
                          <button onClick={() => setExpandedGroups(p => ({...p, [bldg.id]: !isExpanded}))} className="text-gray-400 hover:text-white">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <Checkbox 
                            checked={allInBldgSelected ? true : (someInBldgSelected ? "indeterminate" : false)}
                            onCheckedChange={(val) => handleSelectBuildingGroup(bldg.id, !!val)}
                          />
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-200">{bldg.name}</span>
                        </div>

                        {isExpanded && (
                          <div className="ml-8 border-l border-gray-700 pl-2 mt-1 flex flex-col gap-1">
                            {bldgSensors.map(sensor => (
                              <div key={sensor.id} className="flex items-center justify-between group p-1.5 rounded-md hover:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                  <Checkbox 
                                    checked={draftSensorFilters[sensor.id] ?? true}
                                    onCheckedChange={(val) => setDraftSensorFilters(p => ({ ...p, [sensor.id]: !!val }))}
                                  />
                                  <span className="text-sm text-gray-400 group-hover:text-gray-200 truncate max-w-[180px]">{sensor.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300" onClick={() => onSensorLocate(sensor)}>
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

            <div className="p-3 border-t border-gray-800 bg-[#1e222a] flex justify-between items-center">
              <Button variant="ghost" className="text-gray-400 hover:text-white px-4" onClick={handleClearSensors}>
                Clear
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6" onClick={handleApplySensors}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- GLOBAL UNIFIED SEARCH BAR --- */}
      <div className="relative ml-2">
        <div className="flex items-center bg-[#1A1D21] border border-gray-700 hover:border-blue-500 transition-colors rounded-md px-3 h-11 w-72 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search all assets..." 
            className="bg-transparent border-none text-sm text-white w-full focus:outline-none placeholder-gray-500"
            value={globalSearchQuery}
            onChange={(e) => {
               setGlobalSearchQuery(e.target.value);
               setShowGlobalResults(true);
               setActiveMenu(null); // Close other menus
            }}
            onFocus={() => { if(globalSearchQuery) setShowGlobalResults(true); setActiveMenu(null); }}
          />
          {globalSearchQuery && (
            <X className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" onClick={() => { setGlobalSearchQuery(''); setShowGlobalResults(false); }} />
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showGlobalResults && globalSearchQuery && (
           <div className="absolute top-full left-0 mt-2 w-full bg-[#1A1D21] border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
              <ScrollArea className="max-h-[300px]">
                {globalMatchingBuildings.length === 0 && globalMatchingSensors.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No matching assets found.</div>
                ) : (
                  <div className="py-2">
                    
                    {/* Building Results */}
                    {globalMatchingBuildings.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Buildings</div>
                        {globalMatchingBuildings.map(bldg => (
                          <div 
                            key={bldg.id} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-[#242938] cursor-pointer text-sm text-gray-300 hover:text-white"
                            onClick={() => handleGlobalBuildingClick(bldg)}
                          >
                            <Building2 className="w-4 h-4 text-blue-500" />
                            {bldg.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sensor Results */}
                    {globalMatchingSensors.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sensors</div>
                        {globalMatchingSensors.map(sensor => (
                          <div 
                            key={sensor.id} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-[#242938] cursor-pointer text-sm text-gray-300 hover:text-white"
                            onClick={() => handleGlobalSensorClick(sensor)}
                          >
                            <MapPin className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="font-medium">{sensor.name}</div>
                              <div className="text-xs text-gray-500">{sensor.type}</div>
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