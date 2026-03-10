import React from "react";
import { Tag, MapPin, Settings2, ShieldCheck, ShieldAlert, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Sensor } from "../../../shared/types";

interface SensorMetadataProps {
  sensor: Sensor;
}

export const SensorMetadata: React.FC<SensorMetadataProps> = ({ sensor }) => {
  const getStatusBadge = (status: string, type: 'health' | 'admin') => {
    switch (type) {
      case 'admin':
        if (status === 'Maintenance') return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase">Maint.</Badge>;
        if (status === 'Active') return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Active</Badge>;
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase">{status}</Badge>;
      case 'health':
        if (status === 'Offline' || status === 'Error') return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase">{status}</Badge>;
        if (status === 'Warning') return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase">Warning</Badge>;
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">Healthy</Badge>;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <Card className="bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Sensor Type</p>
            <div className="text-3xl font-bold text-foreground tracking-tight">{sensor.type}</div>
          </div>
          <Tag className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-primary" strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">Measuring in {sensor.unit}</div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-500/50">
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Deployment Location</p>
            <div className="text-3xl font-bold text-foreground tracking-tight truncate" title={sensor.location}>{sensor.location}</div>
          </div>
          <MapPin className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-blue-500" strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">Building ID: {sensor.buildingId}</div>
        </CardContent>
      </Card>

      <Card className={`bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${sensor.adminStatus === 'Active' ? 'hover:border-emerald-500/50' : 'hover:border-amber-500/50'}`}>
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Admin Status</p>
            <div className="text-3xl font-bold text-foreground tracking-tight mt-1">{sensor.adminStatus}</div>
          </div>
          <Settings2 className={`w-16 h-16 absolute -right-2 top-4 opacity-40 ${sensor.adminStatus === 'Active' ? 'text-emerald-500' : 'text-amber-500'}`} strokeWidth={1.5} />
          <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">
             {getStatusBadge(sensor.adminStatus, 'admin')} <span className="ml-2">System intent</span>
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${sensor.healthStatus === 'Healthy' ? 'hover:border-emerald-500/50' : sensor.healthStatus === 'Warning' ? 'hover:border-amber-500/50' : 'hover:border-slate-500/50'}`}>
        <CardContent className="p-6">
          <div className="relative z-10 space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground tracking-wide">Hardware Health</p>
            <div className="text-3xl font-bold text-foreground tracking-tight mt-1">{sensor.healthStatus}</div>
          </div>
          {sensor.healthStatus === 'Healthy' ? <ShieldCheck className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-emerald-500" strokeWidth={1.5} /> :
           sensor.healthStatus === 'Warning' ? <ShieldAlert className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-amber-500" strokeWidth={1.5} /> :
           <WifiOff className="w-16 h-16 absolute -right-2 top-4 opacity-40 text-slate-500" strokeWidth={1.5} />}
          <div className="mt-5 flex items-center text-xs font-medium relative z-10 text-muted-foreground">
             {getStatusBadge(sensor.healthStatus, 'health')} <span className="ml-2">Network capability</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};