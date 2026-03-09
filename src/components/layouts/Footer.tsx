import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="flex items-center justify-between px-6 py-3 bg-background border-t border-border text-muted-foreground text-xs z-50 relative transition-colors duration-200">
      <div>
        &copy; {new Date().getFullYear()} Smart Building Monitor. All rights
        reserved.
      </div>
      <div className="flex gap-4">
        <a href="/" className="hover:text-foreground transition-colors">
          Privacy Policy
        </a>
        <a href="/" className="hover:text-foreground transition-colors">
          Terms of Service
        </a>
        <a href="/" className="hover:text-foreground transition-colors">
          Support
        </a>
      </div>
    </footer>
  );
};
