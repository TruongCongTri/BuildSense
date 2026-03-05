import React, { useEffect, useState, useMemo } from 'react';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { getSensorIcon } from '../../utils/iconMap';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Child Components
import { SensorDetailsSection } from './SensorDetailsSection';
import { SensorChartSection } from './SensorChartSection';
import { SensorTableSection } from './SensorTableSection';

interface SensorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sensor: Sensor | null;
}

export const SensorDrawer: React.FC<SensorDrawerProps> = ({ isOpen, onClose, sensor }) => {
  // --- UI TOGGLE STATES ---
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [isTableOpen, setIsTableOpen] = useState(true);

  // --- CHART STATES ---
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartDays, setChartDays] = useState<string>("7");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // --- TABLE STATES ---
  const [tableData, setTableData] = useState<HistoricalData[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableDays, setTableDays] = useState<string>("7");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"timestamp" | "value">("timestamp");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- FETCH CHART DATA ---
  useEffect(() => {
    let ignore = false;
    const fetchChartData = async () => {
      setIsChartLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/sensors/${sensor?.id}/data?days=${chartDays}&limit=2000`);
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
  }, [isOpen, sensor, chartDays]);

  // --- FETCH TABLE DATA ---
  useEffect(() => {
    let ignore = false;
    const fetchTableData = async () => {
      setIsTableLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/sensors/${sensor?.id}/data?days=${tableDays}&limit=2000`);
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
  }, [isOpen, sensor, tableDays]);

  // --- RESET PAGE ON FILTER CHANGE ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, sortKey, sortOrder, tableDays, sensor]);

  // --- TABLE MEMOIZATION & PAGINATION LOGIC ---
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[450px] sm:w-[600px] p-0 flex flex-col bg-background overflow-hidden border-l">
        
        {/* Header */}
        <SheetHeader className="p-6 border-b bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${sensor.markerColor === 'red' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {getSensorIcon(sensor.type, 20, 'currentColor')}
            </div>
            <SheetTitle className="text-xl tracking-tight">{sensor.name}</SheetTitle>
          </div>
        </SheetHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-6">
          <SensorDetailsSection sensor={sensor} isOpen={isDetailsOpen} onToggle={setIsDetailsOpen} />
          
          <SensorChartSection 
            sensor={sensor} isOpen={isChartOpen} onToggle={setIsChartOpen} 
            chartData={chartData} isLoading={isChartLoading} 
            chartDays={chartDays} setChartDays={setChartDays} 
            chartType={chartType} setChartType={setChartType} 
          />
          
          <SensorTableSection 
            sensor={sensor} isOpen={isTableOpen} onToggle={setIsTableOpen} 
            paginatedData={paginatedData} isLoading={isTableLoading} 
            tableDays={tableDays} setTableDays={setTableDays} 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
            sortKey={sortKey} sortOrder={sortOrder} toggleSort={toggleSort} 
            currentPage={currentPage} setCurrentPage={setCurrentPage} 
            totalPages={totalPages} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} 
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};