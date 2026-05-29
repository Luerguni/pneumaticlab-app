import React from 'react';
import type { CircuitPreset, CircuitType } from '../../types/floorplan';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasStore } from '../../store/canvasStore';
import { X } from 'lucide-react';

const PRESETS: CircuitPreset[] = [
  {
    type: 'lab',
    label: 'Laboratorio / Práctica escolar',
    emoji: '🔬',
    description: 'Circuito compacto de demostración. Ideal para escuelas técnicas y bancos de prueba.',
    workPressure: 4,
    minPressure: 3,
    simultaneityFactor: 1.0,
    gridScale: 0.1,   // 1 celda = 0.1m
    defaultDiameter: 8,
    maxPipes: 5,
  },
  {
    type: 'residential',
    label: 'Residencial / Taller',
    emoji: '🏠',
    description: 'Instalación doméstica o taller pequeño. Compresor de pistón, herramientas neumáticas.',
    workPressure: 6,
    minPressure: 5,
    simultaneityFactor: 0.7,
    gridScale: 0.5,   // 1 celda = 0.5m
    defaultDiameter: 15,
    maxPipes: 20,
  },
  {
    type: 'industrial',
    label: 'Industrial / Planta',
    emoji: '🏭',
    description: 'Red neumática industrial de alta capacidad. Múltiples zonas, alta presión.',
    workPressure: 8,
    minPressure: 6,
    simultaneityFactor: 0.6,
    gridScale: 2,     // 1 celda = 2m
    defaultDiameter: 32,
    maxPipes: 100,
  },
];

interface Props {
  onClose: () => void;
  onSelect: (preset: CircuitPreset) => void;
}

export default function CircuitTypeModal({ onClose, onSelect }: Props) {
  const updateConfig = useProjectStore(s => s.updateSystemConfig);
  const setScale = useCanvasStore(s => s.setScale);

  const handleSelect = (preset: CircuitPreset) => {
    updateConfig({
      workPressure: preset.workPressure,
      minRequiredPressure: preset.minPressure,
      simultaneityFactor: preset.simultaneityFactor,
    });
    setScale(preset.gridScale);
    onSelect(preset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#141720] border border-white/10 rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-mono font-bold text-white">Tipo de circuito</h2>
            <p className="text-sm font-mono text-white/40 mt-1">
              Selecciona el tipo de instalación para preconfigurar escala, presión y parámetros
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-3">
          {PRESETS.map(preset => (
            <button
              key={preset.type}
              onClick={() => handleSelect(preset)}
              className="group flex items-start gap-5 p-5 bg-[#1C2030] rounded-xl border border-white/[0.06]
                         hover:border-[#00D4FF44] hover:bg-[#1C2030]/80 text-left transition-all"
            >
              {/* Emoji */}
              <span className="text-3xl shrink-0 mt-0.5">{preset.emoji}</span>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-mono font-semibold text-white group-hover:text-[#00D4FF] transition-colors">
                    {preset.label}
                  </span>
                </div>
                <p className="text-xs font-mono text-white/40 mb-3">{preset.description}</p>

                {/* Specs grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Presión', value: `${preset.workPressure} bar` },
                    { label: 'P. mín', value: `${preset.minPressure} bar` },
                    { label: 'Escala', value: `1 cel = ${preset.gridScale}m` },
                    { label: 'Ø base', value: `${preset.defaultDiameter}mm` },
                  ].map(spec => (
                    <div key={spec.label} className="bg-[#0D0F14] rounded p-2">
                      <div className="text-[9px] font-mono text-white/30 uppercase">{spec.label}</div>
                      <div className="text-[11px] font-mono text-[#00D4FF]">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-white/20 group-hover:text-[#00D4FF] transition-colors text-xl mt-3">→</div>
            </button>
          ))}
        </div>

        {/* Skip */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs font-mono text-white/25 hover:text-white/50 transition-colors"
          >
            Saltar — configurar manualmente
          </button>
        </div>
      </div>
    </div>
  );
}

export { PRESETS };
export type { CircuitPreset };
