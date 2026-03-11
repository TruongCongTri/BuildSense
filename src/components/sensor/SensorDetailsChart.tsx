/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, LineChart, Line } from 'recharts';
import type { HistoricalData, Sensor } from '../../../shared/types';

interface SensorDetailChartProps {
  data: HistoricalData[];
  sensor: Sensor;
}

const safeGetTime = (val: string | number): number => {
  if (!val) return 0;
  const num = Number(val);
  if (!isNaN(num)) return num;
  return new Date(val).getTime();
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  sensor: Sensor;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, sensor }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as HistoricalData;
    return (
      <div className="bg-popover border border-border shadow-md rounded-lg p-3 text-popover-foreground z-50">
        <p className="text-xs text-muted-foreground mb-1">{new Date(label as string | number).toLocaleString()}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">
            {d.healthStatus === 'Offline' ? 'OFFLINE' : d.value.toFixed(2)}
          </span>
          {d.healthStatus !== 'Offline' && <span className="text-xs text-muted-foreground">{sensor.unit}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
           <span className={`w-2 h-2 rounded-full ${d.dataStatus === 'Critical' ? 'bg-destructive' : d.dataStatus === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
           <span className="text-xs font-medium">{d.dataStatus}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const SensorDetailChart: React.FC<SensorDetailChartProps> = ({ data, sensor }) => {
  const chartData = useMemo(() => {
    // Reverse data so the chart flows chronologically (left to right)
    return [...data].reverse().map(d => ({
      ...d,
      timeNum: safeGetTime(d.timestamp),
      // If offline or in maintenance, set value to null so the chart line breaks cleanly
      chartValue: (d.healthStatus === 'Offline' || d.adminStatus === 'Maintenance') ? null : d.value
    }));
  }, [data]);

  const formatXAxis = (tickItem: number) => {
    const d = new Date(tickItem);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // DYNAMIC CHART RENDERER
  const renderChartType = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: -20, bottom: 0 }
    };

    const commonXAxis = (
      <XAxis 
        dataKey="timeNum" type="number" domain={['dataMin', 'dataMax']} 
        tickFormatter={formatXAxis} fontSize={11} stroke="var(--muted-foreground)" 
        tickMargin={10} axisLine={false} tickLine={false} minTickGap={30}
      />
    );

    const commonYAxis = <YAxis fontSize={11} stroke="var(--muted-foreground)" tickMargin={10} axisLine={false} tickLine={false} />;
    const commonGrid = <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />;
    const commonTooltip = <RechartsTooltip content={<CustomTooltip sensor={sensor} />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} />;

    switch (sensor.type) {
      case 'Load':
        // BAR CHART for discrete load events (Blue)
        return (
          <BarChart {...commonProps}>
            {commonGrid} {commonXAxis} {commonYAxis} {commonTooltip}
            <Bar 
              dataKey="chartValue" 
              fill="#3b82f6" // Blue-500
              radius={[2, 2, 0, 0]} 
              isAnimationActive={false} 
              maxBarSize={8}
            />
          </BarChart>
        );

      case 'Strain':
        // LINE CHART for sharp structural variations (Violet)
        return (
          <LineChart {...commonProps}>
            {commonGrid} {commonXAxis} {commonYAxis} {commonTooltip}
            <Line 
              type="monotone" 
              dataKey="chartValue" 
              stroke="#8b5cf6" // Violet-500
              strokeWidth={2} 
              dot={false} 
              connectNulls={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        );

      case 'Temperature':
      default:
        // AREA CHART for smooth ambient changes (Orange)
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            {commonGrid} {commonXAxis} {commonYAxis} {commonTooltip}
            <Area 
              type="monotone" 
              dataKey="chartValue" 
              stroke="#f97316" // Orange-500
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTemp)" 
              connectNulls={false}
              isAnimationActive={false}
            />
          </AreaChart>
        );
    }
  };
  
  return (
    <Card className="flex flex-col h-full bg-card shadow-md border-border overflow-hidden min-w-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 rounded-xl">
      <CardHeader className="border-b border-border/50 pb-4 pt-4 shrink-0 bg-muted/20">
        <CardTitle className="text-[17px]">Data Trends</CardTitle>
        <CardDescription className="text-xs">Visualizing {data.length} records based on active filters.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-4 min-h-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No data to display for the selected filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChartType()}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};