import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useProjectStore } from '../../store/projectStore';
import { useResultsStore } from '../../store/resultsStore';
import { useSimStore } from '../../store/simulationStore';
import {
  drawGrid, drawPipe,
  screenToWorld, worldToScreen, snapToGrid,
  hitTestPipe, hitTestSymbol, PIPE_STYLES,
} from '../../utils/canvasRenderer';
import { useFloorPlanRenderer } from './FloorPlanLayer';
import FloorPlanInteractionLayer from './FloorPlanLayer';
import CanvasSymbolOverlay from './CanvasSymbolOverlay';
import SimulationOverlay from './SimulationOverlay';
import CompressorPopup from './CompressorPopup';
import type { Point, PipeSegment, SymbolInstance } from '../../types';

const SYMBOL_SIZE = 40;

interface Props {
  floorTool: 'wall' | 'room' | null;
}

export default function CanvasEditor({ floorTool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<Point>({ x: 0, y: 0 });
  const panViewStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isSpaceDown = useRef(false);
  const [compressorSym, setCompressorSym] = useState<SymbolInstance | null>(null);

  const canvas = useCanvasStore();
  const project = useProjectStore(s => s.project);
  const addPipe = useProjectStore(s => s.addPipe);
  const addSymbol = useProjectStore(s => s.addSymbol);
  const removeP = useProjectStore(s => s.removePipe);
  const removeSym = useProjectStore(s => s.removeSymbol);
  const updateSym = useProjectStore(s => s.updateSymbol);
  const result = useResultsStore(s => s.result);
  const { floorPlan, addWall, addRoom } = useSimStore();

  const getWorldPoint = useCallback((sx: number, sy: number): Point => {
    const { viewport, snapToGrid: snap, gridSize } = canvas;
    let wp = screenToWorld(sx, sy, viewport.x, viewport.y, viewport.zoom);
    if (snap) {
      wp = { x: snapToGrid(wp.x, gridSize), y: snapToGrid(wp.y, gridSize) };
    }
    return wp;
  }, [canvas]);

  // Render loop - Canvas 2D draws: background, grid, floor plan, pipes
  const render = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const { width, height } = cvs;
    const { viewport, gridVisible, gridSize, gridIsometric } = canvas;

    ctx.fillStyle = '#0D0F14';
    ctx.fillRect(0, 0, width, height);

    if (gridVisible) {
      drawGrid(ctx, width, height, viewport.x, viewport.y, viewport.zoom, gridSize, gridIsometric);
    }

    // Floor plan rooms + walls
    if (floorPlan.visible) {
      floorPlan.rooms.forEach(room => {
        const tl = worldToScreen(room.x, room.y, viewport.x, viewport.y, viewport.zoom);
        const br = worldToScreen(room.x + room.width, room.y + room.height, viewport.x, viewport.y, viewport.zoom);
        ctx.save();
        ctx.fillStyle = room.color;
        ctx.globalAlpha = room.opacity * 0.18;
        ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = room.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.globalAlpha = 1;
        ctx.font = `${Math.max(9, 10 * viewport.zoom)}px 'JetBrains Mono'`;
        ctx.fillStyle = room.color;
        ctx.fillText(room.name, tl.x + 6, tl.y + 14);
        ctx.restore();
      });

      floorPlan.walls.forEach(wall => {
        const ss = worldToScreen(wall.start.x, wall.start.y, viewport.x, viewport.y, viewport.zoom);
        const es = worldToScreen(wall.end.x, wall.end.y, viewport.x, viewport.y, viewport.zoom);
        ctx.save();
        ctx.strokeStyle = '#A09070';
        ctx.lineWidth = Math.max(3, (wall.thickness / 8) * viewport.zoom);
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(es.x, es.y);
        ctx.stroke();
        // Hatch
        ctx.strokeStyle = '#705030';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });
    }

    // Pipes
    for (const pipe of project.pipes) {
      const seg = result?.segments.find(s => s.segmentId === pipe.id);
      const selected = canvas.selectedIds.includes(pipe.id);
      drawPipe(ctx, pipe, viewport.x, viewport.y, viewport.zoom, selected, seg ? { status: seg.status } : null);
    }

    // Symbols handled by CanvasSymbolOverlay (DOM overlay)

    // Drawing pipe preview
    if (canvas.drawingPipe && canvas.tool.startsWith('pipe_')) {
      const start = canvas.drawingPipe.start;
      const ss = worldToScreen(start.x, start.y, viewport.x, viewport.y, viewport.zoom);
      const es = worldToScreen(mousePos.x, mousePos.y, viewport.x, viewport.y, viewport.zoom);
      const style = PIPE_STYLES[canvas.activePipeType] ?? PIPE_STYLES.main;
      ctx.save();
      ctx.strokeStyle = style.color + 'AA';
      ctx.lineWidth = style.width * viewport.zoom;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(es.x, ss.y); // horizontal
      ctx.lineTo(es.x, es.y); // vertical
      ctx.stroke();
      ctx.setLineDash([]);
      // Corner dot
      ctx.beginPath();
      ctx.arc(es.x, ss.y, 3 * viewport.zoom, 0, Math.PI * 2);
      ctx.fillStyle = style.color;
      ctx.fill();
      ctx.restore();
    }

    // Crosshair
    if (!isPanning && !floorTool) {
      const ms = worldToScreen(mousePos.x, mousePos.y, viewport.x, viewport.y, viewport.zoom);
      ctx.save();
      ctx.strokeStyle = 'rgba(0,212,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ms.x, 0); ctx.lineTo(ms.x, height);
      ctx.moveTo(0, ms.y); ctx.lineTo(width, ms.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [canvas, project, result, mousePos, isPanning, floorTool, floorPlan]);

  // Use floor plan renderer hook
  useFloorPlanRenderer(
    canvasRef.current?.getContext('2d') ?? null,
    canvasRef.current?.width ?? 0,
    canvasRef.current?.height ?? 0
  );

  useEffect(() => { render(); }, [render]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(entries => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const { width, height } = entries[0].contentRect;
      cvs.width = width;
      cvs.height = height;
      render();
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, [render]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const pivot = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    canvas.zoom(e.deltaY < 0 ? 1.12 : 0.89, pivot);
  }, [canvas]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.addEventListener('wheel', handleWheel, { passive: false });
    return () => cvs.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (floorTool) return; // Let floor plan layer handle it
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = getWorldPoint(sx, sy);

    // Pan: right-click, middle-click, or space+drag
    if (e.button === 2 || isSpaceDown.current || e.button === 1) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panViewStart.current = { x: canvas.viewport.x, y: canvas.viewport.y };
      return;
    }
    if (e.button !== 0) return;

    const tool = canvas.tool;

    if (tool === 'select') {
      // Check compressor double-click
      for (const sym of [...project.symbols].reverse()) {
        if (hitTestSymbol(sym, wp, SYMBOL_SIZE / 2)) {
          canvas.setSelected([sym.id]);
          if (e.detail === 2 && sym.type === 'compressor') {
            setCompressorSym(sym);
          }
          return;
        }
      }
      for (const pipe of [...project.pipes].reverse()) {
        if (hitTestPipe(pipe, wp, 8 / canvas.viewport.zoom)) {
          canvas.setSelected([pipe.id]);
          return;
        }
      }
      canvas.clearSelected();
      setCompressorSym(null);
      return;
    }

    if (tool.startsWith('pipe_')) {
      if (!canvas.drawingPipe) {
        canvas.startDrawingPipe(wp);
      } else {
        const pipeType = canvas.activePipeType;
        const newPipe: PipeSegment = {
          id: crypto.randomUUID(),
          type: pipeType,
          start: canvas.drawingPipe.start,
          end: wp,
          name: '',
          diameter: pipeType === 'main' ? 25 : pipeType === 'secondary' ? 20 : 15,
          lengthReal: null,
          material: 'galvanized_steel',
          roughness: 0.15,
          elbows90: 0,
          elbows45: 0,
          tees: 0,
          globeValves: 0,
          consumers: [],
          notes: '',
        };
        addPipe(newPipe);
        canvas.stopDrawingPipe();
        canvas.setSelected([newPipe.id]);
      }
      return;
    }

    if (tool === 'symbol' && canvas.activeSymbolType) {
      const newSym: SymbolInstance = {
        id: crypto.randomUUID(),
        type: canvas.activeSymbolType,
        position: wp,
        rotation: 0,
        label: '',
        code: '',
        ports: [],
        properties: {},
      };
      addSymbol(newSym);
      canvas.setSelected([newSym.id]);
      return;
    }

    if (tool === 'delete') {
      for (const pipe of project.pipes) {
        if (hitTestPipe(pipe, wp, 8 / canvas.viewport.zoom)) { removeP(pipe.id); return; }
      }
      for (const sym of project.symbols) {
        if (hitTestSymbol(sym, wp, SYMBOL_SIZE / 2)) { removeSym(sym.id); return; }
      }
    }
  }, [canvas, project, getWorldPoint, addPipe, addSymbol, removeP, removeSym, floorTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      canvas.setViewport({
        x: panViewStart.current.x + dx,
        y: panViewStart.current.y + dy,
      });
      return;
    }

    const wp = getWorldPoint(sx, sy);
    setMousePos(wp);
  }, [isPanning, canvas, getWorldPoint]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) setIsPanning(false);
  }, [isPanning]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => { e.preventDefault(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = true;
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        canvas.stopDrawingPipe();
        canvas.clearSelected();
        canvas.setTool('select');
        setCompressorSym(null);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        canvas.selectedIds.forEach(id => {
          if (project.pipes.find(p => p.id === id)) removeP(id);
          if (project.symbols.find(s => s.id === id)) removeSym(id);
        });
        canvas.clearSelected();
      }
      if (e.key === 'r' || e.key === 'R') {
        canvas.selectedIds.forEach(id => {
          const sym = project.symbols.find(s => s.id === id);
          if (sym) updateSym(id, { rotation: ((sym.rotation + 90) % 360) as 0 | 90 | 180 | 270 });
        });
      }
      // Zoom with +/- keys
      if (e.key === '+' || e.key === '=') canvas.zoom(1.2);
      if (e.key === '-') canvas.zoom(0.83);
      // Fit view: F
      if (e.key === 'f' || e.key === 'F') canvas.setViewport({ x: 0, y: 0, zoom: 1 });
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas, project.pipes, project.symbols, removeP, removeSym, updateSym]);

  const cursorStyle = isPanning ? 'grabbing' :
    isSpaceDown.current ? 'grab' :
    floorTool ? 'crosshair' :
    canvas.tool === 'select' ? 'default' :
    canvas.tool === 'delete' ? 'not-allowed' :
    'crosshair';

  const scaleLabelPx = canvas.gridSize * canvas.viewport.zoom * 5;
  const scaleLabelM = (canvas.scale * 5).toFixed(canvas.scale < 1 ? 2 : 1);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#0D0F14]" style={{ cursor: cursorStyle }}>
      {/* Main canvas — grid, floor plan, pipes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      />

      {/* Simulation glow / particles canvas */}
      <SimulationOverlay />

      {/* Symbol overlay — crisp SVGs */}
      <CanvasSymbolOverlay onDoubleClick={(sym) => {
        if (sym.type === 'compressor') setCompressorSym(sym);
      }} />

      {/* Floor plan interaction (wall/room drawing) */}
      {floorTool && (
        <FloorPlanInteractionLayer
          tool={floorTool}
          onWallDrawn={addWall}
          onRoomDrawn={addRoom}
        />
      )}

      {/* Compressor popup on double-click */}
      {compressorSym && (
        <CompressorPopup
          sym={compressorSym}
          onClose={() => setCompressorSym(null)}
        />
      )}

      {/* Scale bar */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] font-mono text-white/40 select-none pointer-events-none">
        <div className="h-px bg-white/30" style={{ width: Math.max(30, scaleLabelPx) }} />
        <span>{scaleLabelM}m</span>
        <span className="ml-2">zoom: {(canvas.viewport.zoom * 100).toFixed(0)}%</span>
        {floorTool && (
          <span className="ml-2 text-[#FF6B35]">
            {floorTool === 'wall' ? '◼ Dibujando muro' : '▭ Dibujando habitación'} — clic para definir inicio
          </span>
        )}
      </div>

      {/* Mouse coords */}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/25 select-none pointer-events-none">
        {(mousePos.x / canvas.gridSize * canvas.scale).toFixed(2)}m, {(mousePos.y / canvas.gridSize * canvas.scale).toFixed(2)}m
      </div>

      {/* Pipe drawing hint */}
      {canvas.drawingPipe && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#141720] border border-[#00D4FF33] text-[#00D4FF] text-xs font-mono px-3 py-1.5 rounded pointer-events-none">
          Click para terminar tubería — ESC para cancelar
        </div>
      )}

      {/* Pan hint */}
      {isSpaceDown.current && (
        <div className="absolute top-3 right-4 text-[10px] font-mono text-white/30 pointer-events-none">
          MOVER — suelta espacio para volver
        </div>
      )}
    </div>
  );
}
