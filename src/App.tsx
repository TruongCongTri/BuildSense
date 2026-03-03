import React from 'react';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#e0e0e0' }}>
      
      {/* 1. The Global Dashboard (Floating UI) */}
      <Dashboard />

      {/* 2. Placeholder for the ArcGIS Map */}
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: '#aaa' }}>ArcGIS Map Loading...</h1>
        {/* Replace this div with <ArcGISMap /> in the next step */}
      </div>

    </div>
  );
};

export default App;