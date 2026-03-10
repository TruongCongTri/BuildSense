/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Rectangle 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type { Building, Sensor } from '../../../shared/types';
import type { MergedChartRecord } from '../../pages/DashboardPage';

interface DashboardChartProps {
  buildings: Building[];
  availableTypes: string[];
  chartSensors: Sensor[];
  mergedChartData: MergedChartRecord[];
  isLoading: boolean;
  selectedBuilding: string;
  setSelectedBuilding: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  
  // 🌟 The Calendar props replace daysRange
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  sensorColors: string[];
}

// --- HELPER FUNCTIONS ---
const formatShortDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatXAxisTick = (val: string | number): string => {
  const d = new Date(val);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${d.getHours()}h`;
};

const formatTooltipLabel = (label: string | number): string => {
  return new Date(label).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
};

// 🌟 Safe Custom Shape for Bars
const CustomBarShape = (props: any) => {
  const { x, y, height, fill } = props;
  const barWidth = 6; 
  if (height === undefined || height === null || Number.isNaN(height) || height <= 0) return null;
  return <Rectangle x={x - barWidth / 2} y={y} width={barWidth} height={height} fill={fill} radius={[2, 2, 0, 0]} />;
};

export const DashboardChart: React.FC<DashboardChartProps> = ({ 
  buildings, availableTypes, chartSensors, mergedChartData, isLoading,
  selectedBuilding, setSelectedBuilding, selectedType, setSelectedType, 
  dateRange, setDateRange, sensorColors 
}) => {
  
  // 1-second ticker to expand the "Now" boundary
  const [currentNow, setCurrentNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentNow(Date.now()), 1000); 
    return () => clearInterval(interval);
  }, []);

  // Map strict calendar bounds
  const timeBounds = useMemo(() => {
    if (!dateRange?.from) return null;
    const from = new Date(dateRange.from);
    const to = dateRange.to ? new Date(dateRange.to) : from;
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
    const endOfDay = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime();
    const maxDataTime = endOfDay > currentNow ? currentNow : endOfDay;
    return { start, maxDataTime };
  }, [dateRange, currentNow]);

  // Ensure strict JS Numbers for axis stability
  const rangeData = useMemo(() => {
    return mergedChartData.map(d => ({ ...d, numericTime: d.timestamp }));
  }, [mergedChartData]);

  const renderChart = () => {
    const sharedXAxis = (
      <XAxis 
        dataKey="numericTime" 
        type="number"
        // 🌟 Add 60-second math buffer if bounds exist to stop Bars from vanishing
        domain={timeBounds ? [timeBounds.start, timeBounds.maxDataTime + 60000] : ['dataMin', 'dataMax']}
        tickFormatter={formatXAxisTick} 
        fontSize={12} stroke="var(--muted-foreground)" tickMargin={15} axisLine={false} tickLine={false} 
        minTickGap={30}
        padding={{ left: 10, right: 30 }}
        allowDataOverflow={true}
      />
    );

    const sharedYAxis = (
      <YAxis fontSize={12} stroke="var(--muted-foreground)" tickMargin={15} axisLine={false} tickLine={false} />
    );

    if (selectedType === "Temperature") {
      return (
        <AreaChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {chartSensors.slice(0, 5).map((sensor, idx) => (
              <linearGradient key={`grad-${sensor.id}`} id={`color-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sensorColors[idx % sensorColors.length]} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={sensorColors[idx % sensorColors.length]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          {sharedXAxis}
          {sharedYAxis}
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(lbl) => formatTooltipLabel(lbl)} />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          {chartSensors.slice(0, 5).map((sensor, idx) => (
            <Area key={sensor.id} connectNulls={true} type="monotone" name={sensor.name} dataKey={sensor.id} stroke={sensorColors[idx % sensorColors.length]} fillOpacity={1} fill={`url(#color-${sensor.id})`} isAnimationActive={false} />
          ))}
        </AreaChart>
      );
    } 
    
    if (selectedType === "Load") {
      return (
        <BarChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          {sharedXAxis}
          {sharedYAxis}
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(lbl) => formatTooltipLabel(lbl)} />} cursor={{ fill: 'var(--muted)', opacity: 0.1 }} />
          {chartSensors.slice(0, 5).map((sensor, idx) => (
            <Bar key={sensor.id} dataKey={sensor.id} name={sensor.name} fill={sensorColors[idx % sensorColors.length]} shape={<CustomBarShape />} isAnimationActive={false} />
          ))}
        </BarChart>
      );
    }

    return (
      <LineChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
        {sharedXAxis}
        {sharedYAxis}
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(lbl) => formatTooltipLabel(lbl)} />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        {chartSensors.slice(0, 5).map((sensor, idx) => (
          <Line key={sensor.id} connectNulls={true} type="monotone" name={sensor.name} dataKey={sensor.id} stroke={sensorColors[idx % sensorColors.length]} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: sensorColors[idx % sensorColors.length] }} isAnimationActive={false} />
        ))}
      </LineChart>
    );
  };

  return (
    <Card className="bg-card border border-border shadow-md col-span-4 lg:col-span-7 flex flex-col rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
      <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-4 pt-6 px-6 gap-4 border-b border-border/50">
        <div>
          <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Live Sensor Trends</CardTitle>
          <CardDescription className="text-muted-foreground text-[13px] mt-1">Real-time performance analysis</CardDescription>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-[160px] h-9 bg-background border-input text-foreground text-[13px] focus:ring-0 transition-colors duration-200">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px] h-9 bg-background border-input text-foreground text-[13px] focus:ring-0 transition-colors duration-200">
              <SelectValue placeholder="Sensor Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
              {availableTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 🌟 THE FIX: Replaced daysRange Select with the fully functional Calendar Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[13px] justify-start text-left font-normal w-auto min-w-[180px] pr-3 bg-background border-input"
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {dateRange?.from ? (
                  dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime() ? (
                    `${formatShortDate(dateRange.from)} - ${formatShortDate(dateRange.to)}`
                  ) : (
                    formatShortDate(dateRange.from)
                  )
                ) : (
                  <span>Pick a date range</span>
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
                disabled={(date) => date.getTime() > currentNow} 
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent className="pl-6 pb-6 pt-6 pr-6 flex-1 flex flex-col">
        <div className="flex-1 w-full relative min-h-[320px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Compiling live data...</div>
          ) : mergedChartData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No data available for this selection.</div>
          ) : (
            <ChartContainer config={{}} className="absolute inset-0 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};