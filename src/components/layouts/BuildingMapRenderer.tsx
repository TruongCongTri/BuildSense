import React, { useState, useEffect, useMemo } from 'react';

import { MapContainer } from './MapContainer';

import type { Building, Sensor } from 'shared/types';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SensorDrawer } from '../sensor/SensorDrawer';
import { TopSearchBar } from '../TopSearchBar';


export const BuildingMapRenderer: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const { alerts } = useWebSocket();
  
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [focusedSensor, setFocusedSensor] = useState<Sensor | null>(null);
  const [focusedBuilding, setFocusedBuilding] = useState<Building | null>(null);
  
  const [sensorFilters, setSensorFilters] = useState<Record<string, boolean>>({});
  const [buildingFilters, setBuildingFilters] = useState<Record<string, boolean>>({});

  // 1. Initial Load: Fetch Buildings
  useEffect(() => {
    fetch('http://localhost:3001/api/buildings')
      .then(res => res.json())
      .then(json => {
        if (json.buildings) {
          setBuildings(json.buildings);
          // Default: ALL buildings visible
          const initialBldgFilters: Record<string, boolean> = {};
          json.buildings.forEach((b: Building) => { initialBldgFilters[b.id] = true; });
          setBuildingFilters(initialBldgFilters);
          if (json.buildings.length > 0) setFocusedBuilding(json.buildings[0]);
        }
      })
      .catch(err => console.error('Failed to fetch buildings:', err));
  }, []);

  // 2. Hierarchical Fetch: Get sensors ONLY for visible buildings!
  useEffect(() => {
    // Extract IDs of buildings that are currently toggled "ON"
    const activeBuildingIds = Object.keys(buildingFilters).filter(id => buildingFilters[id]);
    
    // Simply call the API! If activeBuildingIds is empty, the backend safely returns { sensors: [] }
    fetch(`http://localhost:3001/api/sensors/by-buildings?ids=${activeBuildingIds.join(',')}`)
      .then(res => res.json())
      .then(json => {
        const fetchedSensors: Sensor[] = json.sensors || [];
        setSensors(fetchedSensors); // This happens asynchronously now!
        
        // Reset sensor visibility so they are all ON by default when a new building loads
        const initialSensorFilters: Record<string, boolean> = {};
        fetchedSensors.forEach(s => { initialSensorFilters[s.id] = true; });
        setSensorFilters(initialSensorFilters);
      })
      .catch(err => console.error('Failed to fetch sensors by building:', err));
  }, [buildingFilters]); // <-- Re-runs whenever the user clicks "Apply" on the Buildings menu

  const alertingSensorIds = useMemo(() => alerts.map(a => a.sensorId), [alerts]);

  // const sensorsByType = useMemo(() => {
  //   const grouped: Record<string, Sensor[]> = {};
  //   sensors.forEach(s => {
  //     if (!grouped[s.type]) grouped[s.type] = [];
  //     grouped[s.type].push(s);
  //   });
  //   return grouped;
  // }, [sensors]);

  // const handleSensorClick = (sensor: Sensor) => {
  //   setSelectedSensor(sensor);
  //   setIsDrawerOpen(true);
  //   setFocusedSensor(sensor);
  // };

  // const handleSensorLocate = (sensor: Sensor) => {
  //   setFocusedSensor(sensor);
  //   setSelectedSensor(sensor);
  //   setIsDrawerOpen(true);
  // };

  // const handleToggleGlobalVisibility = () => {
  //   setIsGlobalVisible(!isGlobalVisible);
  // };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <MapContainer 
        buildings={buildings}               
        buildingFilters={buildingFilters}   
        focusedBuilding={focusedBuilding}   
        sensors={sensors} 
        onSensorClick={(s) => { setSelectedSensor(s); setFocusedSensor(s); }}
        isGlobalVisible={true} // Replaced by our new hierarchical logic
        typeFilters={{}}       // Handled directly via sensorFilters now
        sensorFilters={sensorFilters}
        alertingSensorIds={alertingSensorIds}
        focusedSensor={focusedSensor}
      />
      
      {/* THE NEW FLOATING UI */}
      <TopSearchBar 
        buildings={buildings}
        sensors={sensors}
        buildingFilters={buildingFilters}
        sensorFilters={sensorFilters}
        onApplyBuildingFilters={setBuildingFilters}
        onApplySensorFilters={setSensorFilters}
        onBuildingLocate={setFocusedBuilding}
        onSensorLocate={(s) => { setSelectedSensor(s); setFocusedSensor(s); }}
      />

      {/* KEEP DRAWER FOR SENSOR DETAILS */}
      <SensorDrawer isOpen={!!selectedSensor} onClose={() => setSelectedSensor(null)} sensor={selectedSensor} />
    </div>
  );
};