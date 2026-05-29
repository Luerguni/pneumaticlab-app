import React, { useEffect, useRef, useCallback } from 'react';
import { useSimStore } from '../../store/simulationStore';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useResultsStore } from '../../store/resultsStore';
import { tickParticles, particlePosition } from '../../engine/simulation';
import { worldToScreen } from '../../utils/canvasRenderer';

export default function SimulationOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const { sim, setParticles } = useSimStore();
  const pipes = useProjectStore(s => s.project.pipes);
  const viewport = useCanvasStore(s => s.viewport);
  const calcResult = useResultsStore(s => s.result);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if (sim.status === 'idle') return;

    const failedIds = new Set(sim.failures.filter(f => f.severity === 'critical').map(f => f.elementId));
    const warnIds = new Set(sim.failures.filter(f => f.severity === 'warning').map(f => f.elementId));

    // Draw pipe glow / highlight based on sim status
    pipes.forEach(pipe => {
      const segRes = calcResult?.segments.find(s => s.segmentId === pipe.id);
      if (!segRes) return;

      const ss = worldToScreen(pipe.start.x, pipe.start.y, viewport.x, viewport.y, viewport.zoom);
      const es = worldToScreen(pipe.end.x, pipe.end.y, viewport.x, viewport.y, viewport.zoom);
      const ms = { x: es.x, y: ss.y };

      const isFailed = failedIds.has(pipe.id);
      const isWarning = warnIds.has(pipe.id);
      const glowColor = isFailed ? '#FF2222' : isWarning ? '#FFBB00' : '#00FF9D';
      const alpha = sim.status === 'running' ? 0.25 : 0.15;

      // Glow halo
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = (segRes.diameterMm / 5 + 4) * viewport.zoom;
      ctx.lineCap = 'round';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ms.x, ms.y);
      ctx.lineTo(es.x, es.y);
      ctx.stroke();
      ctx.restore();

      // Pressure label at midpoint
      if (sim.status === 'running' || sim.status === 'failed') {
        const midX = (ss.x + es.x) / 2;
        const midY = (ss.y + es.y) / 2 - 14 * viewport.zoom;
        ctx.save();
        ctx.font = `${Math.max(9, 9 * viewport.zoom)}px 'JetBrains Mono'`;
        ctx.fillStyle = isFailed ? '#FF4444' : isWarning ? '#FFBB00' : '#00FF9D';
        ctx.globalAlpha = 0.9;
        ctx.textAlign = 'center';
        ctx.fillText(`${segRes.flowRateLmin.toFixed(0)} L/min`, midX, midY);
        ctx.restore();
      }
    });

    // Draw particles
    if (sim.status === 'running') {
      sim.particles.forEach(particle => {
        const pipe = pipes.find(p => p.id === particle.segmentId);
        if (!pipe) return;

        const wp = particlePosition(pipe, particle.t);
        const sp = worldToScreen(wp.x, wp.y, viewport.x, viewport.y, viewport.zoom);
        const isFailed = failedIds.has(pipe.id);
        const color = isFailed ? '#FF4444' : '#00D4FF';
        const r = Math.max(2, 3 * viewport.zoom);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw failure markers on symbols
    sim.failures.forEach(failure => {
      if (failure.elementId === 'system') return;
      // Check if it's a pipe or symbol
      const pipe = pipes.find(p => p.id === failure.elementId);
      if (pipe) {
        const ss = worldToScreen(pipe.start.x, pipe.start.y, viewport.x, viewport.y, viewport.zoom);
        const es = worldToScreen(pipe.end.x, pipe.end.y, viewport.x, viewport.y, viewport.zoom);
        const cx = (ss.x + es.x) / 2;
        const cy = (ss.y + es.y) / 2;
        const color = failure.severity === 'critical' ? '#FF2222' : '#FFBB00';

        // Pulsing warning circle
        const pulse = 0.7 + 0.3 * Math.sin(sim.time * 5);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 10 * viewport.zoom * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(11, 12 * viewport.zoom)}px 'JetBrains Mono'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(failure.severity === 'critical' ? '✕' : '⚠', cx, cy);
        ctx.restore();
      }
    });

  }, [sim, pipes, viewport, calcResult]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (sim.status !== 'running') {
      draw();
      return;
    }
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    const nextParticles = tickParticles(sim.particles, dt, sim.speed);
    setParticles(nextParticles);
    draw();
    animRef.current = requestAnimationFrame(animate);
  }, [sim, draw, setParticles]);

  useEffect(() => {
    if (sim.status === 'running') {
      lastTimeRef.current = performance.now();
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
      draw();
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [sim.status, animate, draw]);

  // Resize
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const parent = cvs.parentElement;
    if (!parent) return;
    const obs = new ResizeObserver(() => {
      cvs.width = parent.clientWidth;
      cvs.height = parent.clientHeight;
      draw();
    });
    obs.observe(parent);
    return () => obs.disconnect();
  }, [draw]);

  if (sim.status === 'idle') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
