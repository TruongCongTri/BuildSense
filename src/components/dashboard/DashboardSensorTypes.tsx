import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Thermometer, Wind, Lightbulb, Droplet, Activity, CloudRain, ShieldAlert, Waves } from 'lucide-react';
import type { Sensor } from '../../../shared/types';

interface DashboardSensorTypesProps {
  sensors: Sensor[];
}

// Map your backend sensor types to specific colors and icons
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {  
  'Temperature': { icon: Thermometer, color: '#3B82F6', bg: 'bg-[#3B82F6]/10' },
  'Wind': { icon: Wind, color: '#9333EA', bg: 'bg-[#9333EA]/10' },
  'Occupancy': { icon: Lightbulb, color: '#EAB308', bg: 'bg-[#EAB308]/10' },
  'Humidity': { icon: Droplet, color: '#14B8A6', bg: 'bg-[#14B8A6]/10' },
  'Rain': { icon: CloudRain, color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10' },
  'Air Quality': { icon: Waves, color: '#F43F5E', bg: 'bg-[#F43F5E]/10' },
  'Structural Strain': { icon: ShieldAlert, color: '#F97316', bg: 'bg-[#F97316]/10' },
};

export const DashboardSensorTypes: React.FC<DashboardSensorTypesProps> = ({ sensors }) => {
  // Dynamically group, count, and sort the real sensor data
  const typeStats = useMemo(() => {
    if (!sensors || sensors.length === 0) return [];
    
    const counts: Record<string, number> = {};
    sensors.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
    
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / sensors.length) * 100),
        ...(TYPE_CONFIG[name] || { icon: Activity, color: '#64748B', bg: 'bg-[#64748B]/10' })
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Show top 4 to fit the design
  }, [sensors]);

  return (
    <Card className="bg-card border border-border shadow-md flex flex-col h-full rounded-xl transition-colors duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6 border-b border-border/50">
        <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Sensor Types</CardTitle>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 px-6 pb-6">
        <div className="flex-1 space-y-6 mt-4">
          {typeStats.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No sensor data available</div>
          ) : (
            typeStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">{stat.name}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">{stat.count} deployed</div>
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-foreground">{stat.percentage}%</div>
                </div>
              );
            })
          )}
        </div>
        <div className="pt-8 mt-auto text-center">
          <button className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            View All Inventory
          </button>
        </div>
      </CardContent>
    </Card>
  );
};