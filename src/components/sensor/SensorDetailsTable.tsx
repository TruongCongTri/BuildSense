import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HistoricalData, Sensor } from '../../../shared/types';

interface SensorDetailTableProps {
  data: HistoricalData[];
  sensor: Sensor;
  isLoading: boolean;
  onRowClick: (reading: HistoricalData) => void;
}

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

export const SensorDetailTable: React.FC<SensorDetailTableProps> = ({ data, sensor, isLoading, onRowClick }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  // const [referenceTime] = useState(() => Date.now());
    
  // const activeDateRange = searchParams.get('dateRange');
  // const activeAdmin = searchParams.getAll('adminStatus');
  // const activeHealth = searchParams.getAll('healthStatus');
  // const activeData = searchParams.getAll('dataStatus');
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = Number(searchParams.get('limit')) || 25;
  
  // const filteredData = useMemo(() => {
  //   return data.filter(row => {
  //     let matchDate = true;

  //     if (activeDateRange) {
  //       const rowTime = new Date(row.timestamp).getTime();
  //       const diffDays = (referenceTime - rowTime) / (1000 * 60 * 60 * 24);
  //       matchDate = diffDays <= parseInt(activeDateRange, 10);
  //     }
      
  //     const matchAdmin = activeAdmin.length === 0 || activeAdmin.includes(row.adminStatus);
  //     const matchHealth = activeHealth.length === 0 || activeHealth.includes(row.healthStatus);
  //     const matchData = activeData.length === 0 || activeData.includes(row.dataStatus);

  //     return matchDate && matchAdmin && matchHealth && matchData;
  //   });
  // }, [data, activeDateRange, activeAdmin, activeHealth, activeData, referenceTime]);

  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const paginationItems = generatePagination(currentPage, totalPages);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    setSearchParams(params);
  };

  const getStatusBadge = (status: string, type: 'health' | 'data') => {
    if (type === 'health') {
      if (status === 'Offline' || status === 'Error') return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase">{status}</Badge>;
      if (status === 'Warning') return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase">Warning</Badge>;
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Healthy</Badge>;
    } else {
      if (status === 'Critical') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase">Critical</Badge>;
      if (status === 'Warning') return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase">Warning</Badge>;
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Normal</Badge>;
    }
  };

  return (
<div className="flex flex-col w-full h-full bg-card border border-border rounded-xl overflow-hidden shadow-md min-w-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">        <div className="flex-1 min-h-0 [&>div]:h-full [&>div]:overflow-auto [&>div::-webkit-scrollbar]:w-2 [&>div::-webkit-scrollbar-track]:bg-transparent [&>div::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&>div::-webkit-scrollbar-thumb]:rounded-full hover:[&>div::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
          <div className="flex-1 min-h-0 [&>div]:h-full [&>div]:overflow-auto [&>div::-webkit-scrollbar]:w-2 [&>div::-webkit-scrollbar-track]:bg-transparent [&>div::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&>div::-webkit-scrollbar-thumb]:rounded-full hover:[&>div::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
          
          <Table className="w-full table-fixed min-w-[600px]">
            <TableHeader className="bg-muted sticky top-0 z-20 shadow-sm border-b border-border">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[200px] text-[11px] font-semibold text-muted-foreground">TIMESTAMP</TableHead>
                <TableHead className="w-[120px] text-[11px] font-semibold text-muted-foreground text-center">HEALTH</TableHead>
                <TableHead className="w-[120px] text-[11px] font-semibold text-muted-foreground text-center">ALERT</TableHead>
                <TableHead className="text-right text-[11px] font-semibold text-muted-foreground pr-6">RECORDED VALUE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground border-none">Loading history...</TableCell></TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground border-none">No historical records found for these filters.</TableCell></TableRow>
              ) : (
                paginatedData.map((row, i) => (
                  <TableRow 
                    key={i} 
                    onClick={() => onRowClick(row)}
                    className="border-b border-border/50 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <TableCell className="text-[13px] text-muted-foreground font-medium py-3.5">
                      {new Date(row.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(row.healthStatus, 'health')}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(row.dataStatus, 'data')}</TableCell>
                    <TableCell className={`text-[13px] font-bold text-right font-mono pr-6 ${row.healthStatus === 'Offline' ? 'text-muted-foreground/50' : ''}`}>
                      {row.healthStatus === 'Offline' ? '--' : `${row.value.toFixed(2)} `}
                      {row.healthStatus !== 'Offline' && <span className="text-[11px] font-normal text-muted-foreground">{sensor.unit}</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/50 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground">Rows per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => { const params = new URLSearchParams(searchParams); params.set('limit', val); params.set('page', '1'); setSearchParams(params); }}>
              <SelectTrigger className="w-[70px] h-8 bg-background border-input text-[12px] text-foreground transition-colors duration-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
                <SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-muted-foreground">
            <span>{totalRecords === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalRecords)}-{Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords.toLocaleString()}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground" disabled={currentPage <= 1 || totalPages === 0} onClick={() => updateUrlParam('page', Math.max(1, currentPage - 1).toString())}><ChevronLeft className="h-4 w-4" /></Button>
              {paginationItems.map((page, idx) => (
                page === '...' ? <span key={`ellipsis-${idx}`} className="flex items-center justify-center h-8 w-8 text-muted-foreground">...</span> :
                <Button key={`page-${page}`} variant={currentPage === page ? "default" : "ghost"} className={`h-8 w-8 text-[12px] ${currentPage === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`} onClick={() => updateUrlParam('page', page.toString())}>{page}</Button>
              ))}
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => updateUrlParam('page', Math.min(totalPages, currentPage + 1).toString())}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        </div></div>
  );
};