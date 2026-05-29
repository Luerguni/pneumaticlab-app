import { create } from 'zustand';
import type { CanvasState, ToolMode, SymbolType, PipeType, Point } from '../types';

interface CanvasStore extends CanvasState {
  setViewport: (vp: Partial<{ x: number; y: number; zoom: number }>) => void;
  setTool: (tool: ToolMode) => void;
  setActiveSymbol: (type: SymbolType | null) => void;
  setActivePipeType: (type: PipeType) => void;
  setSelected: (ids: string[]) => void;
  addSelected: (id: string) => void;
  clearSelected: () => void;
  startDrawingPipe: (start: Point) => void;
  stopDrawingPipe: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleIsometric: () => void;
  setGridSize: (size: number) => void;
  setScale: (scale: number) => void;
  zoom: (factor: number, pivot?: Point) => void;
  pan: (dx: number, dy: number) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  gridVisible: true,
  gridSize: 25,
  snapToGrid: true,
  gridIsometric: false,
  scale: 0.5, // m per grid cell (25px = 0.5m)
  selectedIds: [],
  tool: 'select',
  activeSymbolType: null,
  activePipeType: 'main',
  drawingPipe: null,

  setViewport: (vp) =>
    set(s => ({ viewport: { ...s.viewport, ...vp } })),

  setTool: (tool) => set({ tool }),

  setActiveSymbol: (type) => set({ activeSymbolType: type }),

  setActivePipeType: (type) => set({ activePipeType: type }),

  setSelected: (ids) => set({ selectedIds: ids }),

  addSelected: (id) => set(s => ({ selectedIds: [...s.selectedIds, id] })),

  clearSelected: () => set({ selectedIds: [] }),

  startDrawingPipe: (start) => set({ drawingPipe: { start } }),

  stopDrawingPipe: () => set({ drawingPipe: null }),

  toggleGrid: () => set(s => ({ gridVisible: !s.gridVisible })),

  toggleSnap: () => set(s => ({ snapToGrid: !s.snapToGrid })),

  toggleIsometric: () => set(s => ({ gridIsometric: !s.gridIsometric })),

  setGridSize: (size) => set({ gridSize: size }),

  setScale: (scale) => set({ scale }),

  zoom: (factor, pivot) => {
    const { viewport } = get();
    const newZoom = Math.min(4, Math.max(0.3, viewport.zoom * factor));
    if (pivot) {
      const dx = pivot.x - (pivot.x - viewport.x) * (newZoom / viewport.zoom);
      const dy = pivot.y - (pivot.y - viewport.y) * (newZoom / viewport.zoom);
      set({ viewport: { x: dx, y: dy, zoom: newZoom } });
    } else {
      set({ viewport: { ...viewport, zoom: newZoom } });
    }
  },

  pan: (dx, dy) =>
    set(s => ({
      viewport: {
        ...s.viewport,
        x: s.viewport.x + dx,
        y: s.viewport.y + dy,
      },
    })),
}));
