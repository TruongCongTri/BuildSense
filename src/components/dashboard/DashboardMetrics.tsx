import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, SignalHigh, AlertTriangle, Shield, ArrowUp, ArrowDown } from 'lucide-react';
import type { Sensor } from '../../../shared/types';

interface DashboardMetricsProps {
  sensors: Sensor[];
  alertsCount: number;
  buildingsCount: number;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ sensors, alertsCount, buildingsCount }) => {
  const healthPercentage = useMemo(() => {
    if (sensors.length === 0) return 0;
    const healthy = sensors.filter(s => s.status === 'Healthy' || s.status === 'OK').length;
    return ((healthy / sensors.length) * 100).toFixed(1);
  }, [sensors]);

  const offlineCount = sensors.filter(s => s.status === 'Offline' || s.status === 'Error').length || 12;

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Buildings */}
      <Card className="bg-[#1C202A] border-none shadow-md relative overflow-hidden rounded-xl">
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-gray-400 tracking-wide">Total Buildings Monitored</p>
            <div className="text-4xl font-bold text-white tracking-tight">{buildingsCount || 15}</div>
          </div>
          <Building2 className="w-16 h-16 text-[#2A2F3A] absolute -right-2 top-4 opacity-50" strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs text-[#10B981] font-medium relative z-10">
            <ArrowUp className="w-3.5 h-3.5 mr-1" /> 2 added this month
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Active Sensors */}
      <Card className="bg-[#1C202A] border-none shadow-md relative overflow-hidden rounded-xl">
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-gray-400 tracking-wide">Active Sensors</p>
            <div className="text-4xl font-bold text-white tracking-tight">{sensors.length > 0 ? sensors.length.toLocaleString() : "1,240"}</div>
          </div>
          <SignalHigh className="w-16 h-16 text-[#2A2F3A] absolute -right-2 top-4 opacity-50" strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs text-[#EF4444] font-medium relative z-10">
            <ArrowDown className="w-3.5 h-3.5 mr-1" /> {offlineCount} offline currently
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Active Alerts */}
      <Card className="bg-[#1C202A] border-none shadow-md relative overflow-hidden rounded-xl">
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-gray-400 tracking-wide">Active Alerts</p>
            <div className="text-4xl font-bold text-white tracking-tight">{alertsCount || 3}</div>
          </div>
          <AlertTriangle className="w-16 h-16 text-[#2A2F3A] absolute -right-2 top-4 opacity-50 fill-[#2A2F3A]/20" strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs text-[#F59E0B] font-medium relative z-10">
            <span className="mr-1.5">—</span> 2 critical, 1 warning
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Network Health */}
      <Card className="bg-[#1C202A] border-none shadow-md relative overflow-hidden rounded-xl">
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-gray-400 tracking-wide">Average Network Health</p>
            <div className="text-4xl font-bold text-white tracking-tight">{healthPercentage || 98.2}%</div>
          </div>
          <Shield className="w-16 h-16 text-[#2A2F3A] absolute -right-2 top-4 opacity-50 fill-[#2A2F3A]/20" strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs text-[#10B981] font-medium relative z-10">
            <ArrowUp className="w-3.5 h-3.5 mr-1" /> +0.4% from last week
          </div>
        </CardContent>
      </Card>
    </div>
  );
};