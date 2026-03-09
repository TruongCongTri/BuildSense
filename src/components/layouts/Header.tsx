import React from "react";
import {
  Bell,
  LayoutDashboard,
  Database,
  Settings,
  Map,
  Activity,
} from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ModeToggle } from "../modeToggle";

export const Header: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const currentQuery = searchParams.toString();
  const queryString = currentQuery ? `?${currentQuery}` : "";

  const navItems = [
    { name: "Map", path: "/map", icon: Map },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Data Logs", path: "/datalog", icon: Database },
    { name: "Sensors", path: "/", icon: Activity },
    { name: "Settings", path: "/", icon: Settings },
  ];

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
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background"></span>
          </button>

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
