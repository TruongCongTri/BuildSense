import React, { useEffect, useState, useMemo } from 'react';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { getSensorIcon } from '../../utils/iconMap';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [isTableOpen, setIsTableOpen] = useState(true);

  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartDays, setChartDays] = useState<string>("7");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const [tableData, setTableData] = useState<HistoricalData[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableDays, setTableDays] = useState<string>("7");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"timestamp" | "value">("timestamp");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, sortKey, sortOrder, tableDays, sensor]);

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
    <div 
      className={`absolute top-0 right-0 bottom-0 w-[420px] bg-[#111114] border-l border-gray-800 flex flex-col shadow-2xl z-40 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0 bg-[#111114]">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${sensor.markerColor === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {getSensorIcon(sensor.type, 18, 'currentColor')}
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide m-0">Selected Sensor</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MAGIC FIX: min-h-0 forces flexbox to respect the container height and allow scrolling */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        {/* MAGIC FIX: overflow-hidden ensures child contents don't stretch the width */}
        <div className="flex flex-col gap-6 p-5 w-full overflow-hidden">
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
      </ScrollArea>
    </div>
  );
};