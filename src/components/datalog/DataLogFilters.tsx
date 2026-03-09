import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { Building } from '../../../shared/types';

interface DataLogFiltersProps {
  buildings: Building[];
  availableTypes: string[];
}

export const DataLogFilters: React.FC<DataLogFiltersProps> = ({ buildings, availableTypes }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Initialize local state directly from URL instead of inside useEffect
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // 2. Safely sync state if the URL changes externally (e.g., browser back button) 
  // This is React's recommended way to sync state without useEffect cascading renders
  const currentParamsStr = searchParams.toString();
  const [prevParamsStr, setPrevParamsStr] = useState(currentParamsStr);

  if (currentParamsStr !== prevParamsStr) {
    setPrevParamsStr(currentParamsStr);
    setSearchTerm(searchParams.get('search') || '');
    setDateRange(searchParams.get('dateRange') || '');
    setSelectedBuildings(searchParams.getAll('building'));
    setSelectedTypes(searchParams.getAll('type'));
    setSelectedStatuses(searchParams.getAll('status'));
  }

  const toggleBuilding = (id: string) => setSelectedBuildings(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleType = (type: string) => setSelectedTypes(p => p.includes(type) ? p.filter(x => x !== type) : [...p, type]);
  const toggleStatus = (status: string) => setSelectedStatuses(p => p.includes(status) ? p.filter(x => x !== status) : [...p, status]);

  // 3. Clear local state AND clear out URL query
  const clearAll = () => {
    // Clear local UI state
    setSearchTerm('');
    setDateRange('');
    setSelectedBuildings([]);
    setSelectedTypes([]);
    setSelectedStatuses([]);

    // Clear URL state and apply immediately
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.delete('dateRange');
    params.delete('building');
    params.delete('type');
    params.delete('status');
    params.delete('page'); // Reset to page 1 just in case
    setSearchParams(params);
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    
    // Clear existing filter params
    params.delete('search');
    params.delete('dateRange');
    params.delete('building');
    params.delete('type');
    params.delete('status');
    params.delete('page'); // Reset to page 1 on new filter

    // Set new active params
    if (searchTerm) params.set('search', searchTerm);
    if (dateRange) params.set('dateRange', dateRange);
    selectedBuildings.forEach(b => params.append('building', b));
    selectedTypes.forEach(t => params.append('type', t));
    selectedStatuses.forEach(s => params.append('status', s));

    setSearchParams(params);
  };

  return (
    <div className="w-64 shrink-0 flex flex-col h-full max-h-[calc(100vh-120px)] bg-card border border-border rounded-xl overflow-hidden shadow-md transition-colors duration-200">
      
      {/* Scrollable Filter Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
        
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-foreground tracking-wide">Filters</h2>
          <button onClick={clearAll} className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            Clear All
          </button>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Building / Sensor ID" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-input text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary transition-colors duration-200" 
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Date Range</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full bg-background border-input text-foreground text-[13px] transition-colors duration-200">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground transition-colors duration-200">
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buildings */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Buildings</label>
          <div className="space-y-2.5">
            {buildings.map(b => (
              <div key={b.id} className="flex items-center space-x-3">
                <Checkbox 
                  id={`bldg-${b.id}`} 
                  checked={selectedBuildings.includes(b.id)}
                  onCheckedChange={() => toggleBuilding(b.id)}
                  className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors duration-200"
                />
                <label htmlFor={`bldg-${b.id}`} className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{b.name}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Types */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Sensor Types</label>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(t => {
              const isSelected = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors duration-200 ${
                    isSelected 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-muted-foreground">Status</label>
          <div className="space-y-2.5">
            {['Active', 'Inactive', 'Maintenance'].map(s => (
              <div key={s} className="flex items-center space-x-3">
                <Checkbox 
                  id={`status-${s}`} 
                  checked={selectedStatuses.includes(s)}
                  onCheckedChange={() => toggleStatus(s)}
                  className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors duration-200"
                />
                <label htmlFor={`status-${s}`} className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{s}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Apply Button */}
      <div className="p-4 border-t border-border bg-muted/50 shrink-0 transition-colors duration-200">
        <Button 
          onClick={handleApply}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};