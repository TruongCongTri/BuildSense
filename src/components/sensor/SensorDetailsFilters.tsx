import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export const SensorDetailFilters: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateRange, setDateRange] = useState('');
  const [adminStatuses, setAdminStatuses] = useState<string[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<string[]>([]);
  const [dataStatuses, setDataStatuses] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateRange(searchParams.get('dateRange') || '');
    setAdminStatuses(searchParams.getAll('adminStatus'));
    setHealthStatuses(searchParams.getAll('healthStatus'));
    setDataStatuses(searchParams.getAll('dataStatus'));
  }, [searchParams]);

  const toggleArray = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
  };

  const clearAll = () => {
    setDateRange(''); setAdminStatuses([]); setHealthStatuses([]); setDataStatuses([]);
    const params = new URLSearchParams(searchParams);
    ['dateRange', 'adminStatus', 'healthStatus', 'dataStatus', 'page'].forEach(k => params.delete(k));
    setSearchParams(params);
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    ['dateRange', 'adminStatus', 'healthStatus', 'dataStatus', 'page'].forEach(k => params.delete(k));

    if (dateRange) params.set('dateRange', dateRange);
    adminStatuses.forEach(s => params.append('adminStatus', s));
    healthStatuses.forEach(s => params.append('healthStatus', s));
    dataStatuses.forEach(s => params.append('dataStatus', s));
    setSearchParams(params);
  };

  return (
    <Card className="w-64 shrink-0 flex flex-col h-full max-h-[calc(100vh-320px)] overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 shrink-0 space-y-0">
        <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Filters</CardTitle>
        <button onClick={clearAll} className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">Clear All</button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto px-5 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Time Range</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full bg-background border-input text-foreground text-[13px] transition-colors duration-200">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Admin Status</label>
          <div className="space-y-2.5">
            {['Active', 'Inactive', 'Maintenance', 'Decommissioned'].map(s => (
              <div key={`admin-${s}`} className="flex items-center space-x-3">
                <Checkbox id={`admin-${s}`} checked={adminStatuses.includes(s)} onCheckedChange={() => toggleArray(setAdminStatuses, s)} />
                <label htmlFor={`admin-${s}`} className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer">{s}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Network Health</label>
          <div className="space-y-2.5">
            {['Healthy', 'Warning', 'Error', 'Offline'].map(s => (
              <div key={`health-${s}`} className="flex items-center space-x-3">
                <Checkbox id={`health-${s}`} checked={healthStatuses.includes(s)} onCheckedChange={() => toggleArray(setHealthStatuses, s)} />
                <label htmlFor={`health-${s}`} className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer">{s}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Data Alerts</label>
          <div className="space-y-2.5">
            {['Normal', 'Warning', 'Critical'].map(s => (
              <div key={`data-${s}`} className="flex items-center space-x-3">
                <Checkbox id={`data-${s}`} checked={dataStatuses.includes(s)} onCheckedChange={() => toggleArray(setDataStatuses, s)} />
                <label htmlFor={`data-${s}`} className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer">{s}</label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border bg-muted/50 shrink-0">
        <Button onClick={handleApply} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">Apply Filters</Button>
      </CardFooter>
    </Card>
  );
};