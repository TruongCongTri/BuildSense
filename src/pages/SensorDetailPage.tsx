import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Activity, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Sensor, HistoricalData } from "shared/types";
import { SensorMetadata } from "@/components/sensor/SensorMetadata";
import { SensorDetailFilters } from "@/components/sensor/SensorDetailsFilters";
import { SensorDetailTable } from "@/components/sensor/SensorDetailsTable";
import { SensorDetailChart } from "@/components/sensor/SensorDetailsChart";

  // Safely parses dates whether they are numbers, epoch strings, or ISO strings
const safeGetTime = (val: string | number): number => {
  if (!val) return 0;
  const num = Number(val);
  if (!isNaN(num)) return num; // Handles 1773160661827 and "1773160661827"
  return new Date(val).getTime(); // Handles "2026-03-08T..."
};

export const SensorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedReading, setSelectedReading] = useState<HistoricalData | null>(null);

  const [referenceTime] = useState(() => Date.now());

  // Extracted to a useCallback so the Refresh Button can trigger it!
  const fetchSensorData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch("http://localhost:3001/api/sensors").then(res => res.json()),
        fetch(`http://localhost:3001/api/sensors/${id}/data?days=30&limit=5000`).then(res => res.json())
      ]);
      
      const foundSensor = (sRes.sensors || []).find((s: Sensor) => s.id === id);
      setSensor(foundSensor || null);
      
      const historyData = hRes.history || [];
      // Sort newest first
      historyData.sort((a: HistoricalData, b: HistoricalData) => safeGetTime(b.timestamp) - safeGetTime(a.timestamp));
      setHistory(historyData);

      // Auto-open modal if URL provided a specific time
      const timeQuery = searchParams.get('time');
      if (timeQuery && historyData.length > 0) {
        const targetReading = historyData.find((h: HistoricalData) => new Date(h.timestamp).getTime().toString() === timeQuery);
        if (targetReading) setSelectedReading(targetReading);
      }
    } catch (error) {
      console.error("Failed to fetch sensor details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);



  // Standalone Effect to sync the URL '?time=' parameter to the Modal State!
  useEffect(() => {
    const timeQuery = searchParams.get('time');
    
    if (timeQuery && history.length > 0) {
      const queryMs = Number(timeQuery);

      const targetReading = history.find((h: HistoricalData) => {
        const hMs = safeGetTime(h.timestamp);
        // Allow a 1-second margin of error in case string formatting dropped the exact milliseconds
        return Math.abs(hMs - queryMs) < 1000;
      });
      
      if (targetReading) {
        setSelectedReading(targetReading);
      }
    } else if (!timeQuery && selectedReading) {
      setSelectedReading(null);
    }
  }, [searchParams, history]);

  // Handles opening the modal AND updating the URL so it can be shared/bookmarked
  const handleOpenReading = (reading: HistoricalData) => {
    const params = new URLSearchParams(searchParams);
    params.set('time', new Date(reading.timestamp).getTime().toString());
    setSearchParams(params);
  };

  // Handles closing the modal AND cleaning up the URL
  const handleCloseReading = () => {
    const params = new URLSearchParams(searchParams);
    if (params.has('time')) {
      params.delete('time');
      setSearchParams(params, { replace: true });
    }
    setSelectedReading(null);
  };

  // UNIFIED FILTER LOGIC: Filters once, passes to both Chart and Table
  const filteredHistory = useMemo(() => {
    const activeDateRange = searchParams.get('dateRange');
    const activeAdmin = searchParams.getAll('adminStatus');
    const activeHealth = searchParams.getAll('healthStatus');
    const activeData = searchParams.getAll('dataStatus');

    return history.filter(row => {
      let matchDate = true;
      if (activeDateRange) {
        const rowTime = safeGetTime(row.timestamp);
        const diffDays = (referenceTime - rowTime) / (1000 * 60 * 60 * 24);
        matchDate = diffDays <= parseInt(activeDateRange, 10);
      }
      
      const matchAdmin = activeAdmin.length === 0 || activeAdmin.includes(row.adminStatus);
      const matchHealth = activeHealth.length === 0 || activeHealth.includes(row.healthStatus);
      const matchData = activeData.length === 0 || activeData.includes(row.dataStatus);

      return matchDate && matchAdmin && matchHealth && matchData;
    });
  }, [history, searchParams, referenceTime]);
  
  // Helper for Modal Dialog rendering
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

  if (!sensor && !isLoading) return <div className="p-8 text-destructive">Sensor not found.</div>;

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden transition-colors duration-200">
      <div className="p-6 md:p-8 flex flex-col gap-6 flex-1 min-h-0">
        
        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 border-border bg-card hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-foreground flex items-center gap-3">
                {sensor ? sensor.name : "Loading..."} 
                {sensor && (
                  <span className="text-lg font-mono text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-md border border-border">
                    {sensor.id}
                  </span>
                )}
              </h1>
            </div>
          </div>
          
          {/* Added Refresh Button */}
          <Button 
            className="bg-primary text-primary-foreground hover:opacity-90 text-[13px] h-9 transition-colors" 
            onClick={fetchSensorData}
            disabled={isLoading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {sensor && <SensorMetadata sensor={sensor} />}

        <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 w-full overflow-hidden">
          
          {/* 1. FILTERS (Far Left): Don't shrink, stay fixed */}
          <div className="h-full shrink-0">
            <SensorDetailFilters />
          </div>
          
          {sensor && (
            <>
              {/* 2. TABLE (Middle): Resizable width, starts at 50% */}
              <div className="xl:resize-x overflow-hidden flex flex-col xl:w-[50%] min-w-[350px] max-w-full h-full pb-2 xl:pb-0 pr-2 shrink-0">
                <SensorDetailTable 
                  data={filteredHistory} 
                  sensor={sensor} 
                  isLoading={isLoading} 
                  onRowClick={handleOpenReading} 
                />
              </div>

              {/* 3. CHART (Far Right): Takes up all remaining flexible space */}
              <div className="flex-1 min-w-0 flex flex-col h-full">
                <SensorDetailChart data={filteredHistory} sensor={sensor} />
              </div>
            </>
          )}
          
        </div>
      </div>

      <Dialog open={!!selectedReading} onOpenChange={(isOpen) => { if (!isOpen) handleCloseReading(); }}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Specific Reading Data
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {selectedReading ? new Date(safeGetTime(selectedReading.timestamp)).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReading && sensor && (
            <div className="space-y-6 pt-4">
              <div className="bg-muted p-6 rounded-xl text-center border border-border/50 shadow-inner">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-2">Recorded Value</p>
                <div className="text-5xl font-extrabold tracking-tight text-foreground font-mono">
                  {selectedReading.healthStatus === 'Offline' ? 'OFFLINE' : selectedReading.value.toFixed(3)}
                  {selectedReading.healthStatus !== 'Offline' && <span className="text-2xl text-muted-foreground ml-2 font-sans">{sensor.unit}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Sensor Health at time</span>
                  <div>{getStatusBadge(selectedReading.healthStatus, 'health')}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Data Alert at time</span>
                  <div>{getStatusBadge(selectedReading.dataStatus, 'data')}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};