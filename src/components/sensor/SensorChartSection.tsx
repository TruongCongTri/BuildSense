import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { ChevronDown, Activity, LineChart as LineChartIcon, BarChart as BarChartIcon } from 'lucide-react';

interface SensorChartSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  chartData: HistoricalData[];
  isLoading: boolean;
  chartDays: string;
  setChartDays: (days: string) => void;
  chartType: "line" | "bar";
  setChartType: (type: "line" | "bar") => void;
}

export const SensorChartSection: React.FC<SensorChartSectionProps> = ({
  sensor, isOpen, onToggle, chartData, isLoading, chartDays, setChartDays, chartType, setChartType
}) => {
  const chartColor = sensor.markerColor === 'red' ? '#ef4444' : '#3b82f6';

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="border-b">
      <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-sm cursor-pointer" onClick={() => onToggle(!isOpen)}>
          <Activity className="w-4 h-4 text-muted-foreground" /> Trend Analysis
        </div>
        <div className="flex items-center gap-2">
          <Select value={chartDays} onValueChange={setChartDays}>
            <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">24 Hours</SelectItem><SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="7">7 Days</SelectItem><SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      
      <CollapsibleContent className="px-6 pb-6 pt-2">
        <div className="flex justify-end mb-4">
          <div className="flex bg-muted/50 p-1 rounded-md">
            <Button variant={chartType === 'line' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3" onClick={() => setChartType('line')}><LineChartIcon className="w-3 h-3 mr-1" /> Line</Button>
            <Button variant={chartType === 'bar' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3" onClick={() => setChartType('bar')}><BarChartIcon className="w-3 h-3 mr-1" /> Bar</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Loading chart data...</div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data available.</div>
        ) : (
          <ChartContainer config={{}} className="h-[250px] w-full">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={(tick) => chartDays === "1" ? new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(tick).toLocaleDateString()} fontSize={11} className="text-muted-foreground" tickMargin={8} />
                <YAxis fontSize={11} className="text-muted-foreground" tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => new Date(label).toLocaleString()} />} />
                <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={(tick) => chartDays === "1" ? new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(tick).toLocaleDateString()} fontSize={11} className="text-muted-foreground" tickMargin={8} />
                <YAxis fontSize={11} className="text-muted-foreground" tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => new Date(label).toLocaleString()} />} />
                <Bar dataKey="value" fill={chartColor} radius={[2, 2, 0, 0]} />
              </BarChart>
            )}
          </ChartContainer>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};