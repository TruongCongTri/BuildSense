import React from 'react';
import { BuildingMapRenderer } from './components/layouts/BuildingMapRenderer';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { MainLayout } from './components/layouts/MainLayout';
import { DataLogPage } from './pages/DataLogPage';

const App: React.FC = () => {
  return (
      <Routes>
        
        {/* The Parent Route wrapper. It renders the Header and Footer. */}
        <Route element={<MainLayout />}>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/map" replace />} />
          
          {/* These children get rendered INSIDE the <Outlet /> of MainLayout */}
          <Route path="/map" element={<BuildingMapRenderer />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/datalog" element={<DataLogPage />} />
          {/* Add future routes here like /settings, /network, etc. */}
          
        </Route>

      </Routes>
  );
};

export default App;