import React, { useEffect, useRef } from 'react';
import { useResultsStore } from '../../store/resultsStore';
import { useProjectStore } from '../../store/projectStore';
import type { SegmentResult, CalculationResult } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Download, Wrench } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function KTex({ formula, block = false }: { formula: string; block?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(formula, ref.current, { displayMode: block, throwOnError: false });
      } catch {
        if (ref.current) ref.current.textContent = formula;
      }
    }
  }, [formula, block]);
  return <span ref={ref} />;
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'critical' }) {
  if (status === 'ok') return <span className="flex items-center gap-1 text-[#00FF9D] text-[10px] font-mono"><CheckCircle2 size={11} />OK</span>;
  if (status === 'warning') return <span className="flex items-center gap-1 text-yellow-400 text-[10px] font-mono"><AlertTriangle size={11} />ALERTA</span>;
  return <span className="flex items-center gap-1 text-[#FF4444] text-[10px] font-mono"><XCircle size={11} />CRÍTICO</span>;
}

function RegimeBadge({ regime }: { regime: string }) {
  const colors = {
    laminar: 'text-[#00FF9D]',
    transitional: 'text-yellow-400',
    turbulent: 'text-[#FF6B35]',
  };
  return (
    <span className={`text-[10px] font-mono ${colors[regime as keyof typeof colors] ?? ''}`}>
      {regime.toUpperCase()}
    </span>
  );
}

