import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSimStore } from '../../store/simulationStore';
import { useCanvasStore } from '../../store/canvasStore';
import { worldToScreen, screenToWorld, snapToGrid } from '../../utils/canvasRenderer';
import type { Room, Wall } from '../../types/floorplan';

/** Renders rooms + walls as a canvas overlay, and handles floor plan drawing interactions */
export function useFloorPlanRenderer(
  ctx: CanvasRenderingContext2D | null,
  width: number,
  height: number
) {
  const { floorPlan } = useSimStore();
  const viewport = useCanvasStore(s => s.viewport);

  const draw = useCallback(() => {
    if (!ctx || !floorPlan.visible) return;

    // Rooms
    floorPlan.rooms.forEach(room => {
      const tl = worldToScreen(room.x, room.y, viewport.x, viewport.y, viewport.zoom);
      const br = worldToScreen(room.x + room.width, room.y + room.height, viewport.x, viewport.y, viewport.zoom);
      const w = br.x - tl.x;
      const h = br.y - tl.y;

      ctx.save();
      ctx.fillStyle = room.color;
      ctx.globalAlpha = room.opacity * 0.25;
      ctx.fillRect(tl.x, tl.y, w, h);
      ctx.globalAlpha = room.opacity * 0.6;
      ctx.strokeStyle = room.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tl.x, tl.y, w, h);
      ctx.globalAlpha = 1;

      // Room label
      ctx.font = `${Math.max(9, 11 * viewport.zoom)}px 'JetBrains Mono'`;
      ctx.fillStyle = room.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(room.name, tl.x + 6, tl.y + 5);
      ctx.restore();
    });

    // Walls
    floorPlan.walls.forEach(wall => {
      const ss = worldToScreen(wall.start.x, wall.start.y, viewport.x, viewport.y, viewport.zoom);
      const es = worldToScreen(wall.end.x, wall.end.y, viewport.x, viewport.y, viewport.zoom);
      const thickness = Math.max(2, (wall.thickness / 10) * viewport.zoom);

      ctx.save();
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(es.x, es.y);
      ctx.stroke();

      // Hatch pattern for wall thickness
      ctx.strokeStyle = '#6B5335';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(es.x, es.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Wall label
      if (wall.label) {
        const mx = (ss.x + es.x) / 2;
        const my = (ss.y + es.y) / 2 - 10;
        ctx.save();
        ctx.font = `${Math.max(8, 9 * viewport.zoom)}px 'JetBrains Mono'`;
        ctx.fillStyle = '#A0896B';
        ctx.textAlign = 'center';
        ctx.fillText(wall.label, mx, my);
        ctx.restore();
      }
    });
  }, [ctx, floorPlan, viewport]);

  useEffect(() => { draw(); }, [draw]);
  return draw;
}

/** Inline React overlay for drawing floor plan interactively */
export default function FloorPlanInteractionLayer({
  tool,
  onWallDrawn,
  onRoomDrawn,
}: {
  tool: 'wall' | 'room' | null;
  onWallDrawn: (wall: Wall) => void;
  onRoomDrawn: (room: Room) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const viewport = useCanvasStore(s => s.viewport);
  const snap = useCanvasStore(s => s.snapToGrid);
  const gridSize = useCanvasStore(s => s.gridSize);

  const [drawing, setDrawing] = useState<{ start: { x: number; y: number } } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const toWorld = (sx: number, sy: number) => {
    let wp = screenToWorld(sx, sy, viewport.x, viewport.y, viewport.zoom);
    if (snap) wp = { x: snapToGrid(wp.x, gridSize), y: snapToGrid(wp.y, gridSize) };
    return wp;
  };

  if (!tool) return null;

  const startWS = drawing
    ? worldToScreen(drawing.start.x, drawing.start.y, viewport.x, viewport.y, viewport.zoom)
    : null;
  const endWS = worldToScreen(cursor.x, cursor.y, viewport.x, viewport.y, viewport.zoom);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const wp = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    setDrawing({ start: wp });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const wp = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    setCursor(wp);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const wp = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (tool === 'wall') {
      onWallDrawn({
        id: crypto.randomUUID(),
        start: drawing.start,
        end: wp,
        thickness: 20,
        label: '',
      });
    } else if (tool === 'room') {
      const x = Math.min(drawing.start.x, wp.x);
      const y = Math.min(drawing.start.y, wp.y);
      const width = Math.abs(wp.x - drawing.start.x);
      const height = Math.abs(wp.y - drawing.start.y);
      const colors = ['#00D4FF', '#FF6B35', '#00FF9D', '#FFB800', '#AA55FF'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      onRoomDrawn({
        id: crypto.randomUUID(),
        name: 'Habitación',
        x, y, width, height,
        color,
        opacity: 0.8,
      });
    }
    setDrawing(null);
  };

  const COLORS = { wall: '#8B7355', room: '#00D4FF' };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ cursor: 'crosshair', zIndex: 8 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Preview */}
      {drawing && startWS && (
        <>
          {tool === 'wall' && (
            <line
              x1={startWS.x} y1={startWS.y}
              x2={endWS.x} y2={endWS.y}
              stroke={COLORS.wall}
              strokeWidth={4}
              strokeDasharray="8,4"
              strokeOpacity={0.8}
            />
          )}
          {tool === 'room' && (
            <rect
              x={Math.min(startWS.x, endWS.x)}
              y={Math.min(startWS.y, endWS.y)}
              width={Math.abs(endWS.x - startWS.x)}
              height={Math.abs(endWS.y - startWS.y)}
              fill={COLORS.room}
              fillOpacity={0.1}
              stroke={COLORS.room}
              strokeWidth={1.5}
              strokeDasharray="6,4"
            />
          )}
        </>
      )}

      {/* Start point indicator */}
      {drawing && startWS && (
        <circle cx={startWS.x} cy={startWS.y} r={4} fill={COLORS[tool]} opacity={0.8} />
      )}
    </svg>
  );
}
