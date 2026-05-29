import type {
  PipeSegment,
  SystemConfig,
  CalculationResult,
  SegmentResult,
  FluidProperties,
  AccessoryResult,
  PressurePoint,
  Diagnostic,
} from '../types';

const R_AIR = 287.05; // J/(kg·K)
const R_N2 = 296.8;
const R_CO2 = 188.9;
const T_REF = 273.15; // 0°C in K

const ROUGHNESS_MM: Record<string, number> = {
  galvanized_steel: 0.15,
  copper: 0.0015,
  aluminum: 0.015,
  pvc: 0.0015,
  ptfe: 0.0015,
  polyurethane: 0.007,
};

function getGasConstant(fluid: string): number {
  if (fluid === 'nitrogen') return R_N2;
  if (fluid === 'co2') return R_CO2;
  return R_AIR;
}

function sutherlandViscosity(T_K: number, fluid: string): number {
  // Sutherland formula μ = μ0 * (T0 + C)/(T + C) * (T/T0)^1.5
  if (fluid === 'nitrogen') {
    const mu0 = 1.663e-5, T0 = 273.15, C = 107;
    return mu0 * ((T0 + C) / (T_K + C)) * Math.pow(T_K / T0, 1.5);
  }
  if (fluid === 'co2') {
    const mu0 = 1.37e-5, T0 = 273.15, C = 240;
    return mu0 * ((T0 + C) / (T_K + C)) * Math.pow(T_K / T0, 1.5);
  }
  // Air
  const mu0 = 1.716e-5, T0 = 273.15, C = 110.4;
  return mu0 * ((T0 + C) / (T_K + C)) * Math.pow(T_K / T0, 1.5);
}

export function computeFluidProperties(config: SystemConfig): FluidProperties {
  const T_K = config.temperature + T_REF;
  const P_abs = (config.workPressure + 1.01325) * 1e5; // Pa absolute
  const R = getGasConstant(config.fluidType);
  const density = P_abs / (R * T_K);
  const dynamicViscosity = sutherlandViscosity(T_K, config.fluidType);
  const specificHeatRatio = config.fluidType === 'co2' ? 1.289 : 1.4;
  return { density, dynamicViscosity, specificHeatRatio };
}

function colebrookWhite(Re: number, eps: number, d: number): { lambda: number; iterations: number } {
  if (Re < 1) return { lambda: 64, iterations: 0 };
  if (Re < 2300) return { lambda: 64 / Re, iterations: 0 };

  const relRoughness = eps / d;
  let lambda = 0.02; // initial guess
  let iterations = 0;

  for (let i = 0; i < 100; i++) {
    const sqrtL = Math.sqrt(lambda);
    const rhs = -2 * Math.log10(relRoughness / 3.7 + 2.51 / (Re * sqrtL));
    const newLambda = 1 / (rhs * rhs);
    iterations++;
    if (Math.abs(newLambda - lambda) < 1e-7) {
      lambda = newLambda;
      break;
    }
    lambda = newLambda;
  }
  return { lambda, iterations };
}

function accessoryEquivalentLength(seg: PipeSegment, d_m: number): AccessoryResult {
  // L/d coefficients (Crane TP-410)
  const K_ELBOW90 = 30;
  const K_ELBOW45 = 16;
  const K_TEE = 60;
  const K_GLOBE = 340;

  const totalLd =
    seg.elbows90 * K_ELBOW90 +
    seg.elbows45 * K_ELBOW45 +
    seg.tees * K_TEE +
    seg.globeValves * K_GLOBE;

  const equivalentLength = totalLd * d_m;

  return {
    elbows90Count: seg.elbows90,
    elbows45Count: seg.elbows45,
    teesCount: seg.tees,
    globeValvesCount: seg.globeValves,
    equivalentLength,
  };
}

function segmentLengthFromCanvas(seg: PipeSegment, scale: number): number {
  if (seg.lengthReal !== null) return seg.lengthReal;
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;
  const pixelLength = Math.sqrt(dx * dx + dy * dy);
  return pixelLength / scale; // scale = pixels per meter
}

function getVelocityLimit(type: string): { min: number; max: number } {
  if (type === 'main') return { min: 6, max: 10 };
  if (type === 'secondary') return { min: 4, max: 6 };
  return { min: 2, max: 4 };
}

