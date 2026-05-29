import { create } from 'zustand';
import type { SimulationState, SimStatus, SimFailure, FlowParticle } from '../types/floorplan';
import type { FloorPlan } from '../types/floorplan';

interface SimStore {
  sim: SimulationState;
  floorPlan: FloorPlan;

  // Sim controls
  startSim: () => void;
  pauseSim: () => void;
  stopSim: () => void;
  setSpeed: (s: 0.5 | 1 | 2) => void;
  setParticles: (p: FlowParticle[]) => void;
  setFailures: (f: SimFailure[]) => void;
  setStatus: (s: SimStatus) => void;
  tickTime: (dt: number) => void;
  setPressureAtEnd: (p: number) => void;

  // Floor plan
  addWall: (w: import('../types/floorplan').Wall) => void;
  updateWall: (id: string, updates: Partial<import('../types/floorplan').Wall>) => void;
  removeWall: (id: string) => void;
  addRoom: (r: import('../types/floorplan').Room) => void;
  updateRoom: (id: string, updates: Partial<import('../types/floorplan').Room>) => void;
  removeRoom: (id: string) => void;
  toggleFloorPlanVisible: () => void;
}

const defaultSim: SimulationState = {
  status: 'idle',
  speed: 1,
  particles: [],
  pressureAtEnd: 0,
  failures: [],
  activeSegmentIds: new Set(),
  time: 0,
};

export const useSimStore = create<SimStore>((set) => ({
  sim: defaultSim,
  floorPlan: { walls: [], rooms: [], visible: true },

  startSim: () => set(s => ({ sim: { ...s.sim, status: 'running' } })),
  pauseSim: () => set(s => ({ sim: { ...s.sim, status: 'paused' } })),
  stopSim: () => set({ sim: { ...defaultSim } }),
  setSpeed: (speed) => set(s => ({ sim: { ...s.sim, speed } })),
  setParticles: (particles) => set(s => ({ sim: { ...s.sim, particles } })),
  setFailures: (failures) => set(s => ({
    sim: { ...s.sim, failures, status: failures.some(f => f.severity === 'critical') ? 'failed' : 'running' }
  })),
  setStatus: (status) => set(s => ({ sim: { ...s.sim, status } })),
  tickTime: (dt) => set(s => ({ sim: { ...s.sim, time: s.sim.time + dt } })),
  setPressureAtEnd: (p) => set(s => ({ sim: { ...s.sim, pressureAtEnd: p } })),

  addWall: (w) => set(s => ({ floorPlan: { ...s.floorPlan, walls: [...s.floorPlan.walls, w] } })),
  updateWall: (id, updates) => set(s => ({
    floorPlan: { ...s.floorPlan, walls: s.floorPlan.walls.map(w => w.id === id ? { ...w, ...updates } : w) }
  })),
  removeWall: (id) => set(s => ({ floorPlan: { ...s.floorPlan, walls: s.floorPlan.walls.filter(w => w.id !== id) } })),
  addRoom: (r) => set(s => ({ floorPlan: { ...s.floorPlan, rooms: [...s.floorPlan.rooms, r] } })),
  updateRoom: (id, updates) => set(s => ({
    floorPlan: { ...s.floorPlan, rooms: s.floorPlan.rooms.map(r => r.id === id ? { ...r, ...updates } : r) }
  })),
  removeRoom: (id) => set(s => ({ floorPlan: { ...s.floorPlan, rooms: s.floorPlan.rooms.filter(r => r.id !== id) } })),
  toggleFloorPlanVisible: () => set(s => ({
    floorPlan: { ...s.floorPlan, visible: !s.floorPlan.visible }
  })),
}));
