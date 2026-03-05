import React, { useState, useEffect, useMemo } from 'react';
import type { Sensor } from '../../../shared/types';
import { useWebSocket } from '../../hooks/useWebSocket';

// Child Components
import { MapContainer } from './MapContainer';
import { SensorDrawer } from '../sensor/SensorDrawer'; 
import { GlobalDashboardModal } from './GlobalDashboardModal';
import { MapControls } from '../MapControls';
import { SensorFilterMenu } from '../sensor/SensorFilterMenu';

export const BuildingMapRenderer: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const { alerts } = useWebSocket();
  
  // Visibility States
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [focusedSensor, setFocusedSensor] = useState<Sensor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showBuildingModel, setShowBuildingModel] = useState(true);
  const [isGlobalVisible, setIsGlobalVisible] = useState(true);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  // Filter States
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({});
  const [sensorFilters, setSensorFilters] = useState<Record<string, boolean>>({});
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('http://localhost:3001/api/sensors?limit=1000')
      .then((res) => res.json())
      .then((json) => {
        const fetchedSensors: Sensor[] = json.sensors || json;
        setSensors(fetchedSensors);
        
        const initialTypeFilters: Record<string, boolean> = {};
        const initialSensorFilters: Record<string, boolean> = {};
        fetchedSensors.forEach(s => {
          initialTypeFilters[s.type] = true;
          initialSensorFilters[s.id] = true;
        });
        setTypeFilters(initialTypeFilters);
        setSensorFilters(initialSensorFilters);
      })
      .catch((err) => console.error('Failed to fetch sensors:', err));
  }, []);

  const sensorsByType = useMemo(() => {
    const grouped: Record<string, Sensor[]> = {};
    sensors.forEach(s => {
      if (!grouped[s.type]) grouped[s.type] = [];
      grouped[s.type].push(s);
    });
    return grouped;
  }, [sensors]);

  const alertingSensorIds = useMemo(() => alerts.map(a => a.sensorId), [alerts]);

  const handleSensorClick = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setIsDrawerOpen(true);
    setFocusedSensor(sensor); 
  };

  const handleSensorLocate = (sensor: Sensor) => {
    setFocusedSensor(sensor);
    setSelectedSensor(sensor);
    setIsDrawerOpen(true); 
  };

  const toggleTypeFilter = (type: string) => {
    const isNowVisible = !typeFilters[type];
    setTypeFilters(prev => ({ ...prev, [type]: isNowVisible }));
    setSensorFilters(prev => {
      const updated = { ...prev };
      sensorsByType[type].forEach(s => { updated[s.id] = isNowVisible; });
      return updated;
    });
  };

  const toggleSensorFilter = (id: string) => {
    setSensorFilters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandType = (type: string) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleToggleGlobalVisibility = () => {
    const newVisibility = !isGlobalVisible;
    setIsGlobalVisible(newVisibility);

    if (newVisibility) {
      const resetTypeFilters: Record<string, boolean> = {};
      const resetSensorFilters: Record<string, boolean> = {};
      sensors.forEach(s => {
        resetTypeFilters[s.type] = true;
        resetSensorFilters[s.id] = true;
      });
      setTypeFilters(resetTypeFilters);
      setSensorFilters(resetSensorFilters);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <MapContainer 
        sensors={sensors} 
        onSensorClick={handleSensorClick}
        isGlobalVisible={isGlobalVisible}
        typeFilters={typeFilters}
        sensorFilters={sensorFilters}
        alertingSensorIds={alertingSensorIds}
        showBuildingModel={showBuildingModel}
        focusedSensor={focusedSensor}
      />
      
      {/* Extracted UI Controls Overlay */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
        <MapControls 
          onOpenDashboard={() => setIsDashboardOpen(true)}
          showBuildingModel={showBuildingModel}
          onToggleBuildingModel={() => setShowBuildingModel(!showBuildingModel)}
          isGlobalVisible={isGlobalVisible}
          onToggleGlobalVisibility={handleToggleGlobalVisibility}
          isFilterMenuOpen={isFilterMenuOpen}
          onToggleFilterMenu={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
        />

        {isFilterMenuOpen && (
          <SensorFilterMenu 
            sensorsByType={sensorsByType}
            alertingSensorIds={alertingSensorIds}
            typeFilters={typeFilters}
            toggleTypeFilter={toggleTypeFilter}
            expandedTypes={expandedTypes}
            toggleExpandType={toggleExpandType}
            sensorFilters={sensorFilters}
            toggleSensorFilter={toggleSensorFilter}
            onSensorLocate={handleSensorLocate}
          />
        )}
      </div>

      <SensorDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} sensor={selectedSensor} />
      <GlobalDashboardModal isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} sensors={sensors} />
    </div>
  );
};