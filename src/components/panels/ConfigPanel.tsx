import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';

function Section({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{title}</span>
        {open ? <ChevronDown size={12} className="text-white/30" /> : <ChevronRight size={12} className="text-white/30" />}
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

function Field({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-white/40 mb-1 uppercase tracking-wider">
        {label}{unit ? ` (${unit})` : ''}
      </label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, min, max, step = 0.1 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1.5 rounded outline-none focus:border-[#00D4FF44]"
    />
  );
}

export default function ConfigPanel() {
  const config = useProjectStore(s => s.project.systemConfig);
  const update = useProjectStore(s => s.updateSystemConfig);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const barToPsi = (b: number) => (b * 14.5038).toFixed(1);
  const barToKpa = (b: number) => (b * 100).toFixed(0);
  const barToMpa = (b: number) => (b / 10).toFixed(3);

  const cToF = (c: number) => ((c * 9) / 5 + 32).toFixed(1);

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Settings size={14} className="text-[#00D4FF]" />
        <span className="text-xs font-mono text-white/70 uppercase tracking-widest">Configuración del Sistema</span>
      </div>

      <Section title="Parámetros Globales">
        <Field label="Presión de trabajo">
          <NumInput value={config.workPressure} onChange={v => update({ workPressure: v })} min={0.5} max={16} step={0.5} />
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] font-mono text-white/25">{barToPsi(config.workPressure)} PSI</span>
            <span className="text-[9px] font-mono text-white/25">{barToKpa(config.workPressure)} kPa</span>
            <span className="text-[9px] font-mono text-white/25">{barToMpa(config.workPressure)} MPa</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-[#1C2030] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF9D] rounded-full transition-all"
              style={{ width: `${Math.min((config.workPressure / 16) * 100, 100)}%` }}
            />
          </div>
        </Field>

        <Field label="Presión mínima requerida" unit="bar">
          <NumInput value={config.minRequiredPressure} onChange={v => update({ minRequiredPressure: v })} min={0.5} max={16} step={0.5} />
        </Field>

        <Field label={`Temperatura (${tempUnit})`}>
          <div className="flex gap-2">
            <NumInput
              value={tempUnit === 'C' ? config.temperature : parseFloat(cToF(config.temperature))}
              onChange={v => update({ temperature: tempUnit === 'C' ? v : (v - 32) * 5 / 9 })}
              min={-20}
              max={150}
              step={1}
            />
            <button
              onClick={() => setTempUnit(u => u === 'C' ? 'F' : 'C')}
              className="bg-[#1C2030] border border-white/10 text-white/60 text-xs font-mono px-2 rounded hover:text-white transition-colors"
            >
              °{tempUnit}
            </button>
          </div>
          <span className="text-[9px] font-mono text-white/25 mt-0.5">
            {tempUnit === 'C' ? cToF(config.temperature) + ' °F' : config.temperature.toFixed(1) + ' °C'}
          </span>
        </Field>

        <Field label="Tipo de fluido">
          <select
            value={config.fluidType}
            onChange={e => update({ fluidType: e.target.value as 'air' | 'nitrogen' | 'co2' })}
            className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1.5 rounded outline-none"
          >
            <option value="air">Aire comprimido</option>
            <option value="nitrogen">Nitrógeno (N₂)</option>
            <option value="co2">CO₂</option>
          </select>
          <div className="mt-1 text-[9px] font-mono text-white/25">
            {config.fluidType === 'air' && 'R = 287.05 J/(kg·K), k = 1.4'}
            {config.fluidType === 'nitrogen' && 'R = 296.8 J/(kg·K), k = 1.4'}
            {config.fluidType === 'co2' && 'R = 188.9 J/(kg·K), k = 1.289'}
          </div>
        </Field>

        <Field label="Humedad relativa" unit="%">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={config.humidity}
              onChange={e => update({ humidity: parseInt(e.target.value) })}
              className="flex-1 accent-[#00D4FF]"
            />
            <span className="text-xs font-mono text-[#00D4FF] w-8 text-right">{config.humidity}%</span>
          </div>
        </Field>
      </Section>

      <Section title="Velocidad de Flujo">
        <Field label="Velocidad objetivo" unit="m/s">
          <NumInput value={config.targetVelocity} onChange={v => update({ targetVelocity: v })} min={1} max={20} step={0.5} />
        </Field>
        <div className="bg-[#1C2030] rounded p-2 text-[9px] font-mono text-white/40 space-y-0.5">
          <div className="flex justify-between">
            <span>Principal:</span>
            <span className="text-[#00D4FF]/70">6–10 m/s</span>
          </div>
          <div className="flex justify-between">
            <span>Secundaria:</span>
            <span className="text-[#00D4FF]/70">4–6 m/s</span>
          </div>
          <div className="flex justify-between">
            <span>Servicio:</span>
            <span className="text-[#00D4FF]/70">2–4 m/s</span>
          </div>
        </div>
      </Section>

      <Section title="Factor de Simultaneidad β">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={config.simultaneityFactor}
            onChange={e => update({ simultaneityFactor: parseFloat(e.target.value) })}
            className="flex-1 accent-[#00D4FF]"
          />
          <span className="text-sm font-mono text-[#00D4FF] w-8 text-right">{config.simultaneityFactor.toFixed(2)}</span>
        </div>
        <div className="bg-[#1C2030] rounded p-2 text-[9px] font-mono text-white/40 mt-1">
          <p>β = probabilidad de que todos los consumidores estén activos simultáneamente.</p>
          <p className="mt-1">β = 1.0 → todos activos (peor caso)</p>
          <p>β = 0.5 → 50% de simultaneidad</p>
          <p className="mt-1 text-[#00D4FF]/50">
            {config.simultaneityFactor >= 0.9 ? '⚠️ Diseño conservador' :
             config.simultaneityFactor >= 0.6 ? '✓ Diseño típico' :
             '⚠️ Verificar con proceso real'}
          </p>
        </div>
      </Section>
    </div>
  );
}
