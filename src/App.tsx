import React from 'react';
import { BuildingMapRenderer } from './components/layouts/BuildingMapRenderer';
import { Header } from './components/layouts/Header';
import { Footer } from './components/layouts/Footer';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />
      <main className="flex-1 relative">
        <BuildingMapRenderer />
      </main>
      <Footer />
    </div>
  );
};

export default App;