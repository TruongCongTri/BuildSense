import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Building, Sensor } from '../../../shared/types';
import type { MergedChartRecord } from '../../pages/DashboardPage';

interface DashboardChartProps {
  buildings: Building[];
  availableTypes: string[];
  chartSensors: Sensor[];
  mergedChartData: MergedChartRecord[];
  isLoading: boolean;
  
  // Filters state
  selectedBuilding: string;
  setSelectedBuilding: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  daysRange: string;
  setDaysRange: (val: string) => void;
  
  sensorColors: string[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ 
  buildings, availableTypes, chartSensors, mergedChartData, isLoading,
  selectedBuilding, setSelectedBuilding, selectedType, setSelectedType, daysRange, setDaysRange, sensorColors 
}) => {
  
  return (
    <Card className="bg-card border border-border shadow-md col-span-4 lg:col-span-7 flex flex-col rounded-xl transition-colors duration-200">
      <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-8 pt-6 px-6 gap-4 border-b border-border/50">
        <div>
          <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Sensor Trends</CardTitle>
          <CardDescription className="text-muted-foreground text-[13px] mt-1">Historical performance of filtered systems</CardDescription>
        </div>
        
        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* 1. Building Filter */}
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

          {/* 2. Sensor Type Filter */}
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

          {/* 3. Time Range Filter */}
          <Select value={daysRange} onValueChange={setDaysRange}>
            <SelectTrigger className="w-[130px] h-9 bg-background border-input text-foreground text-[13px] focus:ring-0 transition-colors duration-200">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="3">Last 3 Days</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="pl-0 pb-6 pt-6 pr-6 flex-1">
        {isLoading ? (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">Compiling trend data...</div>
        ) : mergedChartData.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">No data available for this filter combination.</div>
        ) : (
          <ChartContainer config={{}} className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* 🌟 Swapped static hex colors for CSS variables */}
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => daysRange === "1" ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(t).toLocaleDateString([], { weekday: 'short' })} 
                  fontSize={12} stroke="var(--muted-foreground)" tickMargin={15} axisLine={false} tickLine={false} 
                />
                <YAxis 
                  fontSize={12} stroke="var(--muted-foreground)" tickMargin={15} axisLine={false} tickLine={false} 
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
                
                {chartSensors.slice(0, 5).map((sensor, idx) => (
                  <Line 
                    key={sensor.id} 
                    type="monotone" 
                    name={sensor.name} 
                    dataKey={sensor.id} 
                    stroke={sensorColors[idx % sensorColors.length]} 
                    strokeWidth={4} 
                    dot={false} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: sensorColors[idx % sensorColors.length] }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};