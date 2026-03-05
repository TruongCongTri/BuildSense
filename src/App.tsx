import React from 'react';
import { BuildingMapRenderer } from './components/layouts/BuildingMapRenderer';

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
      
      {/* The BuildingMapRenderer acts as the main orchestrator for Phase 2-6.
        It contains the ArcGIS 3D Scene, the Filter UI, the Sensor Drawer, 
        and the Global Dashboard Modal.
      */}
      <BuildingMapRenderer />

    </div>
  );
};

export default App;