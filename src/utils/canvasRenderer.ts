import type { PipeSegment, SymbolInstance, Point } from '../types';

export const PIPE_STYLES: Record<string, { color: string; width: number; dash: number[] }> = {
  main: { color: '#00D4FF', width: 3, dash: [] },
  secondary: { color: '#FFFFFF', width: 2, dash: [] },
  service: { color: '#7C8DB0', width: 1.5, dash: [6, 4] },
  return: { color: '#FF6B35', width: 1.5, dash: [10, 4] },
  custom: { color: '#00FF9D', width: 2, dash: [] },
};

export function worldToScreen(wx: number, wy: number, vx: number, vy: number, zoom: number): Point {
  return { x: wx * zoom + vx, y: wy * zoom + vy };
}

export function screenToWorld(sx: number, sy: number, vx: number, vy: number, zoom: number): Point {
  return { x: (sx - vx) / zoom, y: (sy - vy) / zoom };
}

export function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vx: number,
  vy: number,
  zoom: number,
  gridSize: number,
  isometric: boolean
) {
  ctx.save();
  const scaledGrid = gridSize * zoom;
  const offsetX = ((vx % scaledGrid) + scaledGrid) % scaledGrid;
  const offsetY = ((vy % scaledGrid) + scaledGrid) % scaledGrid;

  if (!isometric) {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;

    // Minor grid
    for (let x = offsetX; x < width; x += scaledGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += scaledGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Major grid (every 5 cells)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    const majorGrid = scaledGrid * 5;
    const majorOffsetX = ((vx % majorGrid) + majorGrid) % majorGrid;
    const majorOffsetY = ((vy % majorGrid) + majorGrid) % majorGrid;
    for (let x = majorOffsetX; x < width; x += majorGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = majorOffsetY; y < height; y += majorGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else {
    // Isometric grid
    ctx.strokeStyle = 'rgba(0,212,255,0.07)';
    ctx.lineWidth = 0.5;
    const step = scaledGrid;
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);
    for (let i = -100; i < 200; i++) {
      const startX = i * step + offsetX;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX + height * cos30 / sin30, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX - height * cos30 / sin30, height);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: PipeSegment,
  vx: number,
  vy: number,
  zoom: number,
  selected: boolean,
  result?: { status: 'ok' | 'warning' | 'critical' } | null
) {
  const style = PIPE_STYLES[pipe.type] ?? PIPE_STYLES.main;
  const color = pipe.color ?? style.color;
  const width = (pipe.strokeWidth ?? style.width) * zoom;
  const dash = style.dash.map(d => d * zoom);

  const sx = worldToScreen(pipe.start.x, pipe.start.y, vx, vy, zoom);
  const ex = worldToScreen(pipe.end.x, pipe.end.y, vx, vy, zoom);

  ctx.save();

  if (selected) {
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 12;
  }

  if (result) {
    const statusColors = { ok: '#00FF9D', warning: '#FFBB00', critical: '#FF4444' };
    ctx.shadowColor = statusColors[result.status];
    ctx.shadowBlur = 8;
  }

  ctx.beginPath();
  ctx.strokeStyle = selected ? '#00D4FF' : color;
  ctx.lineWidth = selected ? width + 1 : width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);

  // L-shaped routing
  const midX = ex.x;
  const midY = sx.y;
  ctx.moveTo(sx.x, sx.y);
  ctx.lineTo(midX, midY);
  ctx.lineTo(ex.x, ex.y);
  ctx.stroke();

  // Direction arrow
  const dx = ex.x - sx.x;
  const dy = ex.y - sx.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 40) {
    const mx = (sx.x + ex.x) / 2;
    const my = (sx.y + ex.y) / 2;
    const nx = dx / len;
    const ny = dy / len;
    const arrowSize = 8;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = selected ? '#00D4FF' : color;
    ctx.moveTo(mx + nx * arrowSize, my + ny * arrowSize);
    ctx.lineTo(mx - nx * arrowSize - ny * arrowSize * 0.5, my - ny * arrowSize + nx * arrowSize * 0.5);
    ctx.lineTo(mx - nx * arrowSize + ny * arrowSize * 0.5, my - ny * arrowSize - nx * arrowSize * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Label
  if (pipe.name) {
    const lx = (sx.x + ex.x) / 2 + 6;
    const ly = (sx.y + ex.y) / 2 - 6;
    ctx.setLineDash([]);
    ctx.font = `${10 * zoom}px 'JetBrains Mono'`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(pipe.name, lx, ly);
  }

  // Endpoints
  ctx.setLineDash([]);
  [sx, ex].forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4 * zoom, 0, Math.PI * 2);
    ctx.fillStyle = selected ? '#00D4FF' : color + '88';
    ctx.fill();
  });

  ctx.restore();
}

export function drawSymbolOnCanvas(
  ctx: CanvasRenderingContext2D,
  sym: SymbolInstance,
  vx: number,
  vy: number,
  zoom: number,
  selected: boolean,
  symbolSize = 40
) {
  const sp = worldToScreen(sym.position.x, sym.position.y, vx, vy, zoom);
  const size = symbolSize * zoom;
  const half = size / 2;

  ctx.save();
  ctx.translate(sp.x, sp.y);
  ctx.rotate((sym.rotation * Math.PI) / 180);

  if (selected) {
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 1.5 * zoom;
    ctx.strokeRect(-half - 4, -half - 4, size + 8, size + 8);
  }

  // Background
  ctx.fillStyle = '#141720CC';
  ctx.fillRect(-half, -half, size, size);

  // Placeholder box (actual SVG rendering via DOM overlay)
  ctx.strokeStyle = selected ? '#00D4FF' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1 * zoom;
  ctx.strokeRect(-half, -half, size, size);

  // Symbol type label
  ctx.font = `bold ${7 * zoom}px 'JetBrains Mono'`;
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sym.type.replace(/_/g, ' ').toUpperCase().slice(0, 6), 0, 0);

  // Label below
  if (sym.label || sym.code) {
    ctx.rotate((-sym.rotation * Math.PI) / 180);
    ctx.font = `${8 * zoom}px 'JetBrains Mono'`;
    ctx.fillStyle = '#00D4FF';
    ctx.fillText(sym.label || sym.code, 0, half + 10 * zoom);
  }

  ctx.restore();
}

export function hitTestPipe(pipe: PipeSegment, point: Point, tolerance = 8): boolean {
  const { start, end } = pipe;
  // Test against L-shape segments
  const segments = [
    { a: start, b: { x: end.x, y: start.y } },
    { a: { x: end.x, y: start.y }, b: end },
  ];
  return segments.some(seg => pointToSegmentDistance(point, seg.a, seg.b) < tolerance);
}

export function hitTestSymbol(sym: SymbolInstance, point: Point, size = 40): boolean {
  const half = size / 2;
  return (
    point.x >= sym.position.x - half &&
    point.x <= sym.position.x + half &&
    point.y >= sym.position.y - half &&
    point.y <= sym.position.y + half
  );
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
