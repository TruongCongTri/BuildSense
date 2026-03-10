import React, { useEffect, useState, useMemo } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useNavigate } from "react-router-dom"; // 🌟 Added routing

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Download, Building2, SignalHigh, AlertTriangle, Shield } from "lucide-react"; 
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

import { DashboardMetrics, type MetricCardConfig } from "../components/dashboard/DashboardMetrics";
import { DashboardChart } from "../components/dashboard/DashboardChart";
import { DashboardSensorTypes } from "../components/dashboard/DashboardSensorTypes";
import type { Building, HistoricalData, Sensor } from "shared/types";
import type { DateRange } from "react-day-picker";

export interface MergedChartRecord {
  timestamp: number;
  [sensorId: string]: number;
}

const SENSOR_COLORS = ["#3b82f6", "#a855f7", "#f59e0b", "#10b981", "#ef4444"];

const parseTimestamp = (val: string | number): number => {
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return typeof val === "number" ? val : 0;
};

export const DashboardPage: React.FC = () => {
  const { alerts, isConnected, liveValues } = useWebSocket();
  const navigate = useNavigate(); 

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  const availableTypes = useMemo(
    () => Array.from(new Set(sensors.map((s) => s.type))),
    [sensors],
  );
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const [mergedChartData, setMergedChartData] = useState<MergedChartRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/api/buildings")
      .then((res) => res.json())
      .then((json) => setBuildings(json.buildings || []));

    fetch("http://localhost:3001/api/sensors?limit=2000")
      .then((res) => res.json())
      .then((json) => setSensors(json.sensors || []));
  }, []);

  useEffect(() => {
    if (availableTypes.length > 0 && !selectedType)
      setSelectedType(availableTypes[0]);
  }, [availableTypes, selectedType]);

  const chartSensors = useMemo(() => {
    return sensors.filter(
      (s) =>
        (selectedBuilding === "all" || s.buildingId === selectedBuilding) &&
        s.type === selectedType,
    );
  }, [sensors, selectedBuilding, selectedType]);

  useEffect(() => {
    let ignore = false;
    const fetchMultiSensorData = async () => {
      if (chartSensors.length === 0) {
        setMergedChartData([]);
        return;
      }
      setIsLoading(true);

      try {
        const fetchPromises = chartSensors.slice(0, 5).map((sensor) =>
          fetch(
            `http://localhost:3001/api/sensors/${sensor.id}/data?days=${dateRange}&limit=500`,
          )
            .then((res) => res.json())
            .then((json) => ({
              sensorId: sensor.id,
              history: json.history || [],
            })),
        );

        const results = await Promise.all(fetchPromises);
        if (ignore) return;

        const timeMap = new Map<number, MergedChartRecord>();
        results.forEach(({ sensorId, history }) => {
          history.forEach((point: HistoricalData) => {
            const timeKey = new Date(
              parseTimestamp(point.timestamp),
            ).setSeconds(0, 0);
            if (!timeMap.has(timeKey))
              timeMap.set(timeKey, { timestamp: timeKey });
            timeMap.get(timeKey)![sensorId] = point.value;
          });
        });

        setMergedChartData(
          Array.from(timeMap.values()).sort(
            (a, b) => a.timestamp - b.timestamp,
          ),
        );
      } catch (err) {
        if (!ignore) console.error("Failed to fetch sensor trend data:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchMultiSensorData();
    return () => {
      ignore = true;
    };
  }, [chartSensors, dateRange]);

  useEffect(() => {
    if (chartSensors.length > 0 && isConnected) {
      const currentTimestamp = Date.now();
      const newRecord: MergedChartRecord = { timestamp: currentTimestamp };
      let hasNewData = false;

      chartSensors.slice(0, 5).forEach((sensor) => {
        if (liveValues[sensor.id]) {
          newRecord[sensor.id] = liveValues[sensor.id].value;
          hasNewData = true;
        }
      });

      if (hasNewData) {
        setMergedChartData((prev) => {
          if (prev.length === 0) return [newRecord];
          const lastTime = prev[prev.length - 1].timestamp;
          if (currentTimestamp - lastTime < 1000) return prev; 
          return [...prev, newRecord];
        });
      }
    }
  }, [liveValues, chartSensors, isConnected]);

  const distributionData = useMemo(() => {
    const bldgMap: Record<string, { name: string; healthy: number; offline: number; alerts: number }> = {};
    const buildingNameMap: Record<string, string> = {};
    buildings.forEach((b) => { buildingNameMap[b.id] = b.name; });

    sensors.forEach((s) => {
      const bName = buildingNameMap[s.buildingId] || s.buildingId;
      if (!bldgMap[bName]) bldgMap[bName] = { name: bName, healthy: 0, offline: 0, alerts: 0 };

      // Check live WebSocket status first, fallback to initial sensor status
      const live = liveValues[s.id];
      const currentHealth = live?.healthStatus || s.healthStatus;
      const currentData = live?.dataStatus || s.dataStatus;
      const currentAdmin = live?.adminStatus || s.adminStatus;

      if (currentHealth === "Offline" || currentHealth === "Error" || currentAdmin === "Maintenance") {
        bldgMap[bName].offline += 1;
      } else if (currentData === "Warning" || currentData === "Critical") {
        bldgMap[bName].alerts += 1;
      } else {
        bldgMap[bName].healthy += 1;
      }
    });

    return Object.values(bldgMap)
      .sort((a, b) => (b.healthy + b.offline + b.alerts) - (a.healthy + a.offline + a.alerts))
      .slice(0, 5);
  }, [sensors, buildings, liveValues]);

  const metricsConfig: MetricCardConfig[] = useMemo(() => {
    // 1. Admin Status
    const activeSensors = sensors.filter(s => {
      const admin = liveValues[s.id]?.adminStatus || s.adminStatus;
      return admin === 'Active';
    }).length;
    const maintenanceCount = sensors.length - activeSensors;

    // 2. Health Status
    const healthySensors = sensors.filter(s => {
      const health = liveValues[s.id]?.healthStatus || s.healthStatus;
      return health === 'Healthy';
    }).length;
    const offlineCount = sensors.filter(s => {
      const health = liveValues[s.id]?.healthStatus || s.healthStatus;
      return health === 'Offline' || health === 'Error';
    }).length;
    const healthPercentage = sensors.length > 0 ? ((healthySensors / sensors.length) * 100).toFixed(1) : "0";

    // 3. Data Status (Alerts)
    const criticalAlerts = alerts.filter(a => a.type === 'Critical' || a.severity === 'CRITICAL').length;
    const warningAlerts = alerts.filter(a => a.type === 'Warning' || a.severity === 'WARNING').length;
    const totalAlerts = criticalAlerts + warningAlerts;

    return [
      {
        title: "Total Buildings Monitored",
        value: buildings.length || 15,
        icon: Building2,
        iconClassName: "text-primary",
        hoverBorderClass: "hover:border-primary/50",
        trendDirection: "up",
        trendText: "2 added this month",
        trendClassName: "text-emerald-500",
        onClick: () => navigate('/sensors')
      },
      {
        title: "Active Sensors",
        value: sensors.length > 0 ? activeSensors.toLocaleString() : "1,240",
        icon: SignalHigh,
        iconClassName: "text-emerald-500",
        hoverBorderClass: "hover:border-emerald-500/50",
        trendDirection: maintenanceCount > 0 ? "down" : "neutral",
        trendText: `${maintenanceCount} in maintenance`,
        trendClassName: maintenanceCount > 0 ? "text-amber-500" : "text-muted-foreground",
        // Routes to Admin Status filter
        onClick: () => navigate('/sensors?adminStatus=Active') 
      },
      {
        title: "Active Alerts",
        value: totalAlerts || 0,
        icon: AlertTriangle,
        iconClassName: "text-destructive fill-destructive/10",
        hoverBorderClass: "hover:border-destructive/50",
        trendDirection: totalAlerts > 0 ? "up" : "neutral",
        trendText: `${criticalAlerts} critical, ${warningAlerts} warning`,
        trendClassName: totalAlerts > 0 ? "text-destructive" : "text-muted-foreground",
        // Routes to Data Status filter
        onClick: () => navigate('/datalog?dataStatus=Critical&dataStatus=Warning')
      },
      {
        title: "Network Health",
        value: `${healthPercentage}%`,
        icon: Shield,
        iconClassName: "text-violet-500 fill-violet-500/10",
        hoverBorderClass: "hover:border-violet-500/50",
        trendDirection: offlineCount > 0 ? "down" : "up",
        trendText: `${offlineCount} hardware offline`,
        trendClassName: offlineCount > 0 ? "text-slate-500" : "text-emerald-500",
        // Routes to Health Status filter
        onClick: () => navigate('/sensors?healthStatus=Offline&healthStatus=Error')
      }
    ];
  }, [sensors, buildings, alerts, liveValues, navigate]);

  return (
    <ScrollArea className="h-full w-full bg-background transition-colors duration-200">
      <div className="min-h-screen text-foreground p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">
              Network Analytics
            </h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">
              Real-time performance and health metrics across all deployed
              sensor nodes.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className={`px-3.5 py-1.5 bg-card flex items-center gap-2 text-[13px] font-medium rounded-full shadow-sm transition-colors duration-200 ${
                isConnected
                  ? "border-emerald-500/20 text-emerald-500"
                  : "border-destructive/20 text-destructive"
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
            <Button
              variant="outline"
              className="bg-card border-border text-foreground hover:bg-accent text-[13px] h-9 rounded-md transition-colors shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <DashboardMetrics metrics={metricsConfig} />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2 flex flex-col bg-card border border-border shadow-md rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
            <CardHeader className="flex flex-col sm:flex-row justify-between pb-6 pt-6 px-6 border-b border-border/50">
              <div>
                <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">
                  Sensor Distribution & Status
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[13px] mt-1">
                  Active vs Inactive across monitored locations
                </CardDescription>
              </div>
              <div className="flex items-center gap-5 text-[13px] font-medium text-muted-foreground mt-4 sm:mt-0">
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div> Healthy</span>
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-destructive"></div> Alerts</span>
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50"></div> Offline/Maint</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-6 px-6 pt-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={distributionData}
                  margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="healthy" name="Healthy" fill="var(--primary)" radius={[3, 3, 0, 0]} barSize={16} />
                  <Bar dataKey="alerts" name="Alerts" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} barSize={16} />
                  <Bar dataKey="offline" name="Offline/Maint" fill="var(--muted-foreground)" radius={[3, 3, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="col-span-1">
            <DashboardSensorTypes sensors={sensors} />
          </div>
        </div>

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
          dateRange={dateRange}
          setDateRange={setDateRange}
          sensorColors={SENSOR_COLORS}
        />
      </div>
    </ScrollArea>
  );
};