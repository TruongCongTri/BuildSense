import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical, Thermometer, Activity, Scale, Wind, Lightbulb, Droplet, CloudRain, Waves } from 'lucide-react';
import type { Sensor } from '../../../shared/types';
import { useNavigate } from 'react-router-dom';

interface DashboardSensorTypesProps {
  sensors: Sensor[];
}

// Map exact backend sensor types to the correct icons and chart colors!
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {  
  'Temperature': { icon: Thermometer, color: '#f97316', bg: 'bg-[#f97316]/10' }, 
  'Load': { icon: Scale, color: '#3b82f6', bg: 'bg-[#3b82f6]/10' },              
  'Strain': { icon: Activity, color: '#a855f7', bg: 'bg-[#a855f7]/10' },         
  'Wind': { icon: Wind, color: '#9333EA', bg: 'bg-[#9333EA]/10' },
  'Occupancy': { icon: Lightbulb, color: '#EAB308', bg: 'bg-[#EAB308]/10' },
  'Humidity': { icon: Droplet, color: '#14B8A6', bg: 'bg-[#14B8A6]/10' },
  'Rain': { icon: CloudRain, color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10' },
  'Air Quality': { icon: Waves, color: '#F43F5E', bg: 'bg-[#F43F5E]/10' },
};

export const DashboardSensorTypes: React.FC<DashboardSensorTypesProps> = ({ sensors }) => {
  const navigate = useNavigate();
  
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
        // Fallback to a generic gray 'Activity' icon if a new unknown sensor type appears
        ...(TYPE_CONFIG[name] || { icon: Activity, color: '#64748B', bg: 'bg-[#64748B]/10' })
      }))
      .sort((a, b) => b.count - a.count)
  }, [sensors]);

  return (
    <Card className="bg-card border border-border shadow-md flex flex-col h-full rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6 border-b border-border/50">
        <CardTitle className="text-[17px] font-semibold text-foreground tracking-wide">Sensor Types</CardTitle>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
        {/* ScrollArea dynamically handles overflow if there are more than ~4 items */}
        <ScrollArea className="flex-1 w-full px-6 py-4">
          <div className="space-y-2">
            {typeStats.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No sensor data available</div>
            ) : (
              typeStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={idx} 
                    // Click routes specific query parameter
                    onClick={() => navigate(`/datalog?type=${stat.name}`)}
                    className="flex items-center justify-between cursor-pointer p-3 -mx-3 rounded-lg hover:bg-accent transition-colors"
                  >
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
        </ScrollArea>

        {/* Pinned button at the bottom (shrink-0 ensures it never gets squished) */}
        <div className="px-6 py-4 border-t border-border/50 text-center shrink-0 mt-auto bg-card/50">
          <button 
            // General routing fallback
            onClick={() => navigate('/datalog')}
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer w-full"
          >
            View All Inventory
          </button>
        </div>
      </CardContent>
    </Card>
  );
};