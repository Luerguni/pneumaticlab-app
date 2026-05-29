import React, { useState, useEffect } from 'react';
import HomeScreen from './components/ui/HomeScreen';
import Header from './components/ui/Header';
import RightPanel from './components/ui/RightPanel';
import CanvasToolbar from './components/canvas/CanvasToolbar';
import CanvasEditor from './components/canvas/CanvasEditor';
import SymbolLibrary from './components/canvas/SymbolLibrary';
import SimPanel from './components/ui/SimPanel';
import CircuitTypeModal from './components/ui/CircuitTypeModal';
import { useProjectStore } from './store/projectStore';
import { useSimStore } from './store/simulationStore';
import type { CircuitPreset } from './types/floorplan';

type AppView = 'home' | 'editor';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [activePanel, setActivePanel] = useState<string>('properties');
  const [showCircuitModal, setShowCircuitModal] = useState(false);
  const [floorTool, setFloorTool] = useState<'wall' | 'room' | null>(null);

  const saveProject = useProjectStore(s => s.saveProject);
  const { stopSim } = useSimStore();

  // Ctrl+S global shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
      // ESC closes floor tool
      if (e.key === 'Escape') setFloorTool(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [saveProject]);

  const handleNewProject = () => {
    stopSim();
    setShowCircuitModal(true);
    setView('editor');
  };

  const handleCircuitSelect = (_preset: CircuitPreset) => {
    // preset already applied in CircuitTypeModal via store calls
  };

  if (view === 'home') {
    return (
      <>
        <HomeScreen onStart={handleNewProject} />
        {showCircuitModal && (
          <CircuitTypeModal
            onClose={() => setShowCircuitModal(false)}
            onSelect={handleCircuitSelect}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0D0F14]">
      <Header
        activePanel={activePanel}
        setActivePanel={setActivePanel}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Symbol Library */}
        <SymbolLibrary />

        {/* Center: Canvas area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <CanvasToolbar
            floorTool={floorTool}
            setFloorTool={setFloorTool}
          />
          <CanvasEditor floorTool={floorTool} />
        </div>

        {/* Right: Properties / Results / Config */}
        <RightPanel
          activePanel={activePanel}
          onClose={() => setActivePanel('')}
        />
      </div>

      {/* Simulation status bar */}
      <SimPanel />

      {/* Circuit type modal */}
      {showCircuitModal && (
        <CircuitTypeModal
          onClose={() => setShowCircuitModal(false)}
          onSelect={handleCircuitSelect}
        />
      )}
    </div>
  );
}
