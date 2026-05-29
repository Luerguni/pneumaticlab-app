import { create } from 'zustand';
import type { Project, PipeSegment, SymbolInstance, SystemConfig } from '../types';

interface ProjectStore {
  project: Project;
  isDirty: boolean;
  recentProjects: { id: string; name: string; updatedAt: string; thumbnail?: string }[];

  setProjectName: (name: string) => void;
  addPipe: (pipe: PipeSegment) => void;
  updatePipe: (id: string, updates: Partial<PipeSegment>) => void;
  removePipe: (id: string) => void;
  addSymbol: (symbol: SymbolInstance) => void;
  updateSymbol: (id: string, updates: Partial<SymbolInstance>) => void;
  removeSymbol: (id: string) => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  saveProject: () => void;
  loadProject: (project: Project) => void;
  newProject: () => void;
  loadFromLocalStorage: () => void;
}

const DEFAULT_CONFIG: SystemConfig = {
  workPressure: 6,
  temperature: 20,
  targetVelocity: 8,
  simultaneityFactor: 0.7,
  fluidType: 'air',
  humidity: 60,
  minRequiredPressure: 5,
};

function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Nuevo Proyecto',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pipes: [],
    symbols: [],
    canvasScale: 50,
    gridSize: 25,
    viewport: { x: 0, y: 0, zoom: 1 },
    systemConfig: { ...DEFAULT_CONFIG },
  };
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  isDirty: false,
  recentProjects: [],

  setProjectName: (name) =>
    set(s => ({ project: { ...s.project, name }, isDirty: true })),

  addPipe: (pipe) =>
    set(s => ({
      project: { ...s.project, pipes: [...s.project.pipes, pipe] },
      isDirty: true,
    })),

  updatePipe: (id, updates) =>
    set(s => ({
      project: {
        ...s.project,
        pipes: s.project.pipes.map(p => (p.id === id ? { ...p, ...updates } : p)),
      },
      isDirty: true,
    })),

  removePipe: (id) =>
    set(s => ({
      project: { ...s.project, pipes: s.project.pipes.filter(p => p.id !== id) },
      isDirty: true,
    })),

  addSymbol: (symbol) =>
    set(s => ({
      project: { ...s.project, symbols: [...s.project.symbols, symbol] },
      isDirty: true,
    })),

  updateSymbol: (id, updates) =>
    set(s => ({
      project: {
        ...s.project,
        symbols: s.project.symbols.map(sym => (sym.id === id ? { ...sym, ...updates } : sym)),
      },
      isDirty: true,
    })),

  removeSymbol: (id) =>
    set(s => ({
      project: { ...s.project, symbols: s.project.symbols.filter(sym => sym.id !== id) },
      isDirty: true,
    })),

  updateSystemConfig: (config) =>
    set(s => ({
      project: {
        ...s.project,
        systemConfig: { ...s.project.systemConfig, ...config },
      },
      isDirty: true,
    })),

  setViewport: (viewport) =>
    set(s => ({ project: { ...s.project, viewport } })),

  saveProject: () => {
    const { project } = get();
    const updated = { ...project, updatedAt: new Date().toISOString() };
    localStorage.setItem(`pneumaticlab_project_${updated.id}`, JSON.stringify(updated));

    const recents = JSON.parse(localStorage.getItem('pneumaticlab_recents') || '[]');
    const idx = recents.findIndex((r: { id: string }) => r.id === updated.id);
    const entry = { id: updated.id, name: updated.name, updatedAt: updated.updatedAt };
    if (idx >= 0) recents[idx] = entry;
    else recents.unshift(entry);
    localStorage.setItem('pneumaticlab_recents', JSON.stringify(recents.slice(0, 10)));

    set({ project: updated, isDirty: false });
  },

  loadProject: (project) => set({ project, isDirty: false }),

  newProject: () => set({ project: createDefaultProject(), isDirty: false }),

  loadFromLocalStorage: () => {
    const recents = JSON.parse(localStorage.getItem('pneumaticlab_recents') || '[]');
    set({ recentProjects: recents });
  },
}));

// Auto-save every 30 seconds
setInterval(() => {
  const store = useProjectStore.getState();
  if (store.isDirty) store.saveProject();
}, 30000);
