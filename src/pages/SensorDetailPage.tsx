import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Clock, Activity, Tag, MapPin, 
  Settings2, ShieldCheck, ShieldAlert, WifiOff 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Sensor, HistoricalData } from "shared/types";

export const SensorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedReading, setSelectedReading] = useState<HistoricalData | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchSensorData = async () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      
      try {
        const [sRes, hRes] = await Promise.all([
          fetch("http://localhost:3001/api/sensors").then(res => res.json()),
          fetch(`http://localhost:3001/api/sensors/${id}/data?days=7&limit=500`).then(res => res.json())
        ]);
        
        if (!isMounted) return;

        const foundSensor = (sRes.sensors || []).find((s: Sensor) => s.id === id);
        setSensor(foundSensor || null);
        
        const historyData = hRes.history || [];
        setHistory(historyData);

        const timeQuery = searchParams.get('time');
        if (timeQuery && historyData.length > 0) {
          const targetReading = historyData.find((h: HistoricalData) => new Date(h.timestamp).getTime().toString() === timeQuery);
          if (targetReading) setSelectedReading(targetReading);
        }
      } catch (error) {
        console.error("Failed to fetch sensor details:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSensorData();
    return () => { isMounted = false; };
  }, [id, searchParams]);

  const getStatusBadge = (status: string, type: 'health' | 'data' | 'admin') => {
    switch (type) {
      case 'admin':
        if (status === 'Maintenance') return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase">Maint.</Badge>;
        if (status === 'Active') return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Active</Badge>;
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase">{status}</Badge>;
        
      case 'health':
        if (status === 'Offline' || status === 'Error') return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase">{status}</Badge>;
        if (status === 'Warning') return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase">Warning</Badge>;
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Healthy</Badge>;
        
      case 'data':
        if (status === 'Critical') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase">Critical</Badge>;
        if (status === 'Warning') return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase">Warning</Badge>;
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Normal</Badge>;
        
      default:
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading sensor data...</div>;
  if (!sensor) return <div className="p-8 text-destructive">Sensor not found.</div>;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col bg-background gap-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 border-border bg-card hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground flex items-center gap-3">
            {sensor.name} 
            <span className="text-lg font-mono text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-md border border-border">
              {sensor.id}
            </span>
          </h1>
        </div>
      </div>

      {/* Sensor Metadata (Mimicking DashboardMetrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Sensor Type */}
        <Card className="bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
          <CardContent className="p-6">
            <div className="relative z-10 space-y-2">
              <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Sensor Type</p>
              <div className="text-3xl font-bold text-foreground tracking-tight">{sensor.type}</div>
            </div>
            <Tag className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-primary" strokeWidth={1.5} />
            <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">
              Measuring in {sensor.unit}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Location */}
        <Card className="bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-500/50">
          <CardContent className="p-6">
            <div className="relative z-10 space-y-2">
              <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Deployment Location</p>
              <div className="text-3xl font-bold text-foreground tracking-tight truncate" title={sensor.location}>{sensor.location}</div>
            </div>
            <MapPin className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-blue-500" strokeWidth={1.5} />
            <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">
              Building ID: {sensor.buildingId}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Admin Status */}
        <Card className={`bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${sensor.adminStatus === 'Active' ? 'hover:border-emerald-500/50' : 'hover:border-amber-500/50'}`}>
          <CardContent className="p-6">
            <div className="relative z-10 space-y-2">
              <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Admin Status</p>
              <div className="text-3xl font-bold text-foreground tracking-tight mt-1">
                {sensor.adminStatus}
              </div>
            </div>
            <Settings2 className={`w-16 h-16 absolute -right-2 top-4 opacity-40 ${sensor.adminStatus === 'Active' ? 'text-emerald-500' : 'text-amber-500'}`} strokeWidth={1.5} />
            <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">
               {getStatusBadge(sensor.adminStatus, 'admin')}
               <span className="ml-2">System intent</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Health Status */}
        <Card className={`bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${sensor.healthStatus === 'Healthy' ? 'hover:border-emerald-500/50' : sensor.healthStatus === 'Warning' ? 'hover:border-amber-500/50' : 'hover:border-slate-500/50'}`}>
          <CardContent className="p-6">
            <div className="relative z-10 space-y-2">
              <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Hardware Health</p>
              <div className="text-3xl font-bold text-foreground tracking-tight mt-1">
                {sensor.healthStatus}
              </div>
            </div>
            
            {sensor.healthStatus === 'Healthy' ? <ShieldCheck className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-emerald-500" strokeWidth={1.5} /> :
             sensor.healthStatus === 'Warning' ? <ShieldAlert className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-amber-500" strokeWidth={1.5} /> :
             <WifiOff className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-slate-500" strokeWidth={1.5} />}
            
            <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">
               {getStatusBadge(sensor.healthStatus, 'health')}
               <span className="ml-2">Network capability</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Sensor History Table */}
      <Card className="flex flex-col flex-1 shadow-md border-border overflow-hidden mt-2">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
          <CardTitle className="text-[17px]">Historical Timeline</CardTitle>
          <CardDescription>Click any row to inspect the data deeply.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm border-b border-border">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[200px] text-[11px] font-semibold text-muted-foreground">TIMESTAMP</TableHead>
                <TableHead className="w-[120px] text-[11px] font-semibold text-muted-foreground text-center">HEALTH</TableHead>
                <TableHead className="w-[120px] text-[11px] font-semibold text-muted-foreground text-center">ALERT</TableHead>
                <TableHead className="text-right text-[11px] font-semibold text-muted-foreground pr-6">RECORDED VALUE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground border-none">Loading sensors...</TableCell></TableRow>
              ) : history.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground border-none">No sensors found matching filters.</TableCell></TableRow>
              ) : (
              history.map((row, i) => (
                <TableRow 
                  key={i} 
                  onClick={() => setSelectedReading(row)}
                  className="border-b border-border/50 hover:bg-accent cursor-pointer transition-colors"
                >
                  <TableCell className="text-[13px] text-muted-foreground font-medium py-3.5">
                    {new Date(row.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(row.healthStatus, 'health')}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(row.dataStatus, 'data')}</TableCell>
                  <TableCell className="text-[13px] font-bold text-right font-mono pr-6">
                    {row.healthStatus === 'Offline' ? <span className="text-muted-foreground/50">--</span> : `${row.value.toFixed(2)} ${sensor.unit}`}
                  </TableCell>
                </TableRow>
               ) )
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Specific Reading Dialog */}
      <Dialog open={!!selectedReading} onOpenChange={() => setSelectedReading(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Specific Reading Data
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {selectedReading ? new Date(selectedReading.timestamp).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReading && (
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