import React from 'react';
import { useSimStore } from '../../store/simulationStore';
import { Play, Pause, Square, FastForward, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

export default function SimPanel() {
  const { sim, startSim, pauseSim, stopSim, setSpeed } = useSimStore();

  if (sim.status === 'idle') return null;

  const criticals = sim.failures.filter(f => f.severity === 'critical');
  const warnings = sim.failures.filter(f => f.severity === 'warning');
  const allOk = sim.failures.length === 0;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 pointer-events-auto"
         style={{ minWidth: 340, maxWidth: 480 }}>

      {/* Failure/warning cards */}
      {criticals.map((f, i) => (
        <div key={i}
          className="bg-red-950/90 border border-red-500/40 rounded-lg px-4 py-3 flex gap-3 items-start backdrop-blur-sm shadow-xl">
          <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-mono font-semibold text-red-300">{f.message}</div>
            <div className="text-[11px] font-mono text-red-400/70 mt-0.5">{f.detail}</div>
          </div>
        </div>
      ))}

      {warnings.slice(0, 2).map((f, i) => (
        <div key={i}
          className="bg-yellow-950/90 border border-yellow-500/40 rounded-lg px-4 py-3 flex gap-3 items-start backdrop-blur-sm shadow-xl">
          <AlertTriangle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-mono font-semibold text-yellow-300">{f.message}</div>
            <div className="text-[11px] font-mono text-yellow-400/60 mt-0.5">{f.detail}</div>
          </div>
        </div>
      ))}

      {allOk && sim.status === 'running' && (
        <div className="bg-[#00FF9D10] border border-[#00FF9D40] rounded-lg px-4 py-2.5 flex gap-2 items-center backdrop-blur-sm shadow-xl">
          <CheckCircle2 size={15} className="text-[#00FF9D]" />
          <span className="text-xs font-mono text-[#00FF9D]">
            Sistema operando correctamente — P. final: {sim.pressureAtEnd.toFixed(3)} bar
          </span>
        </div>
      )}

      {/* Controls bar */}
      <div className="bg-[#141720]/95 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm shadow-2xl">
        {/* Status indicator */}
        <div className="flex items-center gap-2 flex-1">
          {sim.status === 'running' && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00FF9D]">SIMULANDO</span>
            </div>
          )}
          {sim.status === 'paused' && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-[10px] font-mono text-yellow-400">PAUSADO</span>
            </div>
          )}
          {sim.status === 'failed' && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-mono text-red-400">ERROR DETECTADO</span>
            </div>
          )}
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          <FastForward size={11} className="text-white/30" />
          {([0.5, 1, 2] as const).map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                sim.speed === s
                  ? 'bg-[#00D4FF22] text-[#00D4FF]'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Play/pause/stop */}
        {sim.status === 'running' ? (
          <button
            onClick={pauseSim}
            className="flex items-center gap-1.5 text-[10px] font-mono text-white/60 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            <Pause size={12} /> Pausar
          </button>
        ) : (
          <button
            onClick={startSim}
            className="flex items-center gap-1.5 text-[10px] font-mono text-[#00D4FF] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#00D4FF10]"
          >
            <Play size={12} /> {sim.status === 'paused' ? 'Continuar' : 'Reiniciar'}
          </button>
        )}

        <button
          onClick={stopSim}
          className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
        >
          <Square size={12} /> Detener
        </button>

        {/* Failure count badge */}
        {criticals.length > 0 && (
          <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-mono">
            <Zap size={10} /> {criticals.length} error{criticals.length !== 1 ? 'es' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
