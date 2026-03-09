import React, { useEffect, useState, useMemo } from 'react';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { useWebSocket } from '../../hooks/useWebSocket';

// Shadcn & Icons
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Download } from 'lucide-react';

// Child Components
import { DashboardMetrics } from '../dashboard/DashboardMetrics';
import { DashboardChart } from '../dashboard/DashboardChart';
import { DashboardLayers } from '../dashboard/DashboardLayers';
import { DashboardTable } from '../dashboard/DashboardTable';

interface GlobalDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensors: Sensor[];
}

interface FlatTableRecord extends HistoricalData {
  sensorId: string;
  sensorName: string;
  unit: string;
}

interface MergedChartRecord {
  timestamp: number;
  [sensorId: string]: number; 
}

const SENSOR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export const GlobalDashboardModal: React.FC<GlobalDashboardModalProps> = ({ isOpen, onClose, sensors }) => {
  const { alerts, isConnected } = useWebSocket();

  // --- DASHBOARD STATES ---
  const sensorTypes = useMemo(() => Array.from(new Set(sensors.map(s => s.type))), [sensors]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [daysRange, setDaysRange] = useState<string>("7");
  // const [chartType, setChartType] = useState<"line" | "bar">("line");

  const [visibleSensors, setVisibleSensors] = useState<Record<string, boolean>>({});
  const [mergedChartData, setMergedChartData] = useState<MergedChartRecord[]>([]);
  const [flatTableData, setFlatTableData] = useState<FlatTableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"timestamp" | "value">("timestamp");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    if (isOpen && sensorTypes.length > 0 && !selectedType) {
      setSelectedType(sensorTypes[0]);
    }
  }, [isOpen, sensorTypes, selectedType]);

  const sensorsOfSelectedType = useMemo(() => sensors.filter(s => s.type === selectedType), [sensors, selectedType]);
  
  const uniqueBuildingsCount = useMemo(() => new Set(sensors.map(s => s.buildingId)).size, [sensors]);

  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    sensorsOfSelectedType.forEach(s => { initialVisibility[s.id] = true; });
    setVisibleSensors(initialVisibility);
  }, [selectedType, sensorsOfSelectedType]);

  // --- FETCH & MERGE DATA ---
  useEffect(() => {
    let ignore = false;
    const fetchMultiSensorData = async () => {
      if (!selectedType || sensorsOfSelectedType.length === 0) return;
      setIsLoading(true);
      
      try {
        const fetchPromises = sensorsOfSelectedType.map(sensor => 
          fetch(`http://localhost:3001/api/sensors/${sensor.id}/data?days=${daysRange}&limit=2000`)
            .then(res => res.json())
            .then(json => ({ sensorId: sensor.id, sensorName: sensor.name, unit: sensor.unit, history: json.history || [] }))
        );

        const results = await Promise.all(fetchPromises);
        if (ignore) return;

        const flatData: FlatTableRecord[] = [];
        const timeMap = new Map<number, MergedChartRecord>();

        results.forEach(({ sensorId, sensorName, unit, history }) => {
          history.forEach((point: HistoricalData) => {
            flatData.push({ ...point, sensorId, sensorName, unit });
            const timeKey = new Date(point.timestamp).setSeconds(0, 0); 
            if (!timeMap.has(timeKey)) timeMap.set(timeKey, { timestamp: timeKey });
            timeMap.get(timeKey)![sensorId] = point.value;
          });
        });

        const mergedArray = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        setMergedChartData(mergedArray);
        setFlatTableData(flatData);

      } catch (err) {
        if (!ignore) console.error("Failed to fetch multi-sensor data:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    if (isOpen) fetchMultiSensorData();
    return () => { ignore = true; };
  }, [isOpen, selectedType, daysRange, sensorsOfSelectedType]);

  // --- TABLE LOGIC ---
  const activeTableData = useMemo(() => {
    let data = flatTableData.filter(item => visibleSensors[item.sensorId] !== false);
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(item => 
        item.sensorName.toLowerCase().includes(lowerSearch) ||
        new Date(item.timestamp).toLocaleString().toLowerCase().includes(lowerSearch) ||
        item.value.toFixed(3).includes(lowerSearch)
      );
    }
    data.sort((a, b) => {
      const aVal = sortKey === "timestamp" ? new Date(a.timestamp).getTime() : a.value;
      const bVal = sortKey === "timestamp" ? new Date(b.timestamp).getTime() : b.value;
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [flatTableData, visibleSensors, searchTerm, sortKey, sortOrder]);

  const totalPages = Math.ceil(activeTableData.length / itemsPerPage);
  const paginatedData = activeTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchTerm, itemsPerPage, sortKey, sortOrder, visibleSensors, daysRange, selectedType]);

  const toggleSensorVisibility = (sensorId: string) => setVisibleSensors(prev => ({ ...prev, [sensorId]: !prev[sensorId] }));
  // const unitLabel = sensorsOfSelectedType[0]?.unit || "";
  const alertingSensorIds = useMemo(() => alerts.map(a => a.sensorId), [alerts]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
<DialogContent className="max-w-[98vw] sm:max-w-[98vw] w-full h-[98vh] flex flex-col p-0 bg-background overflow-hidden border-border rounded-xl transition-colors duration-200">
        <DialogTitle className="sr-only">Building Dashboard</DialogTitle>

        {/* Header */}
        <div className="border-b border-border bg-card shrink-0 transition-colors duration-200">
          <div className="flex h-16 items-center px-8">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
              <div className="bg-primary/10 p-1.5 rounded-md"><LayoutDashboard className="w-5 h-5 text-primary" /></div>
              Structure Analytics
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <Badge variant={isConnected ? "outline" : "destructive"} className="px-3 py-1.5 bg-background flex items-center gap-2 text-sm shadow-sm transition-colors duration-200">
                {isConnected ? (
                  <><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span> Live Sync Active</>
                ) : (
                  <><span className="relative flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span></span> Offline</>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <ScrollArea className="flex-1 bg-background transition-colors duration-200">
          <div className="flex-1 space-y-4 p-8 pt-6 w-full h-full text-foreground">
            
            {/* Dashboard Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="System Type" /></SelectTrigger>
                  <SelectContent>
                    {sensorTypes.map(type => (
                      <SelectItem key={type} value={type}>{type} ({sensors.filter(s => s.type === type).length})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={daysRange} onValueChange={setDaysRange}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 Hours</SelectItem><SelectItem value="3">Last 3 Days</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem><SelectItem value="30">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9"><Download className="mr-2 h-4 w-4" /> Download</Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Data Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <DashboardMetrics sensors={sensors} alertsCount={alerts.length} buildingsCount={uniqueBuildingsCount} />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <DashboardChart 
                    buildings={[]} 
                    availableTypes={sensorTypes}
                    chartSensors={sensorsOfSelectedType.filter(s => visibleSensors[s.id] !== false)}
                    mergedChartData={mergedChartData} 
                    isLoading={isLoading} 
                    selectedBuilding="all"
                    setSelectedBuilding={() => {}}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    daysRange={daysRange}
                    setDaysRange={setDaysRange}
                    sensorColors={SENSOR_COLORS} 
                  />
                  <DashboardLayers 
                    sensorsOfSelectedType={sensorsOfSelectedType} alertingSensorIds={alertingSensorIds} 
                    visibleSensors={visibleSensors} toggleSensorVisibility={toggleSensorVisibility} sensorColors={SENSOR_COLORS} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="m-0 mt-4 h-[600px] max-h-[65vh]">
                <DashboardTable 
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm} sortKey={sortKey} setSortKey={setSortKey} 
                  sortOrder={sortOrder} setSortOrder={setSortOrder} isLoading={isLoading} paginatedData={paginatedData} 
                  itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} currentPage={currentPage} 
                  setCurrentPage={setCurrentPage} totalPages={totalPages} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};