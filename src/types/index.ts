export type PipeType = 'main' | 'secondary' | 'service' | 'return' | 'custom';
export type SymbolType =
  | 'compressor'
  | 'frl'
  | 'filter'
  | 'regulator'
  | 'lubricator'
  | 'valve_2_2'
  | 'valve_3_2'
  | 'valve_4_2'
  | 'valve_4_3'
  | 'valve_5_2'
  | 'valve_5_3'
  | 'cylinder_single'
  | 'cylinder_double'
  | 'cylinder_telescopic'
  | 'motor_pneumatic'
  | 'silencer'
  | 'reservoir'
  | 'pressure_gauge'
  | 'pressure_switch'
  | 'flow_arrow'
  | 'tee'
  | 'elbow'
  | 'cross'
  | 'position_sensor'
  | 'flow_control'
  | 'check_valve';

export type Material =
  | 'galvanized_steel'
  | 'copper'
  | 'aluminum'
  | 'pvc'
  | 'ptfe'
  | 'polyurethane';

export type FluidType = 'air' | 'nitrogen' | 'co2';

export interface Point {
  x: number;
  y: number;
}

export interface PipeSegment {
  id: string;
  type: PipeType;
  start: Point;
  end: Point;
  name: string;
  diameter: number; // mm
  lengthReal: number | null; // m, null = auto from canvas
  material: Material;
  roughness: number; // mm
  elbows90: number;
  elbows45: number;
  tees: number;
  globeValves: number;
  consumers: Consumer[];
  notes: string;
  color?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface Consumer {
  id: string;
  name: string;
  flowRate: number; // L/min
  minPressure: number; // bar
  simultaneityFactor?: number;
}

export interface SymbolInstance {
  id: string;
  type: SymbolType;
  position: Point;
  rotation: 0 | 90 | 180 | 270;
  label: string;
  code: string;
  ports: PortConnection[];
  properties: Record<string, unknown>;
}

export interface PortConnection {
  portId: string;
  offset: Point; // relative to symbol center
  connectedPipeId?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pipes: PipeSegment[];
  symbols: SymbolInstance[];
  canvasScale: number; // pixels per meter
  gridSize: number; // pixels
  viewport: { x: number; y: number; zoom: number };
  systemConfig: SystemConfig;
}

export interface SystemConfig {
  workPressure: number; // bar
  temperature: number; // °C
  targetVelocity: number; // m/s
  simultaneityFactor: number; // β
  fluidType: FluidType;
  humidity: number; // %
  minRequiredPressure: number; // bar
}

export interface FluidProperties {
  density: number; // kg/m³
  dynamicViscosity: number; // Pa·s
  specificHeatRatio: number;
}

export interface SegmentResult {
  segmentId: string;
  segmentName: string;
  diameter: number; // m
  diameterMm: number; // mm
  lengthReal: number; // m
  lengthEquivalent: number; // m
  flowRate: number; // m³/s
  flowRateLmin: number; // L/min
  velocity: number; // m/s
  velocityWarning: boolean;
  reynolds: number;
  regime: 'laminar' | 'transitional' | 'turbulent';
  frictionFactor: number;
  pressureDropPa: number;
  pressureDropBar: number;
  pressureDropPercent: number;
  status: 'ok' | 'warning' | 'critical';
  iterationCount?: number;
  fluidProps: FluidProperties;
  accessories: AccessoryResult;
  recommendedDiameter?: number; // mm, if status != ok
}

export interface AccessoryResult {
  elbows90Count: number;
  elbows45Count: number;
  teesCount: number;
  globeValvesCount: number;
  equivalentLength: number; // m
}

export interface CalculationResult {
  segments: SegmentResult[];
  criticalPath: string[]; // segment IDs
  pressureProfile: PressurePoint[];
  minAvailablePressure: number; // bar
  minRequiredPressure: number; // bar
  passed: boolean;
  diagnostics: Diagnostic[];
  fluidProperties: FluidProperties;
}

export interface PressurePoint {
  distance: number; // m from compressor
  pressure: number; // bar
  segmentId: string;
}

export interface Diagnostic {
  type: 'error' | 'warning' | 'info';
  message: string;
  segmentId?: string;
  recommendation?: string;
}

export type ToolMode =
  | 'select'
  | 'pipe_main'
  | 'pipe_secondary'
  | 'pipe_service'
  | 'pipe_return'
  | 'pipe_custom'
  | 'symbol'
  | 'measure'
  | 'annotate'
  | 'delete';

export interface CanvasState {
  viewport: { x: number; y: number; zoom: number };
  gridVisible: boolean;
  gridSize: number;
  snapToGrid: boolean;
  gridIsometric: boolean;
  scale: number; // m per grid cell
  selectedIds: string[];
  tool: ToolMode;
  activeSymbolType: SymbolType | null;
  activePipeType: PipeType;
  drawingPipe: { start: Point } | null;
}
