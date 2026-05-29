import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useProjectStore } from '../../store/projectStore';
import { Plus, Trash2, X } from 'lucide-react';
import type { PipeSegment, SymbolInstance, Consumer, Material } from '../../types';

const MATERIALS: { value: Material; label: string; roughness: number }[] = [
  { value: 'galvanized_steel', label: 'Acero galvanizado', roughness: 0.15 },
  { value: 'copper', label: 'Cobre', roughness: 0.0015 },
  { value: 'aluminum', label: 'Aluminio', roughness: 0.015 },
  { value: 'pvc', label: 'PVC', roughness: 0.0015 },
  { value: 'ptfe', label: 'PTFE', roughness: 0.0015 },
  { value: 'polyurethane', label: 'Poliuretano', roughness: 0.007 },
];

function Field({
  label, children, unit,
}: { label: string; children: React.ReactNode; unit?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 items-center">
      <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-1">
        {children}
        {unit && <span className="text-[10px] font-mono text-white/30 shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

function NumInput({
  value, onChange, min, max, step = 0.1
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1 rounded outline-none focus:border-[#00D4FF44] focus:bg-[#1C2030]"
    />
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1 rounded outline-none focus:border-[#00D4FF44]"
    />
  );
}

function PipeProperties({ pipe }: { pipe: PipeSegment }) {
  const updatePipe = useProjectStore(s => s.updatePipe);
  const [showConsumers, setShowConsumers] = useState(true);
  const u = (updates: Partial<PipeSegment>) => updatePipe(pipe.id, updates);

  const addConsumer = () => {
    const c: Consumer = {
      id: crypto.randomUUID(),
      name: `Consumidor ${pipe.consumers.length + 1}`,
      flowRate: 100,
      minPressure: 5,
    };
    u({ consumers: [...pipe.consumers, c] });
  };

  const updateConsumer = (id: string, updates: Partial<Consumer>) => {
    u({
      consumers: pipe.consumers.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  };

  const removeConsumer = (id: string) => {
    u({ consumers: pipe.consumers.filter(c => c.id !== id) });
  };

  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-8 h-1 rounded"
          style={{ backgroundColor: pipe.color ?? (pipe.type === 'main' ? '#00D4FF' : pipe.type === 'return' ? '#FF6B35' : '#E2E8F0') }}
        />
        <span className="text-xs font-mono text-white/60 uppercase">{pipe.type}</span>
      </div>

      <Field label="Nombre">
        <TextInput value={pipe.name} onChange={v => u({ name: v })} />
      </Field>

      <Field label="Diámetro" unit="mm">
        <select
          value={pipe.diameter}
          onChange={e => u({ diameter: parseInt(e.target.value) })}
          className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1 rounded outline-none"
        >
          {[8, 10, 12, 15, 20, 25, 32, 40, 50, 65, 80, 100].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>

      <Field label="Longitud" unit="m">
        <NumInput
          value={pipe.lengthReal ?? 0}
          onChange={v => u({ lengthReal: v > 0 ? v : null })}
          min={0} step={0.5}
        />
      </Field>

      <Field label="Material">
        <select
          value={pipe.material}
          onChange={e => {
            const mat = e.target.value as Material;
            const roughness = MATERIALS.find(m => m.value === mat)?.roughness ?? 0.15;
            u({ material: mat, roughness });
          }}
          className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1 rounded outline-none"
        >
          {MATERIALS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Rugosidad ε" unit="mm">
        <NumInput value={pipe.roughness} onChange={v => u({ roughness: v })} min={0} step={0.001} />
      </Field>

      <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-1">Accesorios</div>

      <Field label="Codos 90°">
        <NumInput value={pipe.elbows90} onChange={v => u({ elbows90: Math.floor(v) })} min={0} step={1} />
      </Field>
      <Field label="Codos 45°">
        <NumInput value={pipe.elbows45} onChange={v => u({ elbows45: Math.floor(v) })} min={0} step={1} />
      </Field>
      <Field label="Tees">
        <NumInput value={pipe.tees} onChange={v => u({ tees: Math.floor(v) })} min={0} step={1} />
      </Field>
      <Field label="V. Globo">
        <NumInput value={pipe.globeValves} onChange={v => u({ globeValves: Math.floor(v) })} min={0} step={1} />
      </Field>

      {/* Consumers */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => setShowConsumers(s => !s)}
          className="text-[10px] font-mono text-white/40 uppercase tracking-wider hover:text-white/60"
        >
          Consumidores ({pipe.consumers.length}) {showConsumers ? '▼' : '▶'}
        </button>
        <button
          onClick={addConsumer}
          className="flex items-center gap-1 text-[10px] font-mono text-[#00D4FF]/70 hover:text-[#00D4FF] transition-colors"
        >
          <Plus size={11} /> Añadir
        </button>
      </div>

      {showConsumers && pipe.consumers.map(c => (
        <div key={c.id} className="bg-[#1C2030] rounded p-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={c.name}
              onChange={e => updateConsumer(c.id, { name: e.target.value })}
              className="bg-transparent text-[10px] font-mono text-white/70 outline-none w-full"
            />
            <button onClick={() => removeConsumer(c.id)} className="text-white/30 hover:text-red-400">
              <Trash2 size={10} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono text-white/30">Caudal L/min</label>
              <NumInput value={c.flowRate} onChange={v => updateConsumer(c.id, { flowRate: v })} min={0} step={10} />
            </div>
            <div>
              <label className="text-[9px] font-mono text-white/30">P.min bar</label>
              <NumInput value={c.minPressure} onChange={v => updateConsumer(c.id, { minPressure: v })} min={0} step={0.5} />
            </div>
          </div>
        </div>
      ))}

      <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-1">Notas</div>
      <textarea
        value={pipe.notes}
        onChange={e => u({ notes: e.target.value })}
        rows={2}
        className="w-full bg-[#1C2030] border border-white/10 text-white/70 text-xs font-mono px-2 py-1 rounded outline-none focus:border-[#00D4FF44] resize-none"
        placeholder="Notas..."
      />
    </div>
  );
}

function SymbolProperties({ sym }: { sym: SymbolInstance }) {
  const updateSymbol = useProjectStore(s => s.updateSymbol);
  const u = (updates: Partial<SymbolInstance>) => updateSymbol(sym.id, updates);

  const isCylinder = sym.type.startsWith('cylinder_');
  const cylinderSizeM = (sym.properties?.cylinderSizeM as number) ?? 0.05;

  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto">
      <div className="text-xs font-mono text-white/60 uppercase">{sym.type.replace(/_/g, ' ')}</div>

      <Field label="Etiqueta">
        <TextInput value={sym.label} onChange={v => u({ label: v })} />
      </Field>
      <Field label="Código">
        <TextInput value={sym.code} onChange={v => u({ code: v })} />
      </Field>

      {isCylinder && (
        <Field label="Tamaño émbolo" unit="m">
          <NumInput
            value={cylinderSizeM}
            onChange={v => u({ properties: { ...sym.properties, cylinderSizeM: v } })}
            min={0.01}
            step={0.01}
          />
        </Field>
      )}

      <Field label="Rotación">
        <select
          value={sym.rotation}
          onChange={e => u({ rotation: parseInt(e.target.value) as 0 | 90 | 180 | 270 })}
          className="w-full bg-[#1C2030] border border-white/10 text-white text-xs font-mono px-2 py-1 rounded outline-none"
        >
          <option value={0}>0°</option>
          <option value={90}>90°</option>
          <option value={180}>180°</option>
          <option value={270}>270°</option>
        </select>
      </Field>
      <Field label="X" unit="px">
        <NumInput value={sym.position.x} onChange={v => u({ position: { ...sym.position, x: v } })} step={1} />
      </Field>
      <Field label="Y" unit="px">
        <NumInput value={sym.position.y} onChange={v => u({ position: { ...sym.position, y: v } })} step={1} />
      </Field>
    </div>
  );
}

export default function PropertiesPanel() {
  const canvas = useCanvasStore();
  const project = useProjectStore(s => s.project);
  const clearSelected = useCanvasStore(s => s.clearSelected);

  if (canvas.selectedIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20 text-xs font-mono px-4 text-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M3 3l7 7m0 0l7 7M3 17l7-7m0 0L17 3" />
        </svg>
        <span>Selecciona un elemento en el canvas para ver sus propiedades</span>
      </div>
    );
  }

  const selId = canvas.selectedIds[0];
  const pipe = project.pipes.find(p => p.id === selId);
  const sym = project.symbols.find(s => s.id === selId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Propiedades</span>
        <button onClick={clearSelected} className="text-white/30 hover:text-white/60">
          <X size={12} />
        </button>
      </div>
      {pipe && <PipeProperties pipe={pipe} />}
      {sym && <SymbolProperties sym={sym} />}
    </div>
  );
}
