import React, { useEffect, useState, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';

import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { DashboardChart } from '../components/dashboard/DashboardChart';
import { DashboardSensorTypes } from '../components/dashboard/DashboardSensorTypes';
import type { Building, HistoricalData, Sensor } from 'shared/types';

export interface MergedChartRecord {
  timestamp: number;
  [sensorId: string]: number; 
}

const SENSOR_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ef4444'];

export const DashboardPage: React.FC = () => {
  const { alerts, isConnected } = useWebSocket();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  // Chart Filtering States
  const availableTypes = useMemo(() => Array.from(new Set(sensors.map(s => s.type))), [sensors]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("");
  const [daysRange, setDaysRange] = useState<string>("7");

  const [mergedChartData, setMergedChartData] = useState<MergedChartRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Initial Data Fetching
  useEffect(() => {
    fetch('http://localhost:3001/api/buildings')
      .then(res => res.json())
      .then(json => setBuildings(json.buildings || []));

    fetch('http://localhost:3001/api/sensors?limit=2000')
      .then(res => res.json())
      .then(json => setSensors(json.sensors || []));
  }, []);

  // Set default sensor type when data arrives
  useEffect(() => {
    if (availableTypes.length > 0 && !selectedType) setSelectedType(availableTypes[0]);
  }, [availableTypes, selectedType]);

  // 2. Derive sensors to display on the trend chart based on filters
  const chartSensors = useMemo(() => {
    return sensors.filter(s => 
      (selectedBuilding === "all" || s.buildingId === selectedBuilding) &&
      (s.type === selectedType)
    );
  }, [sensors, selectedBuilding, selectedType]);

  // 3. Fetch historical data ONLY for the filtered sensors
  useEffect(() => {
    let ignore = false;
    const fetchMultiSensorData = async () => {
      if (chartSensors.length === 0) {
        setMergedChartData([]);
        return;
      }
      setIsLoading(true);
      
      try {
        // Limit to 5 sensors to keep the chart clean and readable
        const fetchPromises = chartSensors.slice(0, 5).map(sensor => 
          fetch(`http://localhost:3001/api/sensors/${sensor.id}/data?days=${daysRange}&limit=100`)
            .then(res => res.json())
            .then(json => ({ sensorId: sensor.id, history: json.history || [] }))
        );

        const results = await Promise.all(fetchPromises);
        if (ignore) return;

        const timeMap = new Map<number, MergedChartRecord>();
        results.forEach(({ sensorId, history }) => {
          history.forEach((point: HistoricalData) => {
            const timeKey = new Date(point.timestamp).setSeconds(0, 0); 
            if (!timeMap.has(timeKey)) timeMap.set(timeKey, { timestamp: timeKey });
            timeMap.get(timeKey)![sensorId] = point.value;
          });
        });

        setMergedChartData(Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp));
      } catch (err) { 
        if (!ignore) {
          console.error("Failed to fetch sensor trend data:", err);
        }
      } finally { 
        if (!ignore) setIsLoading(false); 
      }
    };

    fetchMultiSensorData();
    return () => { ignore = true; };
  }, [daysRange, chartSensors]);

  // 4. Generate dynamic distribution data for the specific Mockup Bar Chart
  const distributionData = useMemo(() => {
    const bldgMap: Record<string, { name: string, active: number, inactive: number }> = {};
    
    // Create a map to look up real building names
    const buildingNameMap: Record<string, string> = {};
    buildings.forEach(b => { buildingNameMap[b.id] = b.name; });

    sensors.forEach(s => {
      // Fallback if building doesn't have a clean name
      const bName = buildingNameMap[s.buildingId] || s.buildingId;
      
      if (!bldgMap[bName]) bldgMap[bName] = { name: bName, active: 0, inactive: 0 };
      if (s.status === 'Healthy' || s.status === 'OK') bldgMap[bName].active += 1;
      else bldgMap[bName].inactive += 1;
    });
    
    // Sort by total sensors and return top 5
    return Object.values(bldgMap).sort((a, b) => (b.active + b.inactive) - (a.active + a.inactive)).slice(0, 5);
  }, [sensors, buildings]);


  return (
    <ScrollArea className="h-full w-full bg-background transition-colors duration-200">
      <div className="min-h-screen text-foreground p-6 md:p-8 space-y-6">      
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">Network Analytics</h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">Real-time performance and health metrics across all deployed sensor nodes.</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className={`px-3.5 py-1.5 bg-card flex items-center gap-2 text-[13px] font-medium rounded-full shadow-sm transition-colors duration-200 ${
                isConnected ? 'border-emerald-500/20 text-emerald-500' : 'border-destructive/20 text-destructive'
              }`}
            >
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span> 
                  Live Data Connected
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span> 
                  Offline
                </>
              )}
            </Badge>
            <Button variant="outline" className="bg-card border-border text-foreground hover:bg-accent text-[13px] h-9 rounded-md transition-colors shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <DashboardMetrics sensors={sensors} buildingsCount={buildings.length} alertsCount={alerts.length} />

        {/* Middle Row: Distribution Bar Chart & Sensor Types */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2 flex flex-col bg-card border border-border shadow-md rounded-xl transition-colors duration-200">
            <CardHeader className="flex flex-col sm:flex-row justify-between pb-6 pt-6 px-6 border-b border-border/50">
              <div>
                <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Sensor Distribution & Status</CardTitle>
                <CardDescription className="text-muted-foreground text-[13px] mt-1">Active vs Inactive across monitored locations</CardDescription>
              </div>
              <div className="flex items-center gap-5 text-[13px] font-medium text-muted-foreground mt-4 sm:mt-0">
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div> Active</span>
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50"></div> Inactive</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-6 px-6 pt-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distributionData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" tickMargin={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'var(--accent)', opacity: 0.4 }} 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }} 
                  />
                  <Bar dataKey="active" name="Active" fill="var(--primary)" radius={0} barSize={32} />
                  <Bar dataKey="inactive" name="Inactive" fill="var(--muted-foreground)" radius={0} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Right Panel: Sensor Types Breakdown */}
          <div className="col-span-1">
            <DashboardSensorTypes sensors={sensors} />
          </div>
        </div>

        {/* Bottom Row: Dynamic Trend Line Chart with Filters */}
        <DashboardChart 
          buildings={buildings}
          availableTypes={availableTypes}
          chartSensors={chartSensors}
          mergedChartData={mergedChartData} 
          isLoading={isLoading}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          daysRange={daysRange} 
          setDaysRange={setDaysRange}
          sensorColors={SENSOR_COLORS}
        />

      </div>
    </ScrollArea>
    
  );
};