import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Thermometer, Wind, Droplet, ShieldAlert, Waves, Lightbulb, Activity } from 'lucide-react';
import type { Building } from 'shared/types';

export interface FlatLogRecord {
  id: string; 
  timestamp: string;
  buildingId: string;
  buildingName: string;
  sensorId: string;
  type: string;
  value: number;
  unit: string;
  status: 'Active' | 'Inactive' | 'Maintenance'; 
}

interface DataLogTableProps {
  data: FlatLogRecord[];
  isLoading: boolean;
  buildings: Building[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  'Temperature': Thermometer, 'Wind': Wind, 'Humidity': Droplet,
  'Occupancy': Lightbulb, 'Air Quality': Waves, 'Structural Strain': ShieldAlert,
};

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

export const DataLogTable: React.FC<DataLogTableProps> = ({ data, isLoading, buildings }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL parameters
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const activeTypes = searchParams.getAll('type');
  const activeStatuses = searchParams.getAll('status');
  // Note: if you need buildingName vs building ID mapped here, you may need to adjust how you query buildings
  const activeBuildingIds = searchParams.getAll('building');
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = Number(searchParams.get('limit')) || 25;

  // 🌟 FIX: Translate URL Building IDs into Building Names
  const activeBuildingNames = useMemo(() => {
    return activeBuildingIds
      .map(id => buildings.find(b => b.id === id)?.name)
      .filter(Boolean); // removes any undefined values
  }, [activeBuildingIds, buildings]);

  // Filter Data based on URL Params Client-Side
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchSearch = !searchQuery || 
        row.buildingName.toLowerCase().includes(searchQuery) || 
        row.sensorId.toLowerCase().includes(searchQuery);
        
      const matchType = activeTypes.length === 0 || activeTypes.includes(row.type);
      const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(row.status);
      
      // 🌟 FIX: Compare the row's buildingName against our translated activeBuildingNames
      const matchBuilding = activeBuildingNames.length === 0 || activeBuildingNames.includes(row.buildingName);

      return matchSearch && matchType && matchStatus && matchBuilding;
    });
  }, [data, searchQuery, activeTypes, activeStatuses, activeBuildingNames]);

  // Calculate Pagination locally
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const paginationItems = generatePagination(currentPage, totalPages);
  
  // Slice current page data
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    setSearchParams(params);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">Active</span>;
      case 'Maintenance': return <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">Maintenance</span>;
      default: return <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#64748B]/10 text-[#94A3B8] border border-[#64748B]/20">Inactive</span>;
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-md min-w-0 min-h-0 transition-colors duration-200">
      
      <div className="flex-1 min-h-0 [&>div]:h-full [&>div]:overflow-auto [&>div::-webkit-scrollbar]:w-2 [&>div::-webkit-scrollbar-track]:bg-transparent [&>div::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&>div::-webkit-scrollbar-thumb]:rounded-full hover:[&>div::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
        <Table className="w-full table-fixed min-w-[800px]">
          <TableHeader className="bg-muted sticky top-0 z-20 shadow-sm border-b border-border transition-colors duration-200">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[170px] text-[11px] font-semibold text-muted-foreground tracking-wider h-11">TIMESTAMP</TableHead>
              <TableHead className="w-[200px] text-[11px] font-semibold text-muted-foreground tracking-wider h-11">BUILDING</TableHead>
              <TableHead className="w-[180px] text-[11px] font-semibold text-muted-foreground tracking-wider h-11">SENSOR ID</TableHead>
              <TableHead className="w-[150px] text-[11px] font-semibold text-muted-foreground tracking-wider h-11">TYPE</TableHead>
              <TableHead className="w-[110px] text-[11px] font-semibold text-muted-foreground tracking-wider h-11 text-right">VALUE</TableHead>
              <TableHead className="w-[120px] text-[11px] font-semibold text-muted-foreground tracking-wider h-11 text-center">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground border-none">Loading records...</TableCell></TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground border-none">No records found matching filters.</TableCell></TableRow>
            ) : (
              paginatedData.map((row) => {
                const Icon = TYPE_ICONS[row.type] || Activity;
                return (
                  <TableRow key={row.id} className="border-b border-border/50 hover:bg-accent transition-colors duration-200">
                    <TableCell className="text-[13px] text-muted-foreground font-medium py-3.5 truncate" title={row.timestamp}>{row.timestamp}</TableCell>
                    <TableCell className="text-[13px] text-foreground truncate" title={row.buildingName}>{row.buildingName}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground font-mono truncate" title={row.sensorId}>{row.sensorId}</TableCell>
                    <TableCell className="text-[13px] text-foreground truncate" title={row.type}>
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{row.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] font-bold text-foreground text-right font-mono truncate" title={row.value ? `${row.value.toFixed(2)} ${row.unit}` : '--'}>
                      {row.value === null ? '--' : <>{row.value.toFixed(2)} <span className="text-[11px] text-muted-foreground font-normal ml-0.5">{row.unit}</span></>}
                    </TableCell>
                    <TableCell className="text-center truncate">{getStatusBadge(row.status)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/50 shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted-foreground">Rows per page:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(val) => {
              const params = new URLSearchParams(searchParams);
              params.set('limit', val);
              params.set('page', '1'); 
              setSearchParams(params);
            }}
          >
            <SelectTrigger className="w-[70px] h-8 bg-background border-input text-[12px] text-foreground transition-colors duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-6 text-[12px] text-muted-foreground">
          <span>{totalRecords === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalRecords)}-{Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords.toLocaleString()}</span>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors" disabled={currentPage <= 1 || totalPages === 0} onClick={() => updateUrlParam('page', Math.max(1, currentPage - 1).toString())}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {paginationItems.map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="flex items-center justify-center h-8 w-8 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "ghost"}
                  className={`h-8 w-8 text-[12px] transition-colors ${currentPage === page ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => updateUrlParam('page', page.toString())}
                >
                  {page}
                </Button>
              )
            ))}

            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => updateUrlParam('page', Math.min(totalPages, currentPage + 1).toString())}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};