import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { SYMBOL_COMPONENTS, SYMBOL_LABELS } from '../symbols/SymbolSVGs';
import type { SymbolType } from '../../types';
import { Search } from 'lucide-react';

const SYMBOL_GROUPS = [
  {
    name: 'Generación',
    symbols: ['compressor', 'reservoir'] as SymbolType[],
  },
  {
    name: 'Acondicionamiento',
    symbols: ['frl', 'filter', 'regulator', 'lubricator'] as SymbolType[],
  },
  {
    name: 'Válvulas',
    symbols: [
      'valve_2_2', 'valve_3_2', 'valve_4_2',
      'valve_4_3', 'valve_5_2', 'valve_5_3',
      'check_valve', 'flow_control',
    ] as SymbolType[],
  },
  {
    name: 'Actuadores',
    symbols: [
      'cylinder_single', 'cylinder_double', 'cylinder_telescopic',
      'motor_pneumatic',
    ] as SymbolType[],
  },
  {
    name: 'Instrumentación',
    symbols: ['pressure_gauge', 'pressure_switch', 'position_sensor', 'flow_arrow'] as SymbolType[],
  },
  {
    name: 'Conexiones',
    symbols: ['tee', 'elbow', 'cross', 'silencer'] as SymbolType[],
  },
];

export default function SymbolLibrary() {
  const canvas = useCanvasStore();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = search.trim()
    ? SYMBOL_GROUPS.map(g => ({
        ...g,
        symbols: g.symbols.filter(s =>
          (SYMBOL_LABELS[s] ?? s).toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.symbols.length > 0)
    : SYMBOL_GROUPS;

  const handleSelect = (type: SymbolType) => {
    canvas.setActiveSymbol(type);
    canvas.setTool('symbol');
  };

  const toggleGroup = (name: string) =>
    setCollapsed(c => ({ ...c, [name]: !c[name] }));

  return (
    <div className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#141720] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/[0.06]">
        <p className="text-[10px] font-mono text-[#00D4FF] tracking-widest uppercase mb-2">ISO 1219</p>
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar símbolo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1C2030] border border-white/10 text-white/80 text-xs font-mono pl-6 pr-2 py-1 rounded outline-none focus:border-[#00D4FF44] placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Symbols */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(group => (
          <div key={group.name}>
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-mono text-white/40 hover:text-white/60 uppercase tracking-widest transition-colors bg-[#0D0F14]/50"
            >
              {group.name}
              <span className="text-white/20">{collapsed[group.name] ? '▶' : '▼'}</span>
            </button>
            {!collapsed[group.name] && (
              <div className="grid grid-cols-3 gap-1 p-2">
                {group.symbols.map(symType => {
                  const Comp = SYMBOL_COMPONENTS[symType];
                  const label = SYMBOL_LABELS[symType] ?? symType;
                  const isActive = canvas.activeSymbolType === symType && canvas.tool === 'symbol';
                  return (
                    <button
                      key={symType}
                      onClick={() => handleSelect(symType)}
                      title={label}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded transition-all ${
                        isActive
                          ? 'bg-[#00D4FF15] border border-[#00D4FF44] text-[#00D4FF]'
                          : 'hover:bg-white/5 border border-transparent text-white/50 hover:text-white/80'
                      }`}
                    >
                      {Comp ? (
                        <Comp size={28} color={isActive ? '#00D4FF' : '#E2E8F0'} />
                      ) : (
                        <div className="w-7 h-7 flex items-center justify-center bg-white/5 rounded">
                          <span className="text-[8px] font-mono">{symType.slice(0, 3).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="text-[8px] font-mono leading-tight text-center line-clamp-2">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active tool hint */}
      {canvas.tool === 'symbol' && canvas.activeSymbolType && (
        <div className="px-3 py-2 border-t border-white/[0.06] bg-[#00D4FF08]">
          <p className="text-[9px] font-mono text-[#00D4FF]/70">
            Click en el canvas para colocar {SYMBOL_LABELS[canvas.activeSymbolType]}
          </p>
        </div>
      )}
    </div>
  );
}
