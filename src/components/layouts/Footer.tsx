import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="flex items-center justify-between px-6 py-3 bg-[#111114] border-t border-gray-800 text-gray-500 text-xs z-50 relative">
      <div>
        &copy; {new Date().getFullYear()} Smart Building Monitor. All rights reserved.
      </div>
      <div className="flex gap-4">
        <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
      </div>
    </footer>
  );
};