import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar} from 'recharts';
import type { Sensor, HistoricalData } from '../../../shared/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BarChart2, LineChart as LineChartIcon, BarChart as BarChartIcon } from 'lucide-react';

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
  const chartColor = sensor.status === 'Warning' ? '#ef4444' : '#ef4444'; // Adjusted to match the red chart from image

  const avgValue = useMemo(() => {
    if (!chartData || chartData.length === 0) return '0.0';
    const sum = chartData.reduce((acc, curr) => acc + curr.value, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="flex flex-col gap-3">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-3 focus:outline-none">
          <BarChart2 className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-white">Data Insights</h3>
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </CollapsibleTrigger>
        
        <Select value={chartDays} onValueChange={setChartDays}>
          <SelectTrigger className="w-[80px] h-7 text-xs bg-[#1A1D21] border-gray-700 text-white">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1D21] border-gray-700 text-white">
            <SelectItem value="1">1D</SelectItem>
            <SelectItem value="7">1W</SelectItem>
            <SelectItem value="30">1M</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* MAGIC FIX: Added w-full and overflow-hidden to contain the animation and chart width */}
      <CollapsibleContent className="w-full overflow-hidden space-y-4 pt-1">
        {/* Main Chart Card */}
        {/* MAGIC FIX: Added w-full and overflow-hidden here as well */}
        <div className="bg-[#1A1D21] border border-gray-800 rounded-xl p-4 shadow-lg w-full overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Avg {sensor.type}</div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {avgValue}<span className="text-lg ml-1 font-normal text-gray-400">{sensor.unit}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="flex bg-gray-800/50 p-1 rounded-md border border-gray-700">
                  <Button variant="ghost" size="sm" className={`h-6 px-2 py-0 ${chartType === 'line' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`} onClick={() => setChartType('line')}><LineChartIcon className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className={`h-6 px-2 py-0 ${chartType === 'bar' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`} onClick={() => setChartType('bar')}><BarChartIcon className="w-3 h-3" /></Button>
               </div>
               <div className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
                 ↗ +1.2{sensor.unit}
               </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">Loading chart data...</div>
          ) : chartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">No data available.</div>
          ) : (
            <ChartContainer config={{}} className="h-[200px] w-full min-w-0 max-w-full mt-2 overflow-hidden">
                {chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => new Date(label).toLocaleString()} />} />
                    <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={4} dot={false} activeDot={{ r: 6, fill: chartColor, stroke: '#1A1D21', strokeWidth: 2 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => new Date(label).toLocaleString()} />} />
                    <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
            </ChartContainer>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};