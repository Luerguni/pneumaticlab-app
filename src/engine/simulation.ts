import type { PipeSegment, SymbolInstance } from '../types';
import type { SimFailure, FlowParticle } from '../types/floorplan';
import { calculateSystem } from './calculator';
import type { SystemConfig } from '../types';

export interface SimSetupResult {
  particles: FlowParticle[];
  failures: SimFailure[];
  pressureAtEnd: number;
  segmentVelocities: Record<string, number>; // m/s per segment
  segmentFlows: Record<string, number>;       // L/min per segment
}

/** Build initial particle set and run failure analysis */
export function setupSimulation(
  pipes: PipeSegment[],
  symbols: SymbolInstance[],
  config: SystemConfig,
  pixelsPerMeter: number
): SimSetupResult {
  if (pipes.length === 0) {
    return { particles: [], failures: [], pressureAtEnd: config.workPressure, segmentVelocities: {}, segmentFlows: {} };
  }

  const result = calculateSystem(pipes, config, pixelsPerMeter);
  const failures: SimFailure[] = [];
  const segmentVelocities: Record<string, number> = {};
  const segmentFlows: Record<string, number> = {};

  result.segments.forEach(sr => {
    segmentVelocities[sr.segmentId] = sr.velocity;
    segmentFlows[sr.segmentId] = sr.flowRateLmin;

    if (sr.status === 'critical') {
      failures.push({
        elementId: sr.segmentId,
        type: 'pressure_drop',
        message: `Caída de presión crítica en "${sr.segmentName}"`,
        detail: `ΔP = ${sr.pressureDropBar.toFixed(4)} bar (${sr.pressureDropPercent.toFixed(1)}%) — límite: 0.3 bar. Diámetro actual: Ø${sr.diameterMm}mm${sr.recommendedDiameter ? `. Recomendado: Ø${sr.recommendedDiameter}mm` : ''}`,
        severity: 'critical',
      });
    } else if (sr.status === 'warning') {
      failures.push({
        elementId: sr.segmentId,
        type: 'pressure_drop',
        message: `Caída de presión moderada en "${sr.segmentName}"`,
        detail: `ΔP = ${sr.pressureDropBar.toFixed(4)} bar (${sr.pressureDropPercent.toFixed(1)}%)`,
        severity: 'warning',
      });
    }

    if (sr.velocityWarning) {
      failures.push({
        elementId: sr.segmentId,
        type: 'velocity_excess',
        message: `Velocidad excesiva en "${sr.segmentName}"`,
        detail: `v = ${sr.velocity.toFixed(2)} m/s — supera el límite recomendado para tuberías de tipo "${sr.segmentId}"`,
        severity: 'warning',
      });
    }
  });

  if (!result.passed) {
    failures.push({
      elementId: 'system',
      type: 'min_pressure',
      message: 'Presión insuficiente al final de la red',
      detail: `Presión disponible: ${result.minAvailablePressure.toFixed(3)} bar — mínima requerida: ${result.minRequiredPressure} bar. El sistema no puede operar correctamente.`,
      severity: 'critical',
    });
  }

  // Generate initial particles distributed across all pipes
  const particles: FlowParticle[] = [];
  result.segments.forEach(sr => {
    const pipe = pipes.find(p => p.id === sr.segmentId);
    if (!pipe) return;

    // Speed normalized: base 0.04 units/sec × flow ratio
    const maxFlow = Math.max(...result.segments.map(s => s.flowRateLmin), 1);
    const flowRatio = Math.max(0.05, sr.flowRateLmin / maxFlow);
    const speed = 0.03 + flowRatio * 0.07;

    // Number of particles proportional to pipe length
    const count = Math.max(2, Math.min(8, Math.ceil(sr.flowRateLmin / 50)));

    for (let i = 0; i < count; i++) {
      particles.push({
        id: `${sr.segmentId}_p${i}`,
        segmentId: sr.segmentId,
        t: i / count,
        speed,
      });
    }
  });

  return {
    particles,
    failures,
    pressureAtEnd: result.minAvailablePressure,
    segmentVelocities,
    segmentFlows,
  };
}

/** Advance all particles by dt seconds, wrapping at t=1 */
export function tickParticles(
  particles: FlowParticle[],
  dt: number,
  simSpeed: number
): FlowParticle[] {
  return particles.map(p => {
    let t = p.t + p.speed * dt * simSpeed;
    if (t > 1) t -= 1;
    return { ...p, t };
  });
}

/** Given t ∈ [0,1] and a pipe, compute canvas screen position */
export function particlePosition(
  pipe: PipeSegment,
  t: number
): { x: number; y: number } {
  const { start, end } = pipe;
  // L-shape: first horizontal then vertical
  const mid = { x: end.x, y: start.y };
  const seg1Len = Math.abs(mid.x - start.x);
  const seg2Len = Math.abs(end.y - mid.y);
  const totalLen = seg1Len + seg2Len;

  if (totalLen === 0) return { x: start.x, y: start.y };

  const dist = t * totalLen;
  if (dist <= seg1Len) {
    const ratio = seg1Len > 0 ? dist / seg1Len : 0;
    return {
      x: start.x + (mid.x - start.x) * ratio,
      y: start.y,
    };
  } else {
    const ratio = seg2Len > 0 ? (dist - seg1Len) / seg2Len : 0;
    return {
      x: mid.x,
      y: mid.y + (end.y - mid.y) * ratio,
    };
  }
}
