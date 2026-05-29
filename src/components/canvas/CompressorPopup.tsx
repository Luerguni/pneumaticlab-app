import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasStore } from '../../store/canvasStore';
import { worldToScreen } from '../../utils/canvasRenderer';
import type { SymbolInstance } from '../../types';
import { X, Zap } from 'lucide-react';

interface Props {
  sym: SymbolInstance;
  onClose: () => void;
}

export default function CompressorPopup({ sym, onClose }: Props) {
  const updateSymbol = useProjectStore(s => s.updateSymbol);
  const updateConfig = useProjectStore(s => s.updateSystemConfig);
  const config = useProjectStore(s => s.project.systemConfig);
  const viewport = useCanvasStore(s => s.viewport);

  const sp = worldToScreen(sym.position.x, sym.position.y, viewport.x, viewport.y, viewport.zoom);

  const [pressure, setPressure] = useState(config.workPressure);
  const [label, setLabel] = useState(sym.label);
  const [code, setCode] = useState(sym.code);

  const psi = (pressure * 14.5038).toFixed(1);
  const kpa = (pressure * 100).toFixed(0);

  const apply = () => {
    updateConfig({ workPressure: pressure, minRequiredPressure: Math.max(config.minRequiredPressure, pressure - 1.5) });
    updateSymbol(sym.id, { label, code });
    onClose();
  };

  return (
    <div
      className="absolute z-30 pointer-events-auto"
      style={{
        left: sp.x + 30,
        top: Math.max(8, sp.y - 80),
      }}
    >
      <div className="bg-[#141720] border border-[#00D4FF33] rounded-xl shadow-2xl p-4 w-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-[#00D4FF]" />
            <span className="text-xs font-mono font-semibold text-white">Compresor</span>
            <span className="text-[9px] font-mono text-white/30">{sym.code || 'C1'}</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60">
            <X size={13} />
          </button>
        </div>

        {/* Pressure control — main feature */}
        <div className="mb-3">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block mb-1.5">
            Presión de salida
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1} max={16} step={0.5}
              value={pressure}
              onChange={e => setPressure(parseFloat(e.target.value))}
              className="flex-1 accent-[#00D4FF]"
            />
            <span className="text-sm font-mono text-[#00D4FF] w-14 text-right font-bold">
              {pressure} bar
            </span>
          </div>
          <div className="flex gap-3 mt-1 text-[10px] font-mono text-white/25">
            <span>{psi} PSI</span>
            <span>{kpa} kPa</span>
          </div>

          {/* Pressure bar visual */}
          <div className="mt-2 h-2 bg-[#1C2030] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(pressure / 16) * 100}%`,
                background: pressure > 10
                  ? 'linear-gradient(90deg, #00D4FF, #FF6B35)'
                  : 'linear-gradient(90deg, #00D4FF, #00FF9D)',
              }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-white/20 mt-0.5">
            <span>1 bar</span>
            <span>8 bar</span>
            <span>16 bar</span>
          </div>
        </div>

        {/* Preset pressures */}
        <div className="flex gap-1.5 mb-3">
          {[4, 6, 7, 8, 10].map(p => (
            <button
              key={p}
              onClick={() => setPressure(p)}
              className={`flex-1 text-[9px] font-mono py-1 rounded transition-all ${
                pressure === p
                  ? 'bg-[#00D4FF22] text-[#00D4FF] border border-[#00D4FF55]'
                  : 'bg-[#1C2030] text-white/40 hover:text-white/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Label / code */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[9px] font-mono text-white/30 block mb-1">Etiqueta</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="C1"
              className="w-full bg-[#1C2030] border border-white/10 text-white text-[10px] font-mono px-2 py-1 rounded outline-none focus:border-[#00D4FF44]"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-white/30 block mb-1">Código</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="COMP-01"
              className="w-full bg-[#1C2030] border border-white/10 text-white text-[10px] font-mono px-2 py-1 rounded outline-none focus:border-[#00D4FF44]"
            />
          </div>
        </div>

        {/* Apply */}
        <button
          onClick={apply}
          className="w-full bg-[#00D4FF] text-[#0D0F14] text-xs font-mono font-bold py-1.5 rounded hover:bg-[#00D4FF]/90 transition-colors"
        >
          Aplicar cambios
        </button>
      </div>
    </div>
  );
}
