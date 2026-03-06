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
    <Card className="bg-[#1C202A] border-none shadow-md col-span-4 lg:col-span-7 flex flex-col rounded-xl">
      <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-8 pt-6 px-6 gap-4">
        <div>
          <CardTitle className="text-[17px] font-semibold text-white tracking-wide">Sensor Trends</CardTitle>
          <CardDescription className="text-gray-400 text-[13px] mt-1">Historical performance of filtered systems</CardDescription>
        </div>
        
        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* 1. Building Filter */}
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-[160px] h-9 bg-[#11131A] border-[#2A2F3A] text-gray-300 text-[13px] focus:ring-0">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C202A] border-[#2A2F3A] text-white">
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 2. Sensor Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px] h-9 bg-[#11131A] border-[#2A2F3A] text-gray-300 text-[13px] focus:ring-0">
              <SelectValue placeholder="Sensor Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C202A] border-[#2A2F3A] text-white">
              {availableTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 3. Time Range Filter */}
          <Select value={daysRange} onValueChange={setDaysRange}>
            <SelectTrigger className="w-[130px] h-9 bg-[#11131A] border-[#2A2F3A] text-gray-300 text-[13px] focus:ring-0">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C202A] border-[#2A2F3A] text-white">
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="3">Last 3 Days</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="pl-0 pb-6 pr-6 flex-1">
        {isLoading ? (
          <div className="h-[320px] flex items-center justify-center text-gray-500">Compiling trend data...</div>
        ) : mergedChartData.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center text-gray-500">No data available for this filter combination.</div>
        ) : (
          <ChartContainer config={{}} className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#2A2F3A" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => daysRange === "1" ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(t).toLocaleDateString([], { weekday: 'short' })} 
                  fontSize={12} stroke="#64748B" tickMargin={15} axisLine={false} tickLine={false} 
                />
                <YAxis 
                  fontSize={12} stroke="#64748B" tickMargin={15} axisLine={false} tickLine={false} 
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
                
                {/* Dynamically render lines for up to 5 filtered sensors to prevent overcrowding */}
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