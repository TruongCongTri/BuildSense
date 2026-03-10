import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Building } from '../../../shared/types';

interface SensorsFiltersProps {
  buildings: Building[];
  availableTypes: string[];
}

export const SensorsFilters: React.FC<SensorsFiltersProps> = ({ buildings, availableTypes }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [adminStatuses, setAdminStatuses] = useState<string[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<string[]>([]);
  const [dataStatuses, setDataStatuses] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchTerm(searchParams.get('search') || '');
    setSelectedBuildings(searchParams.getAll('building'));
    setSelectedTypes(searchParams.getAll('type'));
    setAdminStatuses(searchParams.getAll('adminStatus'));
    setHealthStatuses(searchParams.getAll('healthStatus'));
    setDataStatuses(searchParams.getAll('dataStatus'));
  }, [searchParams]);

  const toggleArray = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
  };

  const clearAll = () => {
    setSearchTerm(''); setSelectedBuildings([]); setSelectedTypes([]);
    setAdminStatuses([]); setHealthStatuses([]); setDataStatuses([]);

    const params = new URLSearchParams(searchParams);
    ['search', 'building', 'type', 'adminStatus', 'healthStatus', 'dataStatus', 'page'].forEach(k => params.delete(k));
    setSearchParams(params);
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    ['search', 'building', 'type', 'adminStatus', 'healthStatus', 'dataStatus', 'page'].forEach(k => params.delete(k));

    if (searchTerm) params.set('search', searchTerm);
    selectedBuildings.forEach(b => params.append('building', b));
    selectedTypes.forEach(t => params.append('type', t));
    adminStatuses.forEach(s => params.append('adminStatus', s));
    healthStatuses.forEach(s => params.append('healthStatus', s));
    dataStatuses.forEach(s => params.append('dataStatus', s));

    setSearchParams(params);
  };

  return (
    <Card className="w-64 shrink-0 flex flex-col h-full max-h-[calc(100vh-120px)] overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 shrink-0 space-y-0">
        <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Filters</CardTitle>
        <button onClick={clearAll} className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">Clear All</button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto px-5 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Sensor Name / ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background border-input text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Buildings</label>
          <div className="space-y-2.5">
            {buildings.map(b => (
              <div key={b.id} className="flex items-center space-x-3">
                <Checkbox id={`bldg-${b.id}`} checked={selectedBuildings.includes(b.id)} onCheckedChange={() => toggleArray(setSelectedBuildings, b.id)} />
                <label htmlFor={`bldg-${b.id}`} className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer">{b.name}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Sensor Types</label>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(t => {
              const isSelected = selectedTypes.includes(t);
              return (
                <button key={t} onClick={() => toggleArray(setSelectedTypes, t)} className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors duration-200 ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'}`}>
                  {t}
                </button>
              )
            })}
          </div>
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