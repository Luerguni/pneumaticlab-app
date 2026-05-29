import React, { useState } from 'react';
import { Save, Play, Download, Settings, BarChart2, FileText, Upload, Zap, ZapOff } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useResultsStore } from '../../store/resultsStore';
import { useSimStore } from '../../store/simulationStore';
import { calculateSystem } from '../../engine/calculator';
import { setupSimulation } from '../../engine/simulation';
import { useCanvasStore } from '../../store/canvasStore';
import type { Project } from '../../types';

interface HeaderProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export default function Header({ activePanel, setActivePanel }: HeaderProps) {
  const project = useProjectStore(s => s.project);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const saveProject = useProjectStore(s => s.saveProject);
  const isDirty = useProjectStore(s => s.isDirty);
  const setResult = useResultsStore(s => s.setResult);
  const setCalculating = useResultsStore(s => s.setCalculating);
  const isCalculating = useResultsStore(s => s.isCalculating);
  const canvasStore = useCanvasStore();
  const { sim, startSim, stopSim, setParticles, setFailures, setPressureAtEnd } = useSimStore();
  const [editingName, setEditingName] = useState(false);

  const handleCalculate = async () => {
    if (project.pipes.length === 0) {
      alert('Agrega al menos una tubería en el canvas antes de calcular.');
      return;
    }
    setCalculating(true);
    setActivePanel('results');
    // Yield to let UI update
    await new Promise(r => setTimeout(r, 50));
    try {
      const pixelsPerMeter = project.gridSize / project.systemConfig.workPressure;
      // Use canvas scale: gridSize px = scale m → pixelsPerMeter = gridSize / scale
      const ppm = canvasStore.gridSize / canvasStore.scale;
      const result = calculateSystem(project.pipes, project.systemConfig, ppm);
      setResult(result);
    } finally {
      setCalculating(false);
    }
  };

  const handleSimulate = async () => {
    if (sim.status !== 'idle') { stopSim(); return; }
    if (project.pipes.length === 0) {
      alert('Agrega al menos una tubería antes de simular.');
      return;
    }
    const ppm = canvasStore.gridSize / canvasStore.scale;
    const setup = setupSimulation(project.pipes, project.symbols, project.systemConfig, ppm);
    setParticles(setup.particles);
    setFailures(setup.failures);
    setPressureAtEnd(setup.pressureAtEnd);
    startSim();
  };

  const handleExport = () => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.pneum`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pneum,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const proj = JSON.parse(text) as Project;
      useProjectStore.getState().loadProject(proj);
    };
    input.click();
  };

  const panelTabs = [
    { id: 'properties', label: 'Propiedades', icon: Settings },
    { id: 'results', label: 'Resultados', icon: BarChart2 },
    { id: 'config', label: 'Configuración', icon: FileText },
  ];

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-[#141720] shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded bg-[#00D4FF15] border border-[#00D4FF33] flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#00D4FF" strokeWidth="2" />
            <path d="M12 22V12M2 7l10 5M22 7l-10 5" stroke="#00D4FF" strokeWidth="2" />
          </svg>
        </div>
        <span className="text-xs font-mono font-bold text-white tracking-tight">
          Pneumatic<span className="text-[#00D4FF]">Lab</span>
        </span>
      </div>

      <div className="h-4 w-px bg-white/[0.08]" />

      {/* Project name */}
      {editingName ? (
        <input
          autoFocus
          type="text"
          value={project.name}
          onChange={e => setProjectName(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
          className="bg-[#1C2030] border border-[#00D4FF44] text-white text-xs font-mono px-2 py-1 rounded outline-none w-48"
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="text-xs font-mono text-white/70 hover:text-white transition-colors flex items-center gap-1"
          title="Editar nombre del proyecto"
        >
          {project.name}
          {isDirty && <span className="text-[#FF6B35] text-[10px]">●</span>}
        </button>
      )}

      {/* Panel tabs */}
      <div className="flex items-center gap-0.5 ml-4 bg-[#0D0F14] rounded-md p-0.5">
        {panelTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(activePanel === tab.id ? '' : tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                activePanel === tab.id
                  ? 'bg-[#1C2030] text-white border border-white/[0.08]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={11} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-white/40 hover:text-white/70 text-[10px] font-mono rounded hover:bg-white/5 transition-all"
          title="Importar proyecto"
        >
          <Upload size={12} />
          Importar
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-white/40 hover:text-white/70 text-[10px] font-mono rounded hover:bg-white/5 transition-all"
          title="Exportar .pneum"
        >
          <Download size={12} />
          Exportar
        </button>

        <button
          onClick={saveProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-white/50 hover:text-white text-[10px] font-mono rounded hover:bg-white/5 transition-all"
          title="Guardar (Ctrl+S)"
        >
          <Save size={12} />
          Guardar
        </button>

        {/* Simulate button */}
        <button
          onClick={handleSimulate}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono font-bold text-xs rounded transition-all ${
            sim.status !== 'idle'
              ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B3544] hover:bg-[#FF6B35]/30'
              : 'bg-[#1C2030] text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
          title={sim.status !== 'idle' ? 'Detener simulación' : 'Simular circuito con animaciones'}
        >
          {sim.status !== 'idle' ? <ZapOff size={12} /> : <Zap size={12} />}
          {sim.status !== 'idle' ? 'Detener sim.' : 'Simular'}
        </button>

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={`flex items-center gap-1.5 px-4 py-1.5 font-mono font-bold text-xs rounded transition-all ${
            isCalculating
              ? 'bg-[#00D4FF]/30 text-white/50 cursor-not-allowed'
              : 'bg-[#00D4FF] text-[#0D0F14] hover:bg-[#00D4FF]/90 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <Play size={12} />
          {isCalculating ? 'Calculando...' : 'Calcular Sistema'}
        </button>
      </div>
    </header>
  );
}
