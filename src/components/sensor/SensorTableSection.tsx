import React from "react";
import type { Sensor, HistoricalData } from "../../../shared/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

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
  sensor,
  isOpen,
  onToggle,
  paginatedData,
  isLoading,
  searchTerm,
  setSearchTerm,
  sortKey,
  sortOrder,
  toggleSort,
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
  const getSortIcon = (key: "timestamp" | "value") => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-gray-400" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-gray-400" />
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <CollapsibleTrigger className="flex items-center gap-3 focus:outline-none">
          <TableIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Raw Data</h3>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          Export CSV
        </button>
      </div>

      <CollapsibleContent>
        {/* Table Container */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg transition-colors duration-200">
          <div className="p-3 border-b border-border bg-muted/50 transition-colors duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-9 h-8 text-sm bg-background border-input text-foreground placeholder:text-muted-foreground transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <Table className="w-full min-w-[350px]">
              <TableHeader className="bg-muted/50 border-b border-border transition-colors duration-200">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead
                    className="text-muted-foreground text-xs font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("timestamp")}
                  >
                    <div className="flex items-center">
                      Time {getSortIcon("timestamp")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-muted-foreground text-xs font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("value")}
                  >
                    <div className="flex items-center">
                      Value {getSortIcon("value")}
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/50">
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground border-none"
                    >
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((record) => {
                    const date = new Date(record.timestamp);
                    const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const isWarning = sensor.type === "Temperature" && record.value > 24.0;

                    return (
                      <TableRow
                        key={record.timestamp}
                        className="hover:bg-accent transition-colors group border-none"
                      >
                        <TableCell className="text-muted-foreground py-3">
                          {timeString}
                        </TableCell>
                        <TableCell className={`font-medium py-3 ${isWarning ? "text-destructive" : "text-foreground"}`}>
                          {record.value.toFixed(1)} {sensor.unit}
                        </TableCell>
                        <TableCell className="py-3">
                          {isWarning ? (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase hover:bg-destructive/20">
                              Warn
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase hover:bg-emerald-500/20">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground border-none"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer / Pagination */}
          <div className="px-4 py-3 border-t border-border flex justify-between items-center bg-muted/50 transition-colors duration-200">
            <span className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalPages * 10)}
            </span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
                ‹
              </button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
                ›
              </button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
