import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart as LineChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import type { Sensor } from '../../../shared/types';

export interface MergedChartRecord {
  timestamp: number;
  [sensorId: string]: number; 
}

interface DashboardChartProps {
  selectedType: string;
  unitLabel: string;
  chartType: "line" | "bar";
  setChartType: (type: "line" | "bar") => void;
  isLoading: boolean;
  mergedChartData: MergedChartRecord[]; 
  daysRange: string;
  sensorsOfSelectedType: Sensor[];
  visibleSensors: Record<string, boolean>;
  sensorColors: string[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({
  selectedType, unitLabel, chartType, setChartType, isLoading, mergedChartData,
  daysRange, sensorsOfSelectedType, visibleSensors, sensorColors
}) => {
  return (
    <Card className="col-span-4 lg:col-span-5 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Trend Overview</CardTitle>
          <CardDescription>Comparative timeline for {selectedType} ({unitLabel})</CardDescription>
        </div>
        <div className="flex bg-muted p-1 rounded-md">
          <Button variant={chartType === 'line' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setChartType('line')}><LineChartIcon className="w-3 h-3 mr-1" /> Line</Button>
          <Button variant={chartType === 'bar' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setChartType('bar')}><BarChartIcon className="w-3 h-3 mr-1" /> Bar</Button>
        </div>
      </CardHeader>
      <CardContent className="pl-2 flex-1">
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">Compiling array data...</div>
        ) : mergedChartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">No data available for this range.</div>
        ) : (
          <ChartContainer config={{}} className="h-[400px] w-full">
            {chartType === 'line' ? (
              <LineChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => daysRange === "1" ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(t).toLocaleDateString()} fontSize={12} className="text-muted-foreground" tickMargin={10} />
                <YAxis fontSize={12} className="text-muted-foreground" tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => new Date(label).toLocaleString()} />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                {sensorsOfSelectedType.map((sensor, idx) => visibleSensors[sensor.id] && (
                  <Line key={sensor.id} type="monotone" name={sensor.name} dataKey={sensor.id} stroke={sensorColors[idx % sensorColors.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => daysRange === "1" ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(t).toLocaleDateString()} fontSize={12} className="text-muted-foreground" tickMargin={10} />
                <YAxis fontSize={12} className="text-muted-foreground" tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => new Date(label).toLocaleString()} />} cursor={{ fill: 'hsl(var(--muted))' }} />
                {sensorsOfSelectedType.map((sensor, idx) => visibleSensors[sensor.id] && (
                  <Bar key={sensor.id} name={sensor.name} dataKey={sensor.id} fill={sensorColors[idx % sensorColors.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};