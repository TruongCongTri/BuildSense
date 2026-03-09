import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const MainLayout: React.FC = () => {
  return (
    // h-screen ensures the app never scrolls past the window height
    // flex-col stacks Header -> Main Content -> Footer vertically
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* 1. TOP: The persistent Header */}
      <Header />

      {/* 2. MIDDLE: The dynamic page content */}
      {/* flex-1 tells this container to expand and fill all remaining space between Header & Footer */}
      <main className="flex-1 relative overflow-hidden">
        {/* The <Outlet /> is where React Router injects DashboardPage or BuildingMapRenderer */}
        <Outlet />
      </main>

      {/* 3. BOTTOM: The persistent Footer */}
      <Footer />
    </div>
  );
};