function StepCard({
  title, expanded, onToggle, children,
}: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-white/[0.08] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#1C2030] hover:bg-[#1C2030]/80 text-left transition-colors"
      >
        {expanded ? <ChevronDown size={12} className="text-[#00D4FF]" /> : <ChevronRight size={12} className="text-white/40" />}
        <span className="text-xs font-mono text-white/80">{title}</span>
      </button>
      {expanded && (
        <div className="px-3 py-3 bg-[#141720]/50 flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

function FormulaRow({ label, formula, result }: { label: string; formula: string; result: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
      <div className="bg-[#0D0F14] rounded px-2 py-1.5 overflow-x-auto">
        <KTex formula={formula} />
      </div>
      <div className="text-right">
        <span className="text-[11px] font-mono text-[#00D4FF]">{result}</span>
      </div>
    </div>
  );
}

function SegmentResultCard({ sr, idx }: { sr: SegmentResult; idx: number }) {
  const expanded = useResultsStore(s => !!s.expandedSteps[`seg_${sr.segmentId}`]);
  const toggle = useResultsStore(s => s.toggleStep);
  const updatePipe = useProjectStore(s => s.updatePipe);

  const applyCorrection = () => {
    if (sr.recommendedDiameter) {
      updatePipe(sr.segmentId, { diameter: sr.recommendedDiameter });
    }
  };

  const borderColor = sr.status === 'ok' ? '#00FF9D22' :
    sr.status === 'warning' ? '#FFBB0022' : '#FF444422';

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor }}>
      <button
        onClick={() => toggle(`seg_${sr.segmentId}`)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#1C2030] hover:bg-[#1C2030]/80 text-left transition-colors"
      >
        <span className="text-[10px] font-mono text-white/30 w-4">{idx + 1}</span>
        {expanded ? <ChevronDown size={11} className="text-[#00D4FF]" /> : <ChevronRight size={11} className="text-white/40" />}
        <span className="text-xs font-mono text-white/80 flex-1 truncate">{sr.segmentName}</span>
        <span className="text-[10px] font-mono text-white/40">Ø{sr.diameterMm}mm</span>
        <span className="text-[10px] font-mono text-[#00D4FF]">{sr.pressureDropBar.toFixed(4)} bar</span>
        <StatusBadge status={sr.status} />
      </button>

      {expanded && (
        <div className="px-3 py-3 bg-[#141720]/50 flex flex-col gap-3">
          {/* Fluid properties */}
          <StepCard title="Paso 1 — Propiedades del fluido" expanded={true} onToggle={() => {}}>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div className="bg-[#0D0F14] rounded p-2">
                <div className="text-white/30">Densidad ρ</div>
                <div className="text-[#00D4FF]">{sr.fluidProps.density.toFixed(4)} kg/m³</div>
              </div>
              <div className="bg-[#0D0F14] rounded p-2">
                <div className="text-white/30">Viscosidad μ</div>
                <div className="text-[#00D4FF]">{sr.fluidProps.dynamicViscosity.toExponential(3)} Pa·s</div>
              </div>
              <div className="bg-[#0D0F14] rounded p-2">
                <div className="text-white/30">Caudal Q</div>
                <div className="text-[#00D4FF]">{sr.flowRateLmin.toFixed(1)} L/min</div>
              </div>
            </div>
            <FormulaRow
              label="Densidad del gas real"
              formula={`\\rho = \\frac{P_{abs}}{R \\cdot T} = ${sr.fluidProps.density.toFixed(4)} \\text{ kg/m}^3`}
              result=""
            />
          </StepCard>

          {/* Velocity */}
          <StepCard title="Paso 3 — Velocidad real" expanded={true} onToggle={() => {}}>
            <FormulaRow
              label="Velocidad de flujo"
              formula={`v = \\frac{Q}{A} = \\frac{${(sr.flowRate * 1e6).toFixed(2)} \\times 10^{-6}}{\\pi(${(sr.diameterMm / 2).toFixed(1)}/1000)^2} = ${sr.velocity.toFixed(3)} \\text{ m/s}`}
              result={`${sr.velocity.toFixed(3)} m/s ${sr.velocityWarning ? '⚠️' : '✓'}`}
            />
          </StepCard>

          {/* Reynolds */}
          <StepCard title="Paso 4 — Número de Reynolds" expanded={true} onToggle={() => {}}>
            <FormulaRow
              label="Reynolds"
              formula={`Re = \\frac{\\rho v d}{\\mu} = \\frac{${sr.fluidProps.density.toFixed(3)} \\times ${sr.velocity.toFixed(3)} \\times ${sr.diameterMm / 1000}}{${sr.fluidProps.dynamicViscosity.toExponential(2)}} = ${sr.reynolds.toFixed(0)}`}
              result=""
            />
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-white/30">Régimen:</span>
              <RegimeBadge regime={sr.regime} />
              <span className="text-white/20">
                {sr.regime === 'laminar' ? '(Re < 2300)' :
                 sr.regime === 'transitional' ? '(2300 < Re < 4000)' :
                 '(Re > 4000)'}
              </span>
            </div>
          </StepCard>

          {/* Friction factor */}
          <StepCard title="Paso 5 — Factor de fricción λ (Colebrook-White)" expanded={true} onToggle={() => {}}>
            {sr.regime === 'laminar' ? (
              <FormulaRow
                label="Laminar"
                formula={`\\lambda = \\frac{64}{Re} = \\frac{64}{${sr.reynolds.toFixed(0)}} = ${sr.frictionFactor.toFixed(5)}`}
                result=""
              />
            ) : (
              <>
                <FormulaRow
                  label="Colebrook-White (iterativo)"
                  formula={`\\frac{1}{\\sqrt{\\lambda}} = -2\\log_{10}\\left(\\frac{\\varepsilon}{3.7d} + \\frac{2.51}{Re\\sqrt{\\lambda}}\\right)`}
                  result=""
                />
                <div className="text-[10px] font-mono text-white/40">
                  Iteraciones: {sr.iterationCount} → λ = <span className="text-[#00D4FF]">{sr.frictionFactor.toFixed(6)}</span>
                </div>
              </>
            )}
          </StepCard>

          {/* Equivalent length */}
          <StepCard title="Paso 6 — Longitud equivalente de accesorios" expanded={true} onToggle={() => {}}>
            <div className="text-[10px] font-mono text-white/50 space-y-0.5">
              {sr.accessories.elbows90Count > 0 && <div>Codos 90° ×{sr.accessories.elbows90Count}: {(sr.accessories.elbows90Count * 30 * sr.diameter).toFixed(2)} m</div>}
              {sr.accessories.elbows45Count > 0 && <div>Codos 45° ×{sr.accessories.elbows45Count}: {(sr.accessories.elbows45Count * 16 * sr.diameter).toFixed(2)} m</div>}
              {sr.accessories.teesCount > 0 && <div>Tees ×{sr.accessories.teesCount}: {(sr.accessories.teesCount * 60 * sr.diameter).toFixed(2)} m</div>}
              {sr.accessories.globeValvesCount > 0 && <div>Válv. globo ×{sr.accessories.globeValvesCount}: {(sr.accessories.globeValvesCount * 340 * sr.diameter).toFixed(2)} m</div>}
            </div>
            <FormulaRow
              label="Longitud total equivalente"
              formula={`L_{eq} = ${sr.lengthReal.toFixed(2)} + ${sr.accessories.equivalentLength.toFixed(2)} = ${sr.lengthEquivalent.toFixed(2)} \\text{ m}`}
              result=""
            />
          </StepCard>

          {/* Pressure drop */}
          <StepCard title="Paso 7 — Caída de presión (Darcy-Weisbach)" expanded={true} onToggle={() => {}}>
            <FormulaRow
              label=""
              formula={`\\Delta P = \\lambda \\cdot \\frac{L_{eq}}{d} \\cdot \\frac{\\rho v^2}{2}`}
              result=""
            />
            <FormulaRow
              label="Sustitución"
              formula={`\\Delta P = ${sr.frictionFactor.toFixed(5)} \\times \\frac{${sr.lengthEquivalent.toFixed(2)}}{${sr.diameterMm / 1000}} \\times \\frac{${sr.fluidProps.density.toFixed(3)} \\times ${sr.velocity.toFixed(3)}^2}{2}`}
              result=""
            />
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-1">
              <div className="bg-[#0D0F14] rounded p-2">
                <div className="text-white/30">ΔP</div>
                <div className="text-[#00D4FF]">{sr.pressureDropPa.toFixed(1)} Pa</div>
              </div>
              <div className="bg-[#0D0F14] rounded p-2">
                <div className="text-white/30">ΔP</div>
                <div className="text-[#00D4FF]">{sr.pressureDropBar.toFixed(5)} bar</div>
              </div>
              <div className="bg-[#0D0F14] rounded p-2">
                <div className="text-white/30">ΔP%</div>
                <div className={sr.pressureDropPercent > 5 ? 'text-[#FF4444]' : 'text-[#00D4FF]'}>
                  {sr.pressureDropPercent.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <StatusBadge status={sr.status} />
              {sr.status !== 'ok' && sr.recommendedDiameter && (
                <button
                  onClick={applyCorrection}
                  className="flex items-center gap-1 text-[10px] font-mono text-[#00FF9D] hover:text-white transition-colors bg-[#00FF9D15] px-2 py-1 rounded"
                >
                  <Wrench size={10} />
                  Aplicar Ø{sr.recommendedDiameter}mm
                </button>
              )}
            </div>
          </StepCard>
        </div>
      )}
    </div>
  );
}

function PressureChart({ result }: { result: CalculationResult }) {
  const labels = result.pressureProfile.map((_, i) => i === 0 ? 'Compresor' : `${result.pressureProfile[i].distance.toFixed(1)}m`);
  const data = result.pressureProfile.map(p => p.pressure);
  const minReq = result.minRequiredPressure;

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Presión disponible (bar)',
            data,
            borderColor: '#00D4FF',
            backgroundColor: 'rgba(0,212,255,0.08)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: data.map(p => p < minReq ? '#FF4444' : '#00D4FF'),
            pointRadius: 4,
          },
          {
            label: `P. mínima req. (${minReq} bar)`,
            data: Array(data.length).fill(minReq),
            borderColor: '#FF444488',
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#ffffff60', font: { family: 'JetBrains Mono', size: 10 } },
          },
        },
        scales: {
          x: {
            ticks: { color: '#ffffff40', font: { family: 'JetBrains Mono', size: 9 } },
            grid: { color: '#ffffff08' },
          },
          y: {
            ticks: { color: '#ffffff40', font: { family: 'JetBrains Mono', size: 9 } },
            grid: { color: '#ffffff08' },
          },
        },
      }}
    />
  );
}

