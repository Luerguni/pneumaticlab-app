import React from 'react';
import {
  MousePointer2, Grid3X3, Magnet, RotateCcw, RotateCw,
  Trash2, Ruler, Type, Download, Save, ZoomIn, ZoomOut, Layers,
  Home, Square, Play, Pause, StopCircle, Eye, EyeOff
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useProjectStore } from '../../store/projectStore';
import { useSimStore } from '../../store/simulationStore';
import type { ToolMode, PipeType } from '../../types';

const PIPE_TOOLS: { type: PipeType; label: string; color: string }[] = [
  { type: 'main', label: 'Principal', color: '#00D4FF' },
  { type: 'secondary', label: 'Secundaria', color: '#FFFFFF' },
  { type: 'service', label: 'Servicio', color: '#7C8DB0' },
  { type: 'return', label: 'Retorno', color: '#FF6B35' },
];

interface ToolBtnProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  accent?: boolean;
}

function ToolBtn({ active, onClick, title, children, danger, accent }: ToolBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded transition-all text-sm ${
        active
          ? accent
            ? 'bg-[#FF6B3522] text-[#FF6B35] border border-[#FF6B3555]'
            : 'bg-[#00D4FF22] text-[#00D4FF] border border-[#00D4FF55]'
          : danger
          ? 'text-[#FF6B35] hover:bg-[#FF6B3522] hover:text-[#FF6B35]'
          : 'text-white/50 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

interface PipeBtnProps {
  type: PipeType; label: string; color: string; active: boolean; onClick: () => void;
}

function PipeBtn({ type: _type, label, color, active, onClick }: PipeBtnProps) {
  return (
    <button
      onClick={onClick}
      title={`Tubería ${label}`}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all ${
        active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
      <span style={{ color: active ? color : undefined }}>{label}</span>
    </button>
  );
}

interface Props {
  floorTool: 'wall' | 'room' | null;
  setFloorTool: (t: 'wall' | 'room' | null) => void;
}

export default function CanvasToolbar({ floorTool, setFloorTool }: Props) {
  const canvas = useCanvasStore();
  const project = useProjectStore(s => s.project);
  const saveProject = useProjectStore(s => s.saveProject);
  const { sim, floorPlan, toggleFloorPlanVisible } = useSimStore();

  const setTool = (tool: ToolMode) => {
    canvas.setTool(tool);
    canvas.stopDrawingPipe();
    setFloorTool(null);
  };

  const setPipeTool = (type: PipeType) => {
    canvas.setActivePipeType(type);
    canvas.setTool(`pipe_${type}` as ToolMode);
    canvas.stopDrawingPipe();
    setFloorTool(null);
  };

  const setFTool = (t: 'wall' | 'room') => {
    setFloorTool(floorTool === t ? null : t);
    canvas.setTool('select');
  };

  const exportPNG = () => {
    const cvs = document.querySelector('canvas') as HTMLCanvasElement;
    if (!cvs) return;
    const link = document.createElement('a');
    link.download = `${project.name}.png`;
    link.href = cvs.toDataURL('image/png');
    link.click();
  };

  const isSimActive = sim.status !== 'idle';

  return (
    <div className="h-10 flex items-center gap-1 px-3 border-b border-white/[0.06] bg-[#141720] shrink-0 overflow-x-auto">
      {/* Selection / edit tools */}
      <ToolBtn active={canvas.tool === 'select' && !floorTool} onClick={() => setTool('select')} title="Selección (V)">
        <MousePointer2 size={14} />
      </ToolBtn>
      <ToolBtn active={canvas.tool === 'delete'} onClick={() => setTool('delete')} title="Borrar (Delete)" danger>
        <Trash2 size={14} />
      </ToolBtn>
      <ToolBtn onClick={() => setTool('measure')} active={canvas.tool === 'measure'} title="Medir">
        <Ruler size={14} />
      </ToolBtn>
      <ToolBtn onClick={() => setTool('annotate')} active={canvas.tool === 'annotate'} title="Texto">
        <Type size={14} />
      </ToolBtn>

      <div className="h-5 w-px bg-white/[0.08] mx-0.5 shrink-0" />

      {/* Pipe tools */}
      <span className="text-white/25 text-[10px] font-mono mr-0.5 shrink-0">TUBERÍA</span>
      {PIPE_TOOLS.map(pt => (
        <PipeBtn
          key={pt.type}
          type={pt.type}
          label={pt.label}
          color={pt.color}
          active={canvas.tool === `pipe_${pt.type}` && !floorTool}
          onClick={() => setPipeTool(pt.type)}
        />
      ))}

      <div className="h-5 w-px bg-white/[0.08] mx-0.5 shrink-0" />

      {/* Floor plan tools */}
      <span className="text-white/25 text-[10px] font-mono mr-0.5 shrink-0">PLANO</span>
      <ToolBtn
        active={floorTool === 'wall'}
        onClick={() => setFTool('wall')}
        title="Dibujar muro/pared"
        accent
      >
        <Home size={13} />
      </ToolBtn>
      <ToolBtn
        active={floorTool === 'room'}
        onClick={() => setFTool('room')}
        title="Dibujar habitación/zona"
        accent
      >
        <Square size={13} />
      </ToolBtn>
      <ToolBtn
        active={floorPlan.visible}
        onClick={toggleFloorPlanVisible}
        title={floorPlan.visible ? 'Ocultar plano' : 'Mostrar plano'}
      >
        {floorPlan.visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </ToolBtn>

      <div className="h-5 w-px bg-white/[0.08] mx-0.5 shrink-0" />

      {/* Canvas view options */}
      <ToolBtn active={canvas.gridVisible} onClick={canvas.toggleGrid} title="Grid">
        <Grid3X3 size={14} />
      </ToolBtn>
      <ToolBtn active={canvas.snapToGrid} onClick={canvas.toggleSnap} title="Snap to grid">
        <Magnet size={14} />
      </ToolBtn>
      <ToolBtn active={canvas.gridIsometric} onClick={canvas.toggleIsometric} title="Grid isométrico">
        <Layers size={14} />
      </ToolBtn>

      <div className="h-5 w-px bg-white/[0.08] mx-0.5 shrink-0" />

      {/* Zoom */}
      <ToolBtn onClick={() => canvas.zoom(1.25)} title="Acercar (+)">
        <ZoomIn size={14} />
      </ToolBtn>
      <ToolBtn onClick={() => canvas.zoom(0.8)} title="Alejar (-)">
        <ZoomOut size={14} />
      </ToolBtn>
      <button
        onClick={() => canvas.setViewport({ x: 0, y: 0, zoom: 1 })}
        className="text-white/40 hover:text-white text-[10px] font-mono px-2 hover:bg-white/10 rounded transition-colors shrink-0"
        title="Restablecer vista"
      >
        {(canvas.viewport.zoom * 100).toFixed(0)}%
      </button>

      {/* Scale selector */}
      <div className="flex items-center gap-1 ml-1 shrink-0">
        <span className="text-white/25 text-[10px] font-mono">Escala</span>
        <select
          className="bg-[#1C2030] border border-white/10 text-white text-[10px] font-mono px-1.5 py-0.5 rounded outline-none focus:border-[#00D4FF44]"
          value={canvas.scale}
          onChange={e => canvas.setScale(parseFloat(e.target.value))}
        >
          <option value={0.1}>0.1m/cel — Lab</option>
          <option value={0.25}>0.25m/cel</option>
          <option value={0.5}>0.5m/cel — Taller</option>
          <option value={1}>1m/cel</option>
          <option value={2}>2m/cel — Industrial</option>
          <option value={5}>5m/cel</option>
          <option value={10}>10m/cel</option>
        </select>
      </div>

      {/* Diameter */}
      <div className="flex items-center gap-1 ml-1 shrink-0">
        <span className="text-white/25 text-[10px] font-mono">Ø</span>
        <select
          className="bg-[#1C2030] border border-white/10 text-white text-[10px] font-mono px-1.5 py-0.5 rounded outline-none focus:border-[#00D4FF44]"
          title="Diámetro para nuevas tuberías"
        >
          {[6, 8, 10, 12, 15, 20, 25, 32, 40, 50, 65, 80, 100].map(d => (
            <option key={d} value={d}>{d}mm</option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* Undo/redo */}
      <ToolBtn onClick={() => {}} title="Deshacer (Ctrl+Z)">
        <RotateCcw size={14} />
      </ToolBtn>
      <ToolBtn onClick={() => {}} title="Rehacer (Ctrl+Y)">
        <RotateCw size={14} />
      </ToolBtn>

      <div className="h-5 w-px bg-white/[0.08] mx-0.5 shrink-0" />

      {/* Sim status badge */}
      {isSimActive && (
        <div className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded ${
          sim.status === 'running' ? 'bg-[#00FF9D15] text-[#00FF9D]' :
          sim.status === 'failed' ? 'bg-red-500/15 text-red-400' :
          'bg-yellow-500/15 text-yellow-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            sim.status === 'running' ? 'bg-[#00FF9D] animate-pulse' :
            sim.status === 'failed' ? 'bg-red-400 animate-pulse' :
            'bg-yellow-400'
          }`} />
          {sim.status === 'running' ? 'SIM' : sim.status === 'failed' ? 'ERROR' : 'PAUSA'}
        </div>
      )}

      <ToolBtn onClick={exportPNG} title="Exportar PNG">
        <Download size={14} />
      </ToolBtn>
      <ToolBtn onClick={saveProject} title="Guardar (Ctrl+S)">
        <Save size={14} />
      </ToolBtn>
    </div>
  );
}
