import React from 'react';
import PropertiesPanel from '../panels/PropertiesPanel';
import ResultsPanel from '../panels/ResultsPanel';
import ConfigPanel from '../panels/ConfigPanel';

interface RightPanelProps {
  activePanel: string;
  onClose: () => void;
}

export default function RightPanel({ activePanel, onClose }: RightPanelProps) {
  if (!activePanel) return null;

  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-white/[0.06] bg-[#141720] overflow-hidden">
      {activePanel === 'properties' && <PropertiesPanel />}
      {activePanel === 'results' && <ResultsPanel onClose={onClose} />}
      {activePanel === 'config' && <ConfigPanel />}
    </div>
  );
}
