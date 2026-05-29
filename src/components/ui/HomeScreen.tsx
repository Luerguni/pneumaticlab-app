import React, { useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { FolderOpen, Plus, Clock, Upload } from 'lucide-react';
import type { Project, PipeSegment, SymbolInstance } from '../../types';

const TEMPLATES: { name: string; desc: string; project: Partial<Project> }[] = [
  {
    name: 'Sistema simple — 1 pistón',
    desc: 'Compresor → FRL → Válvula 5/2 → Cilindro doble efecto',
    project: {
      pipes: [
        {
          id: 'p1', type: 'main', name: 'Principal',
          start: { x: 200, y: 200 }, end: { x: 500, y: 200 },
          diameter: 25, lengthReal: 10, material: 'galvanized_steel',
          roughness: 0.15, elbows90: 1, elbows45: 0, tees: 0, globeValves: 0,
          consumers: [{ id: 'c1', name: 'Cilindro DA', flowRate: 300, minPressure: 5 }],
          notes: '',
        } as PipeSegment,
        {
          id: 'p2', type: 'service', name: 'Servicio A',
          start: { x: 500, y: 200 }, end: { x: 700, y: 200 },
          diameter: 15, lengthReal: 5, material: 'polyurethane',
          roughness: 0.007, elbows90: 0, elbows45: 0, tees: 0, globeValves: 0,
          consumers: [], notes: '',
        } as PipeSegment,
      ],
      symbols: [
        { id: 's1', type: 'compressor', position: { x: 100, y: 200 }, rotation: 0, label: 'C1', code: 'COMP-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's2', type: 'frl', position: { x: 300, y: 200 }, rotation: 0, label: 'FRL-01', code: 'FRL-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's3', type: 'valve_5_2', position: { x: 550, y: 200 }, rotation: 0, label: 'V1', code: 'YV-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's4', type: 'cylinder_double', position: { x: 720, y: 200 }, rotation: 0, label: 'A1', code: 'CYL-01', ports: [], properties: {} } as SymbolInstance,
      ],
    },
  },
  {
    name: 'Sistema multi-zona',
    desc: 'Red principal con 3 derivaciones a diferentes zonas de trabajo',
    project: {
      pipes: [
        {
          id: 'p1', type: 'main', name: 'Colector principal',
          start: { x: 150, y: 150 }, end: { x: 650, y: 150 },
          diameter: 40, lengthReal: 25, material: 'galvanized_steel',
          roughness: 0.15, elbows90: 2, elbows45: 0, tees: 3, globeValves: 0,
          consumers: [], notes: 'Colector principal',
        } as PipeSegment,
        {
          id: 'p2', type: 'secondary', name: 'Zona A',
          start: { x: 250, y: 150 }, end: { x: 250, y: 350 },
          diameter: 20, lengthReal: 8, material: 'copper',
          roughness: 0.0015, elbows90: 1, elbows45: 0, tees: 0, globeValves: 0,
          consumers: [{ id: 'c1', name: 'Robot A', flowRate: 200, minPressure: 5.5 }],
          notes: '',
        } as PipeSegment,
        {
          id: 'p3', type: 'secondary', name: 'Zona B',
          start: { x: 400, y: 150 }, end: { x: 400, y: 350 },
          diameter: 20, lengthReal: 12, material: 'copper',
          roughness: 0.0015, elbows90: 2, elbows45: 0, tees: 0, globeValves: 0,
          consumers: [{ id: 'c2', name: 'Robot B', flowRate: 350, minPressure: 5 }],
          notes: '',
        } as PipeSegment,
        {
          id: 'p4', type: 'service', name: 'Zona C',
          start: { x: 600, y: 150 }, end: { x: 600, y: 350 },
          diameter: 15, lengthReal: 6, material: 'polyurethane',
          roughness: 0.007, elbows90: 1, elbows45: 0, tees: 0, globeValves: 0,
          consumers: [{ id: 'c3', name: 'Herramienta', flowRate: 80, minPressure: 4.5 }],
          notes: '',
        } as PipeSegment,
      ],
      symbols: [
        { id: 's1', type: 'compressor', position: { x: 80, y: 150 }, rotation: 0, label: 'C1', code: 'COMP-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's2', type: 'reservoir', position: { x: 130, y: 150 }, rotation: 0, label: 'ACC-01', code: 'ACC-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's3', type: 'frl', position: { x: 180, y: 150 }, rotation: 0, label: 'FRL-01', code: 'FRL-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's4', type: 'valve_5_2', position: { x: 250, y: 300 }, rotation: 0, label: 'YV-A', code: 'YV-01', ports: [], properties: {} } as SymbolInstance,
        { id: 's5', type: 'valve_5_2', position: { x: 400, y: 300 }, rotation: 0, label: 'YV-B', code: 'YV-02', ports: [], properties: {} } as SymbolInstance,
        { id: 's6', type: 'valve_3_2', position: { x: 600, y: 300 }, rotation: 0, label: 'YV-C', code: 'YV-03', ports: [], properties: {} } as SymbolInstance,
      ],
    },
  },
];

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const loadProject = useProjectStore(s => s.loadProject);
  const newProject = useProjectStore(s => s.newProject);
  const loadFromLocalStorage = useProjectStore(s => s.loadFromLocalStorage);
  const recentProjects = useProjectStore(s => s.recentProjects);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const handleNew = () => { newProject(); onStart(); };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pneum,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const project = JSON.parse(text) as Project;
      loadProject(project);
      onStart();
    };
    input.click();
  };

  const handleLoadRecent = (id: string) => {
    const raw = localStorage.getItem(`pneumaticlab_project_${id}`);
    if (!raw) return;
    const project = JSON.parse(raw) as Project;
    loadProject(project);
    onStart();
  };

  const handleTemplate = (tpl: typeof TEMPLATES[0]) => {
    newProject();
    const store = useProjectStore.getState();
    const proj = store.project;
    (tpl.project.pipes ?? []).forEach(p => store.addPipe(p));
    (tpl.project.symbols ?? []).forEach(s => store.addSymbol(s));
    store.setProjectName(tpl.name);
    void proj;
    onStart();
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#00D4FF] opacity-[0.03] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#FF6B35] opacity-[0.03] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-12">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF15] border border-[#00D4FF33] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#00D4FF" strokeWidth="1.5" />
                <path d="M12 22V12M2 7l10 5M22 7l-10 5" stroke="#00D4FF" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold tracking-tight text-white">
                Pneumatic<span className="text-[#00D4FF]">Lab</span>
              </h1>
              <p className="text-xs font-mono text-white/40 tracking-widest">
                DISEÑO Y CÁLCULO DE SISTEMAS NEUMÁTICOS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-white/20">
            <span>ISO 1219</span>
            <span>·</span>
            <span>Darcy-Weisbach</span>
            <span>·</span>
            <span>Colebrook-White</span>
            <span>·</span>
            <span>Sutherland</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleNew}
            className="flex items-center gap-2.5 px-6 py-3 bg-[#00D4FF] text-[#0D0F14] font-mono font-bold text-sm rounded-lg hover:bg-[#00D4FF]/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            Nuevo Proyecto
          </button>
          <button
            onClick={handleOpen}
            className="flex items-center gap-2.5 px-6 py-3 bg-[#1C2030] border border-white/10 text-white/80 font-mono text-sm rounded-lg hover:bg-[#1C2030]/80 hover:border-white/20 transition-all"
          >
            <FolderOpen size={16} />
            Abrir Proyecto
          </button>
          <button
            onClick={handleOpen}
            className="flex items-center gap-2.5 px-5 py-3 bg-[#1C2030] border border-white/10 text-white/50 font-mono text-sm rounded-lg hover:text-white/80 transition-all"
          >
            <Upload size={16} />
            Importar .pneum
          </button>
        </div>

        <div className="w-full grid grid-cols-2 gap-6">
          {/* Templates */}
          <div className="bg-[#141720] border border-white/[0.06] rounded-xl p-5">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Inicio rápido</div>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplate(tpl)}
                  className="flex flex-col items-start gap-1 p-3 bg-[#1C2030] rounded-lg hover:bg-[#1C2030]/70 border border-transparent hover:border-[#00D4FF22] transition-all text-left"
                >
                  <span className="text-xs font-mono text-white/80">{tpl.name}</span>
                  <span className="text-[10px] font-mono text-white/30">{tpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent projects */}
          <div className="bg-[#141720] border border-white/[0.06] rounded-xl p-5">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={11} /> Proyectos recientes
            </div>
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2 text-white/20 text-xs font-mono">
                <FolderOpen size={24} />
                <span>No hay proyectos recientes</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentProjects.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleLoadRecent(p.id)}
                    className="flex items-center justify-between p-3 bg-[#1C2030] rounded-lg hover:bg-[#1C2030]/70 border border-transparent hover:border-[#00D4FF22] transition-all"
                  >
                    <span className="text-xs font-mono text-white/70">{p.name}</span>
                    <span className="text-[9px] font-mono text-white/25">
                      {new Date(p.updatedAt).toLocaleDateString('es-ES')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] font-mono text-white/15">
          PneumaticLab v1.0 · React + Vite + TypeScript · Darcy-Weisbach · ISO 1219
        </div>
      </div>
    </div>
  );
}
