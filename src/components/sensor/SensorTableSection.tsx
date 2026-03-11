import React from "react";
import type { Sensor, HistoricalData } from "../../../shared/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Search,
  List,
  CalendarIcon,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Badge } from "../ui/badge";

const formatShortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

interface SensorTableSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  paginatedData: HistoricalData[];
  isLoading: boolean;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
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
  onRowClick: (timestamp: number) => void;
}

export const SensorTableSection: React.FC<SensorTableSectionProps> = ({
  sensor,
  isOpen,
  onToggle,
  paginatedData,
  isLoading,
  dateRange, 
  setDateRange,
  searchTerm,
  setSearchTerm,
  sortKey,
  toggleSort,
  currentPage,
  setCurrentPage,
  totalPages,
  onRowClick
}) => {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusBadge = (record: any) => {
    if (record.adminStatus === 'Maintenance') return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Maint.</Badge>;
    if (record.healthStatus === 'Offline' || record.healthStatus === 'Error') return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px]">Offline</Badge>;
    if (record.dataStatus === 'Critical') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Critical</Badge>;
    if (record.dataStatus === 'Warning') return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Warning</Badge>;
    return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Normal</Badge>;
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-3 focus:outline-none">
          <List className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Raw Data Log</h3>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        
        {/* CALENDAR POPOVER FOR TABLE */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs justify-start text-left font-normal w-auto min-w-[160px] pr-3 bg-card border-border hover:bg-accent/50">
              <CalendarIcon className="mr-2 h-3 w-3" />
              {dateRange?.from ? (
                dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime() ? (
                  `${formatShortDate(dateRange.from)} - ${formatShortDate(dateRange.to)}`
                ) : (
                  formatShortDate(dateRange.from)
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-popover border-border shadow-xl rounded-xl" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => { if (range) setDateRange(range); }}
              numberOfMonths={1}
              disabled={(date) => date.getTime() > Date.now()} 
            />
          </PopoverContent>
        </Popover>
      </div>

      <CollapsibleContent className="w-full space-y-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search values or dates..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 h-9 bg-card border-border text-xs focus-visible:ring-1 focus-visible:ring-primary transition-colors duration-200" 
          />
        </div>

        <Card className="overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto ">
              <Table >
                <TableHeader className="bg-muted/50 ">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="h-9 py-2 cursor-pointer hover:text-primary transition-colors group" onClick={() => toggleSort("timestamp")}>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        Timestamp
                        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortKey === 'timestamp' ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50'}`} />
                      </div>
                    </TableHead>
                    <TableHead className="h-9 py-2 text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="h-9 py-2 cursor-pointer hover:text-primary transition-colors group text-right" onClick={() => toggleSort("value")}>
                      <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortKey === 'value' ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50'}`} />
                        Value ({sensor.unit})
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs">Loading data...</TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs">No records found.</TableCell></TableRow>
                  ) : (
                    paginatedData.map((record, idx) => {
                      const timestampNum = Number(record.timestamp);
                      const date = new Date(Number(record.timestamp));
                      const timeString = date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                      const isOffline = record.healthStatus === 'Offline' || record.adminStatus === 'Maintenance';

                      return (
                        <TableRow key={`${record.timestamp}-${idx}`} 
                        onClick={() => onRowClick(timestampNum)}
                        className="border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                          <TableCell className="py-2.5 text-xs text-muted-foreground font-medium">{timeString}</TableCell>
                          {/* Renders dynamic badge */}
                          <TableCell className="py-2.5 text-center">{getStatusBadge(record)}</TableCell>
                          <TableCell className={`py-2.5 text-xs text-right font-semibold ${isOffline ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                            {isOffline ? '--' : record.value.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6 border-border hover:bg-muted" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-6 w-6 border-border hover:bg-muted" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
