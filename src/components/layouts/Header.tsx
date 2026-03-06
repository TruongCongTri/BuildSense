import React from 'react';
import { LayoutGrid, Bell, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#111114] border-b border-gray-800 text-white z-50 relative">
      {/* Left side: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-blue-600 rounded-md">
          <LayoutGrid className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold tracking-wide">Smart Building Monitor</h1>
      </div>

      {/* Right side: Navigation & Profile */}
      <div className="flex items-center gap-8">
        {/* Nav Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="text-blue-500 border-b-2 border-blue-500 pb-1">Map View</a>
          <a href="#" className="hover:text-white transition-colors">Reports</a>
          <a href="#" className="hover:text-white transition-colors">Settings</a>
        </nav>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700"></div>

        {/* Notifications & Profile */}
        <div className="flex items-center gap-5">
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Admin User
            </span>
            <div className="p-1.5 bg-gray-800 rounded-full group-hover:bg-gray-700 transition-colors">
              <User className="w-4 h-4 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};