function exportCSV(result: CalculationResult, projectName: string) {
  const headers = ['Segmento', 'Ø(mm)', 'L_real(m)', 'L_eq(m)', 'Q(L/min)', 'v(m/s)', 'Re', 'λ', 'ΔP(Pa)', 'ΔP(bar)', 'Estado'];
  const rows = result.segments.map(s => [
    s.segmentName, s.diameterMm, s.lengthReal.toFixed(2), s.lengthEquivalent.toFixed(2),
    s.flowRateLmin.toFixed(1), s.velocity.toFixed(3), s.reynolds.toFixed(0),
    s.frictionFactor.toFixed(6), s.pressureDropPa.toFixed(1), s.pressureDropBar.toFixed(5),
    s.status,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}_resultados.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPanel({ onClose }: { onClose?: () => void }) {
  const result = useResultsStore(s => s.result);
  const projectName = useProjectStore(s => s.project.name);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20 text-xs font-mono px-4 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Presiona "Calcular Sistema" para ver los resultados del análisis</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle2 size={14} className="text-[#00FF9D]" />
          ) : (
            <XCircle size={14} className="text-[#FF4444]" />
          )}
          <span className="text-xs font-mono text-white/70">
            {result.passed ? 'Sistema verificado' : 'Sistema con errores'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(result, projectName)}
            title="Exportar CSV"
            className="flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors"
          >
            <Download size={11} /> CSV
          </button>
          {onClose && (
            <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs font-mono">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-white/[0.06]">
          <div className="bg-[#1C2030] rounded p-2">
            <div className="text-[9px] font-mono text-white/30 uppercase">P. entrada</div>
            <div className="text-sm font-mono text-[#00D4FF]">{result.pressureProfile[0]?.pressure.toFixed(2)} bar</div>
          </div>
          <div className="bg-[#1C2030] rounded p-2">
            <div className="text-[9px] font-mono text-white/30 uppercase">P. mínima disp.</div>
            <div className={`text-sm font-mono ${result.passed ? 'text-[#00FF9D]' : 'text-[#FF4444]'}`}>
              {result.minAvailablePressure.toFixed(3)} bar
            </div>
          </div>
          <div className="bg-[#1C2030] rounded p-2">
            <div className="text-[9px] font-mono text-white/30 uppercase">Segmentos</div>
            <div className="text-sm font-mono text-white/80">{result.segments.length}</div>
          </div>
        </div>

        {/* Pressure chart */}
        {result.pressureProfile.length > 1 && (
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Perfil de Presiones</div>
            <div className="h-36">
              <PressureChart result={result} />
            </div>
          </div>
        )}

        {/* Diagnostics */}
        {result.diagnostics.length > 0 && (
          <div className="px-3 py-2 border-b border-white/[0.06] flex flex-col gap-1.5">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Diagnóstico</div>
            {result.diagnostics.map((d, i) => (
              <div
                key={i}
                className={`text-[10px] font-mono p-2 rounded flex flex-col gap-0.5 ${
                  d.type === 'error' ? 'bg-red-950/40 text-red-400' :
                  d.type === 'warning' ? 'bg-yellow-950/40 text-yellow-400' :
                  'bg-[#00D4FF10] text-[#00D4FF]/70'
                }`}
              >
                <span>{d.message}</span>
                {d.recommendation && (
                  <span className="text-white/50">→ {d.recommendation}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Segment results */}
        <div className="p-3 flex flex-col gap-2">
          <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Análisis por Segmento</div>

          {/* Summary table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] font-mono border-collapse">
              <thead>
                <tr className="text-white/30">
                  {['Segmento', 'Ø(mm)', 'L(m)', 'Re', 'λ', 'ΔP(bar)', 'Estado'].map(h => (
                    <th key={h} className="px-1.5 py-1 border border-white/[0.06] text-left font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.segments.map(sr => (
                  <tr key={sr.segmentId} className="hover:bg-white/[0.02]">
                    <td className="px-1.5 py-1 border border-white/[0.06] text-white/70 truncate max-w-[80px]">{sr.segmentName}</td>
                    <td className="px-1.5 py-1 border border-white/[0.06] text-[#00D4FF]">{sr.diameterMm}</td>
                    <td className="px-1.5 py-1 border border-white/[0.06] text-white/50">{sr.lengthReal.toFixed(1)}</td>
                    <td className="px-1.5 py-1 border border-white/[0.06] text-white/50">{sr.reynolds.toFixed(0)}</td>
                    <td className="px-1.5 py-1 border border-white/[0.06] text-white/50">{sr.frictionFactor.toFixed(4)}</td>
                    <td className="px-1.5 py-1 border border-white/[0.06] text-[#00D4FF]">{sr.pressureDropBar.toFixed(5)}</td>
                    <td className="px-1.5 py-1 border border-white/[0.06]"><StatusBadge status={sr.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed cards */}
          {result.segments.map((sr, i) => (
            <SegmentResultCard key={sr.segmentId} sr={sr} idx={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
