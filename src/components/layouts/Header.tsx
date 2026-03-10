import React, { useMemo } from "react";
import {
  Bell,
  LayoutDashboard,
  Database,
  Settings,
  Map,
  Activity,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ModeToggle } from "../modeToggle";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

export const Header: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const currentQuery = searchParams.toString();
  const queryString = currentQuery ? `?${currentQuery}` : "";

  const navItems = [
    { name: "Map", path: "/map", icon: Map },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Data Logs", path: "/datalog", icon: Database },
    { name: "Sensors", path: "/sensors", icon: Activity },
    { name: "Settings", path: "/", icon: Settings },
  ];

  const navigate = useNavigate();
  const { alerts, clearAlert } = useWebSocket();
  const criticalAlerts = useMemo(() => {
    return alerts.filter(
      (a) => a.type === 'Critical' || a.severity === 'CRITICAL'
    ).sort((a, b) => {
      // Sort newest first
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [alerts]);
  
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-background border-b border-border text-foreground z-50 relative transition-colors duration-200">
      {/* Left side: Logo & Title */}
      <Link 
        to={`/`} 
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="p-1.5 bg-primary rounded-md">
          <Activity className="text-white w-5 h-5" />
        </div>
        <h1 className="text-lg font-semibold tracking-wide">BuildSense</h1>
      </Link>
      {/* Right side: Navigation & Profile */}
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={`${item.path}${queryString}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* Nav Links */}

        {/* Divider */}
        <div className="w-px h-6 bg-border"></div>
        <ModeToggle />
        {/* Notifications & Profile */}
        <div className="flex items-center gap-4">
          <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-accent transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {criticalAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive border-2 border-card"></span>
                </span>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent align="end" className="w-80 p-0 bg-card border-border shadow-2xl rounded-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <h4 className="text-sm font-semibold text-foreground">Critical Alerts</h4>
              </div>
              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                {criticalAlerts.length} Action Req.
              </Badge>
            </div>
            
            <ScrollArea className="h-[300px] w-full">
              {criticalAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">All systems nominal</p>
                  <p className="text-xs text-muted-foreground mt-1">No critical sensor alerts at this time.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {criticalAlerts.map((alert, idx) => (
                    <div 
                      key={`${alert.sensorId}-${alert.timestamp}-${idx}`} 
                      className="flex flex-col p-4 border-b border-border/50 hover:bg-accent/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/sensors/${alert.sensorId}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 pr-4">
                          <span className="text-sm font-semibold text-foreground leading-tight">
                            {alert.message}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            Sensor: {alert.sensorId}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                        
                        {/* Clear alert button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          onClick={(e) => {
                            e.stopPropagation(); // Don't trigger the row click navigation
                            if (alert.timestamp) clearAlert(alert.timestamp);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* View All Button */}
            {criticalAlerts.length > 0 && (
              <div className="p-2 border-t border-border/50 bg-muted/20">
                <Button 
                  variant="ghost" 
                  className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/datalog?dataStatus=Critical')}
                >
                  View in Data Log
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

          <Avatar className="w-8 h-8 border border-border cursor-pointer hover:border-muted-foreground transition-colors">
            <AvatarImage
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              alt="User"
            />
            <AvatarImage
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              alt="User"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              US
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
