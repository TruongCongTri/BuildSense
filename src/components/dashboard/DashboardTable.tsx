import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HistoricalData } from '../../../shared/types'; 

export interface FlatTableRecord extends HistoricalData {
  sensorId: string;
  sensorName: string;
  unit: string;
}

interface DashboardTableProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortKey: "timestamp" | "value";
  setSortKey: (key: "timestamp" | "value") => void;
  sortOrder: "desc" | "asc";
  setSortOrder: (order: "desc" | "asc") => void;
  isLoading: boolean;
  paginatedData: FlatTableRecord[];
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({
  searchTerm, setSearchTerm, sortKey, setSortKey, sortOrder, setSortOrder,
  isLoading, paginatedData, itemsPerPage, setItemsPerPage, currentPage, setCurrentPage, totalPages
}) => {
  return (
    <Card className="border-border shadow-sm flex flex-col h-full bg-card transition-colors duration-200">
      <CardHeader className="flex flex-row items-center justify-between shrink-0 border-b border-border/50">
        <div>
          <CardTitle className="text-foreground">Aggregated Data Log</CardTitle>
          <CardDescription className="text-muted-foreground">Complete historical registry for selected system</CardDescription>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search sensor, date, value..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 bg-background border-input text-foreground transition-colors duration-200" 
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
        
        <div className="flex-1 overflow-auto w-full relative">
          <Table>
            <TableHeader className="bg-muted/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border transition-colors duration-200">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-10 cursor-pointer hover:bg-muted/80 w-[300px] text-muted-foreground transition-colors duration-200" onClick={() => { setSortKey("timestamp"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                  <div className="flex items-center text-foreground">Date & Time {sortKey === "timestamp" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-2" /> : <ArrowDown className="w-3 h-3 ml-2" />) : <ArrowUpDown className="w-3 h-3 ml-2 opacity-50" />}</div>
                </TableHead>
                <TableHead className="h-10 text-foreground">Sensor Source</TableHead>
                <TableHead className="h-10 text-right cursor-pointer hover:bg-muted/80 w-[200px] text-muted-foreground transition-colors duration-200" onClick={() => { setSortKey("value"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                  <div className="flex items-center justify-end text-foreground">Value {sortKey === "value" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-2" /> : <ArrowDown className="w-3 h-3 ml-2" />) : <ArrowUpDown className="w-3 h-3 ml-2 opacity-50" />}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {isLoading ? (
                 <TableRow><TableCell colSpan={3} className="h-48 text-center text-muted-foreground border-none">Loading log entries...</TableCell></TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <TableRow key={index} className="hover:bg-accent transition-colors duration-200 border-none">
                    <TableCell className="text-sm text-muted-foreground py-3">{new Date(record.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-sm text-foreground py-3">{record.sensorName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground py-3">{record.value.toFixed(3)} <span className="text-xs font-normal text-muted-foreground ml-1">{record.unit}</span></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="h-48 text-center text-muted-foreground border-none">No matching data found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pinned Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-muted/50 border-t border-border shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
              <SelectTrigger className="w-[70px] h-8 bg-background border-input text-foreground transition-colors duration-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
                <SelectItem value="5">5</SelectItem><SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem><SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};