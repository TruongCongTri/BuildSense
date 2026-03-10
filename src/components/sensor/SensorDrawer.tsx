import React, { useEffect, useState, useMemo } from 'react';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { getSensorIcon } from '../../utils/iconMap';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { useWebSocket } from '@/hooks/useWebSocket';

// Child Components
import { SensorDetailsSection } from './SensorDetailsSection';
import { SensorChartSection } from './SensorChartSection';
import { SensorTableSection } from './SensorTableSection';

interface SensorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sensor: Sensor | null;
  onTimePlay?: (timestamp: number) => void; 
}

export const SensorDrawer: React.FC<SensorDrawerProps> = ({ isOpen, onClose, sensor, onTimePlay }) => {
  const { liveValues } = useWebSocket();

  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [isTableOpen, setIsTableOpen] = useState(false);

  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  
  // Calendar State (Defaults to Today)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  const [tableData, setTableData] = useState<HistoricalData[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableDateRange, setTableDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"timestamp" | "value">("timestamp");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🌟 THE FIX: Unified Sensor Reset Logic
  // Whenever the user clicks a different sensor, this safely resets BOTH calendars back to "Today"
  useEffect(() => {
    if (sensor?.id) {
      const today = new Date();
      setDateRange({ from: today, to: today }); 
      setTableDateRange({ from: today, to: today }); 
    }
  }, [sensor?.id]);

  // 1. FETCH CHART DATA
  useEffect(() => {
    let ignore = false;
    const fetchChartData = async () => {
      setIsChartLoading(true);
      try {
        // Calculate how many days back we need to fetch from the server
        let daysToFetch = 1;
        if (dateRange?.from) {
          const diffTime = Math.abs(Date.now() - dateRange.from.getTime());
          daysToFetch = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const response = await fetch(`http://localhost:3001/api/sensors/${sensor?.id}/data?days=${daysToFetch}&limit=5000`);
        const json = await response.json();
        
        if (!ignore && json.metadata && !json.metadata.error) {
          const sortedData = json.history.sort((a: HistoricalData, b: HistoricalData) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setChartData(sortedData);
        }
      } catch (err) {
        if (!ignore) console.error("Failed to fetch chart history:", err);
      } finally {
        if (!ignore) setIsChartLoading(false);
      }
    };
    if (isOpen && sensor) fetchChartData();
    return () => { ignore = true; };
  }, [isOpen, sensor, dateRange]);

  // 2. FETCH TABLE DATA
  useEffect(() => {
    let ignore = false;
    const fetchTableData = async () => {
      setIsTableLoading(true);
      try {
        let daysToFetch = 1;
        if (tableDateRange?.from) {
          const diffTime = Math.abs(Date.now() - tableDateRange.from.getTime());
          daysToFetch = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const response = await fetch(`http://localhost:3001/api/sensors/${sensor?.id}/data?days=${daysToFetch}&limit=2000`);
        const json = await response.json();
        if (!ignore && json.metadata && !json.metadata.error) {
          setTableData(json.history);
        }
      } catch (err) {
        if (!ignore) console.error("Failed to fetch table history:", err);
      } finally {
        if (!ignore) setIsTableLoading(false);
      }
    };
    if (isOpen && sensor) fetchTableData();
    return () => { ignore = true; };
  }, [isOpen, sensor, tableDateRange]);

  // 3. INJECT LIVE DATA INTO CHART AND TABLE
  useEffect(() => {
    if (isOpen && sensor && liveValues[sensor.id]) {
      const newLiveValue = liveValues[sensor.id].value;
      const currentTimestamp = Date.now();

      const newPoint: HistoricalData = {
        timestamp: currentTimestamp.toString(),
        value: newLiveValue,
        unit: sensor.unit 
      };

      setChartData(prevData => {
        if (prevData.length === 0) return prevData;
        const lastTime = Number(prevData[prevData.length - 1].timestamp);
        if (currentTimestamp - lastTime < 1000) return prevData;
        return [...prevData, newPoint];
      });

      setTableData(prevData => {
        if (prevData.length === 0) return prevData;
        const lastTime = Number(prevData[0].timestamp); // Table is usually sorted desc initially
        if (Math.abs(currentTimestamp - lastTime) < 1000) return prevData;
        return [newPoint, ...prevData]; 
      });
    }
  }, [liveValues, sensor, isOpen]);

  // Table sorting logic...
  const processedTableData = useMemo(() => {
    let data = [...tableData];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(item => 
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
  }, [tableData, searchTerm, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedTableData.length / itemsPerPage);
  const paginatedData = processedTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (key: "timestamp" | "value") => {
    if (sortKey === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortOrder("desc"); }
  };

  if (!sensor) return null;

  // CALCULATE LIVE METRICS FOR THE WIDGET
  const currentLiveData = liveValues[sensor.id];
  
  // Use live data if available. If not, fallback to the very last point of the historical chart data!
  const displayValue = currentLiveData?.value ?? (
    chartData.length > 0 ? chartData[chartData.length - 1].value : null
  );
  
  // Basic threshold logic for dynamic status colors
  const isCritical = displayValue !== null && (
    (sensor.type === "Load" && displayValue > 22) || 
    (sensor.type === "Strain" && displayValue > 150)
  );

  return (
    <div className={`absolute top-0 right-0 bottom-0 w-[440px] bg-background border-l border-border flex flex-col shadow-2xl z-40 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-background transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${sensor.markerColor === 'red' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {getSensorIcon(sensor.type, 18, 'currentColor')}
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-wide m-0">Live Analysis</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="flex flex-col gap-6 p-5 w-full overflow-hidden">
          
          <div className="bg-card border border-border rounded-xl p-5 shadow-md flex items-center justify-between relative overflow-hidden">
            {/* Background accent glow based on status */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${isCritical ? 'bg-destructive' : 'bg-primary'}`}></div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-destructive' : 'bg-green-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCritical ? 'bg-destructive' : 'bg-green-500'}`}></span>
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Reading</span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground tracking-tight tabular-nums">
                  {displayValue !== null ? displayValue.toFixed(2) : "..."}
                </span>
                <span className="text-lg font-medium text-muted-foreground">
                  {sensor.unit}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isCritical 
                  ? 'bg-destructive/10 text-destructive border-destructive/20' 
                  : 'bg-green-500/10 text-green-600 border-green-500/20'
              }`}>
                <Activity className="w-3.5 h-3.5" />
                {isCritical ? 'WARNING' : 'NORMAL'}
              </div>
            </div>
          </div>
          <SensorDetailsSection sensor={sensor} isOpen={isDetailsOpen} onToggle={setIsDetailsOpen} />
          
          <SensorChartSection 
            sensor={sensor} 
            isOpen={isChartOpen} 
            onToggle={setIsChartOpen} 
            chartData={chartData} 
            isLoading={isChartLoading} 
            dateRange={dateRange}        
            setDateRange={setDateRange}  
            onTimePlay={onTimePlay} 
          />
          
          <SensorTableSection 
            sensor={sensor} isOpen={isTableOpen} onToggle={setIsTableOpen} 
            paginatedData={paginatedData} isLoading={isTableLoading} 
            dateRange={tableDateRange} setDateRange={setTableDateRange}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
            sortKey={sortKey} sortOrder={sortOrder} toggleSort={toggleSort} 
            currentPage={currentPage} setCurrentPage={setCurrentPage} 
            totalPages={totalPages} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} 
          />
        </div>
      </ScrollArea>
    </div>
  );
};