export interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number; // cm
  label: string;
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface FloorPlan {
  walls: Wall[];
  rooms: Room[];
  visible: boolean;
}

export interface FlowParticle {
  id: string;
  segmentId: string;
  t: number;       // 0..1 along pipe path
  speed: number;   // units per second
}

export type SimStatus = 'idle' | 'running' | 'paused' | 'failed';

export interface SimFailure {
  elementId: string;
  type: 'pressure_drop' | 'velocity_excess' | 'min_pressure' | 'no_flow';
  message: string;
  detail: string;
  severity: 'warning' | 'critical';
}

export interface SimulationState {
  status: SimStatus;
  speed: 0.5 | 1 | 2;
  particles: FlowParticle[];
  pressureAtEnd: number;
  failures: SimFailure[];
  activeSegmentIds: Set<string>;
  time: number;
}

export type CircuitType = 'lab' | 'residential' | 'industrial';

export interface CircuitPreset {
  type: CircuitType;
  label: string;
  description: string;
  emoji: string;
  workPressure: number;      // bar
  minPressure: number;       // bar
  simultaneityFactor: number;
  gridScale: number;         // m per grid cell
  defaultDiameter: number;   // mm
  maxPipes: number;
}
