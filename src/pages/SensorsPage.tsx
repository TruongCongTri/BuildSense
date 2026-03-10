import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Building, Sensor } from "shared/types";
import { useWebSocket } from "../hooks/useWebSocket";
import { SensorsFilters } from "@/components/sensor/SensorFilters";
import { SensorsTable } from "@/components/sensor/SensorTable";


export const SensorsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { liveValues } = useWebSocket(); // 🌟 Hooks into the live updates!
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableTypes = useMemo(() => Array.from(new Set(sensors.map((s) => s.type))), [sensors]);

  const fetchSensors = async () => {
    setIsLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        fetch("http://localhost:3001/api/buildings").then((res) => res.json()),
        fetch("http://localhost:3001/api/sensors?limit=2000").then((res) => res.json())
      ]);
      setBuildings(bRes.buildings || []);
      setSensors(sRes.sensors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSensors(); }, []);

  // 🌟 THE FIX: Inject real-time WebSocket statuses directly into the sensor array
  const liveSensors = useMemo(() => {
    return sensors.map(s => {
      const live = liveValues[s.id];
      if (live) {
        return {
          ...s,
          adminStatus: live.adminStatus,
          healthStatus: live.healthStatus,
          dataStatus: live.dataStatus
        };
      }
      return s;
    });
  }, [sensors, liveValues]);

  // Calculate header text dynamically
  const filteredCount = useMemo(() => {
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const activeTypes = searchParams.getAll("type");
    const activeAdmin = searchParams.getAll("adminStatus");
    const activeHealth = searchParams.getAll("healthStatus");
    const activeData = searchParams.getAll("dataStatus");
    const activeBuildingIds = searchParams.getAll("building");

    return liveSensors.filter((row) => {
      const matchSearch = !searchQuery || row.name.toLowerCase().includes(searchQuery) || row.id.toLowerCase().includes(searchQuery);
      const matchType = activeTypes.length === 0 || activeTypes.includes(row.type);
      const matchAdmin = activeAdmin.length === 0 || activeAdmin.includes(row.adminStatus);
      const matchHealth = activeHealth.length === 0 || activeHealth.includes(row.healthStatus);
      const matchData = activeData.length === 0 || activeData.includes(row.dataStatus);
      const matchBuilding = activeBuildingIds.length === 0 || activeBuildingIds.includes(row.buildingId);

      return matchSearch && matchType && matchAdmin && matchHealth && matchData && matchBuilding;
    }).length;
  }, [liveSensors, searchParams]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden transition-colors duration-200">
      <div className="p-6 md:p-8 flex flex-col gap-6 flex-1 min-h-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">
              Sensor Inventory
            </h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">
              Showing {filteredCount.toLocaleString()} deployed hardware nodes based on current filters.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-[13px] h-9 bg-card text-foreground border-border hover:bg-accent transition-colors">
              <Download className="mr-2 h-4 w-4" /> Export Directory
            </Button>
            <Button className="bg-primary text-primary-foreground hover:opacity-90 text-[13px] h-9 transition-colors" onClick={fetchSensors}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          <div className="h-full flex-shrink-0">
            <SensorsFilters buildings={buildings} availableTypes={availableTypes} />
          </div>
          {/* Pass the merged live array to the table! */}
          <SensorsTable sensors={liveSensors} isLoading={isLoading} buildings={buildings} />
        </div>
      </div>
    </div>
  );
};