export function calculateSegment(
  seg: PipeSegment,
  config: SystemConfig,
  fluid: FluidProperties,
  pixelsPerMeter: number,
  beta: number
): SegmentResult {
  const d_mm = seg.diameter;
  const d_m = d_mm / 1000;
  const A = Math.PI * (d_m / 2) ** 2;

  // Caudal efectivo
  const totalFlowLmin = seg.consumers.reduce((sum, c) => {
    const bf = c.simultaneityFactor ?? beta;
    return sum + c.flowRate * bf;
  }, 0);
  const Q_m3s = (totalFlowLmin / 1000) / 60; // L/min → m³/s

  // Velocidad
  const velocity = Q_m3s / A;
  const limits = getVelocityLimit(seg.type);
  const velocityWarning = velocity > limits.max;

  // Reynolds
  const reynolds = (fluid.density * velocity * d_m) / fluid.dynamicViscosity;
  const regime: SegmentResult['regime'] =
    reynolds < 2300 ? 'laminar' : reynolds < 4000 ? 'transitional' : 'turbulent';

  // Rugosidad
  const eps_mm = ROUGHNESS_MM[seg.material] ?? seg.roughness;
  const eps_m = eps_mm / 1000;

  // Factor de fricción
  const { lambda, iterations } = colebrookWhite(reynolds, eps_m, d_m);

  // Longitud real
  const L_real = segmentLengthFromCanvas(seg, pixelsPerMeter);

  // Longitud equivalente de accesorios
  const accessories = accessoryEquivalentLength(seg, d_m);
  const L_eq = L_real + accessories.equivalentLength;

  // Caída de presión Darcy-Weisbach
  const pressureDropPa = lambda * (L_eq / d_m) * (fluid.density * velocity ** 2 / 2);
  const pressureDropBar = pressureDropPa / 1e5;
  const pressureDropPercent = (pressureDropBar / config.workPressure) * 100;

  let status: SegmentResult['status'] = 'ok';
  if (pressureDropBar > 0.3) status = 'critical';
  else if (pressureDropBar > 0.1) status = 'warning';

  // Diámetro recomendado si falla (invertir Darcy para ΔP_max = 0.1 bar)
  let recommendedDiameter: number | undefined;
  if (status !== 'ok') {
    const DP_max = 0.1e5; // Pa
    // From ΔP = λ * L/d * ρv²/2 and Q = vA = v*π*d²/4
    // d_min iterative
    let d_try = d_m * 1.2;
    for (let iter = 0; iter < 50; iter++) {
      const A_try = Math.PI * (d_try / 2) ** 2;
      const v_try = Q_m3s / A_try;
      const Re_try = (fluid.density * v_try * d_try) / fluid.dynamicViscosity;
      const { lambda: l_try } = colebrookWhite(Re_try, eps_m, d_try);
      const dp_try = l_try * (L_eq / d_try) * (fluid.density * v_try ** 2 / 2);
      if (dp_try <= DP_max) {
        recommendedDiameter = Math.ceil(d_try * 1000 / 5) * 5;
        break;
      }
      d_try *= 1.05;
    }
    if (!recommendedDiameter) recommendedDiameter = Math.ceil(d_m * 1.5 * 1000 / 5) * 5;
  }

  return {
    segmentId: seg.id,
    segmentName: seg.name || seg.id,
    diameter: d_m,
    diameterMm: d_mm,
    lengthReal: L_real,
    lengthEquivalent: L_eq,
    flowRate: Q_m3s,
    flowRateLmin: totalFlowLmin,
    velocity,
    velocityWarning,
    reynolds,
    regime,
    frictionFactor: lambda,
    pressureDropPa,
    pressureDropBar,
    pressureDropPercent,
    status,
    iterationCount: iterations,
    fluidProps: fluid,
    accessories,
    recommendedDiameter,
  };
}

export function calculateSystem(
  pipes: PipeSegment[],
  config: SystemConfig,
  pixelsPerMeter: number
): CalculationResult {
  const fluid = computeFluidProperties(config);
  const segments: SegmentResult[] = pipes.map(seg =>
    calculateSegment(seg, config, fluid, pixelsPerMeter, config.simultaneityFactor)
  );

  // Build critical path (simple: sorted by cumulative pressure drop)
  const criticalPath = segments
    .sort((a, b) => b.pressureDropBar - a.pressureDropBar)
    .map(s => s.segmentId);

  // Pressure profile along critical path
  let cumDistance = 0;
  let cumPressureDrop = 0;
  const pressureProfile: PressurePoint[] = [
    { distance: 0, pressure: config.workPressure, segmentId: 'source' },
  ];

  for (const segId of criticalPath) {
    const sr = segments.find(s => s.segmentId === segId)!;
    cumDistance += sr.lengthReal;
    cumPressureDrop += sr.pressureDropBar;
    pressureProfile.push({
      distance: cumDistance,
      pressure: Math.max(0, config.workPressure - cumPressureDrop),
      segmentId: segId,
    });
  }

  const minAvailablePressure = config.workPressure - cumPressureDrop;
  const passed = minAvailablePressure >= config.minRequiredPressure;

  // Diagnostics
  const diagnostics: Diagnostic[] = [];

  segments.forEach(sr => {
    if (sr.status === 'critical') {
      diagnostics.push({
        type: 'error',
        message: `Segmento "${sr.segmentName}" (Ø${sr.diameterMm}mm): caída de presión crítica ${sr.pressureDropBar.toFixed(4)} bar (${sr.pressureDropPercent.toFixed(1)}%)`,
        segmentId: sr.segmentId,
        recommendation: sr.recommendedDiameter
          ? `Aumentar diámetro a Ø${sr.recommendedDiameter}mm`
          : 'Reducir longitud o aumentar diámetro',
      });
    } else if (sr.status === 'warning') {
      diagnostics.push({
        type: 'warning',
        message: `Segmento "${sr.segmentName}": caída de presión moderada ${sr.pressureDropBar.toFixed(4)} bar`,
        segmentId: sr.segmentId,
      });
    }
    if (sr.velocityWarning) {
      diagnostics.push({
        type: 'warning',
        message: `Segmento "${sr.segmentName}": velocidad ${sr.velocity.toFixed(2)} m/s supera el límite recomendado`,
        segmentId: sr.segmentId,
        recommendation: `Aumentar diámetro o reducir caudal`,
      });
    }
  });

  if (!passed) {
    diagnostics.push({
      type: 'error',
      message: `Presión disponible al final de la red: ${minAvailablePressure.toFixed(3)} bar — por debajo del mínimo requerido (${config.minRequiredPressure} bar)`,
    });
  } else {
    diagnostics.push({
      type: 'info',
      message: `Sistema verificado: presión mínima disponible ${minAvailablePressure.toFixed(3)} bar ≥ ${config.minRequiredPressure} bar requerido`,
    });
  }

  return {
    segments,
    criticalPath,
    pressureProfile,
    minAvailablePressure,
    minRequiredPressure: config.minRequiredPressure,
    passed,
    diagnostics,
    fluidProperties: fluid,
  };
}
