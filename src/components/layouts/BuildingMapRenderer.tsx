import React, { useState, useEffect, useMemo, useRef } from "react";

import { MapContainer } from "./MapContainer";

import type { Building, Sensor } from "shared/types";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SensorDrawer } from "../sensor/SensorDrawer";
import { TopSearchBar } from "../TopSearchBar";

export const BuildingMapRenderer: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const { alerts } = useWebSocket();

  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [focusedSensor, setFocusedSensor] = useState<Sensor | null>(null);
  const [focusedBuilding, setFocusedBuilding] = useState<Building | null>(null);

  const [playbackTimestamp, setPlaybackTimestamp] = useState<number | null>(null);

  const [sensorFilters, setSensorFilters] = useState<Record<string, boolean>>(
    {},
  );
  const [buildingFilters, setBuildingFilters] = useState<
    Record<string, boolean>
  >({});

  const initialUrlParams = useRef(new URLSearchParams(window.location.search));
  const isReadyToSync = useRef(false);

  // 1. Initial Load: Fetch Buildings
  useEffect(() => {
    fetch("http://localhost:3001/api/buildings")
      .then((res) => res.json())
      .then((json) => {
        if (json.buildings) {
          setBuildings(json.buildings);

          // --- URL PARSING FOR BUILDINGS ---

          const urlBldgs = initialUrlParams.current.get("buildings");
          const initialBldgFilters: Record<string, boolean> = {};

          if (urlBldgs) {
            // If URL has specific buildings, only check those
            const selectedIds = urlBldgs.split(",");
            json.buildings.forEach((b: Building) => {
              initialBldgFilters[b.id] = selectedIds.includes(b.id);
            });
          } else {
            // Default: ALL buildings visible
            json.buildings.forEach((b: Building) => {
              initialBldgFilters[b.id] = true;
            });
          }

          // Setup state
          setBuildingFilters(initialBldgFilters);
          
          // Find the very first building in the list that is marked as 'true' (selected)
          const firstSelectedBuilding = json.buildings.find((b: Building) => initialBldgFilters[b.id]);
          
          if (firstSelectedBuilding) {
            // Zoom to the exact building if 1 is selected, or the first one if multiple are selected
            setFocusedBuilding(firstSelectedBuilding);
          } else if (json.buildings.length > 0) {
            // Safe fallback: If ALL buildings are somehow deselected, just look at the first one
            setFocusedBuilding(json.buildings[0]);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch buildings:", err));
  }, []);

  // 2. Hierarchical Fetch: Get sensors ONLY for visible buildings!
  useEffect(() => {
    if (Object.keys(buildingFilters).length === 0) return;

    // Extract IDs of buildings that are currently toggled "ON"
    const activeBuildingIds = Object.keys(buildingFilters).filter(id => buildingFilters[id]);

    // Simply call the API! If activeBuildingIds is empty, the backend safely returns { sensors: [] }
    fetch(
      `http://localhost:3001/api/sensors/by-buildings?ids=${activeBuildingIds.join(",")}`,
    )
      .then((res) => res.json())
      .then((json) => {
        const fetchedSensors: Sensor[] = json.sensors || [];
        setSensors(fetchedSensors); // This happens asynchronously now!

        // --- URL PARSING FOR SENSORS ---
        const urlSensors = initialUrlParams.current.get('sensors');
        const initialSensorFilters: Record<string, boolean> = {};

        if (urlSensors) {
          const selectedIds = urlSensors.split(",");
          fetchedSensors.forEach((s) => {
            initialSensorFilters[s.id] = selectedIds.includes(s.id);
          });

          initialUrlParams.current.delete('sensors');
        } else {
          fetchedSensors.forEach((s) => {
            initialSensorFilters[s.id] = true;
          });
        }

        setSensorFilters(initialSensorFilters);

        setTimeout(() => { isReadyToSync.current = true; }, 100);
      })
      .catch((err) =>
        console.error("Failed to fetch sensors by building:", err),
      );
  }, [buildingFilters]); // <-- Re-runs whenever the user clicks "Apply" on the Buildings menu

  const alertingSensorIds = useMemo(
    () => alerts.map((a) => a.sensorId),
    [alerts],
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-background transition-colors duration-200">
      <MapContainer
        buildings={buildings}
        buildingFilters={buildingFilters}
        focusedBuilding={focusedBuilding}
        sensors={sensors}
        onSensorClick={(s) => {
          setSelectedSensor(s);
          setFocusedSensor(s);
        }}
        isGlobalVisible={true} // Replaced by our new hierarchical logic
        typeFilters={{}} // Handled directly via sensorFilters now
        sensorFilters={sensorFilters}
        alertingSensorIds={alertingSensorIds}
        focusedSensor={focusedSensor}
        playbackTimestamp={playbackTimestamp}
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
        onSensorLocate={(s) => {
          setSelectedSensor(s);
          setFocusedSensor(s);
        }}
      />

      {/* KEEP DRAWER FOR SENSOR DETAILS */}
      <SensorDrawer
        isOpen={!!selectedSensor}
        onClose={() => setSelectedSensor(null)}
        sensor={selectedSensor}
        onTimePlay={setPlaybackTimestamp}
      />
    </div>
  );
};
