import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Building, Sensor, HistoricalData } from 'shared/types';
// import { useWebSocket } from '../hooks/useWebSocket';
import { DataLogFilters } from '../components/datalog/DataLogFilters';
import { DataLogTable, type FlatLogRecord } from '../components/datalog/DataLogTable';

export const DataLogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
//   const { isConnected } = useWebSocket();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [logs, setLogs] = useState<FlatLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableTypes = useMemo(() => Array.from(new Set(sensors.map(s => s.type))), [sensors]);

  const normalizeStatus = (status: string): FlatLogRecord['status'] => {
    if (status === 'Healthy' || status === 'OK') return 'Active';
    if (status === 'Warning') return 'Maintenance';
    return 'Inactive';
  };

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/buildings').then(res => res.json()),
      fetch('http://localhost:3001/api/sensors?limit=2000').then(res => res.json())
    ]).then(([bRes, sRes]) => {
      setBuildings(bRes.buildings || []);
      setSensors(sRes.sensors || []);
    });
  }, []);

  const fetchLogs = async () => {
    if (sensors.length === 0) return;
    setIsLoading(true);
    
    const bMap: Record<string, string> = {};
    buildings.forEach(b => { bMap[b.id] = b.name; });

    try {
      const fetchPromises = sensors.map(sensor => 
        fetch(`http://localhost:3001/api/sensors/${sensor.id}/data?days=1&limit=20`)
          .then(res => res.json())
          .then(json => ({ sensor, history: json.history || [] }))
      );

      const results = await Promise.all(fetchPromises);
      const flatData: FlatLogRecord[] = [];

      results.forEach(({ sensor, history }) => {
        history.forEach((point: HistoricalData, idx: number) => {
          flatData.push({
            id: `${sensor.id}-${idx}`,
            timestamp: new Date(point.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: false }),
            buildingId: sensor.buildingId,
            buildingName: bMap[sensor.buildingId] || sensor.buildingId,
            sensorId: sensor.id,
            type: sensor.type,
            value: point.value,
            unit: sensor.unit,
            status: normalizeStatus(sensor.status)
          });
        });
      });

      setLogs(flatData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [sensors, buildings]);

  // Read URL query dynamically just to show the accurate count in the top header
  const filteredCount = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    const activeTypes = searchParams.getAll('type');
    const activeStatuses = searchParams.getAll('status');
    const activeBuildingIds = searchParams.getAll('building');
    
    // The filter puts ID in URL, but the log uses buildingName, so we map it back
    const activeBuildingNames = activeBuildingIds
      .map(id => buildings.find(b => b.id === id)?.name)
      .filter(Boolean);

    return logs.filter(row => {
      const matchSearch = !searchQuery || 
        row.buildingName.toLowerCase().includes(searchQuery) || 
        row.sensorId.toLowerCase().includes(searchQuery);
        
      const matchType = activeTypes.length === 0 || activeTypes.includes(row.type);
      const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(row.status);
      const matchBuilding = activeBuildingNames.length === 0 || activeBuildingNames.includes(row.buildingName);

      return matchSearch && matchType && matchStatus && matchBuilding;
    }).length;
  }, [logs, searchParams, buildings]);

  return (
    <div className="h-full w-full bg-[#11131A] flex flex-col overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col gap-6 flex-1 min-h-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-white">Sensor Data Log & Inventory</h1>
            <p className="text-[#94A3B8] mt-1.5 text-[14px]">
              Showing {filteredCount.toLocaleString()} records based on current filters.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-transparent border-[#2A2F3A] text-gray-200 hover:text-white hover:bg-[#2A2F3A] text-[13px] h-9">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white text-[13px] h-9" onClick={fetchLogs}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
            </Button>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          
          {/* Left Sidebar Filters */}
          {/* Note: Removed 'overflow-y-auto' from this wrapper because DataLogFilters now handles its own internal scrollbar */}
          <div className="h-full">
            <DataLogFilters 
              buildings={buildings} 
              availableTypes={availableTypes}
            />
          </div>

          {/* Right Main Table Container */}
          <DataLogTable 
            data={logs} 
            isLoading={isLoading}
            buildings={buildings}
          />
        </div>

      </div>
    </div>
  );
};