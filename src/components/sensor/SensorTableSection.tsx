import React from 'react';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface SensorTableSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  paginatedData: HistoricalData[];
  isLoading: boolean;
  tableDays: string;
  setTableDays: (days: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortKey: "timestamp" | "value";
  sortOrder: "desc" | "asc";
  toggleSort: (key: "timestamp" | "value") => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
}

export const SensorTableSection: React.FC<SensorTableSectionProps> = ({
  sensor, isOpen, onToggle, paginatedData, isLoading, tableDays, setTableDays,
  searchTerm, setSearchTerm, sortKey, sortOrder, toggleSort,
  currentPage, setCurrentPage, totalPages, itemsPerPage, setItemsPerPage
}) => {
  const getSortIcon = (key: "timestamp" | "value") => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-sm cursor-pointer" onClick={() => onToggle(!isOpen)}>
          <FileText className="w-4 h-4 text-muted-foreground" /> Raw Data Log
        </div>
        <div className="flex items-center gap-2">
          <Select value={tableDays} onValueChange={setTableDays}>
            <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">24 Hours</SelectItem>
              <SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      
      <CollapsibleContent className="px-6 pb-6 pt-2">
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search date, time, or value..." 
            className="pl-9 h-9 text-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading table data...</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 border-b">
                <TableRow>
                  <TableHead className="h-9 cursor-pointer hover:bg-muted transition-colors" onClick={() => toggleSort("timestamp")}>
                    <div className="flex items-center">Date & Time {getSortIcon("timestamp")}</div>
                  </TableHead>
                  <TableHead className="h-9 text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => toggleSort("value")}>
                    <div className="flex items-center justify-end">Value ({sensor.unit}) {getSortIcon("value")}</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((record) => (
                    <TableRow key={record.timestamp}>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-xs font-medium font-mono">
                        {record.value.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No results found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
                  <SelectTrigger className="w-[65px] h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};