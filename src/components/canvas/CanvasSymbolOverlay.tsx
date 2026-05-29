import React, { useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useProjectStore } from '../../store/projectStore';
import { SYMBOL_COMPONENTS } from '../symbols/SymbolSVGs';
import { worldToScreen, screenToWorld, snapToGrid } from '../../utils/canvasRenderer';

const SYMBOL_SIZE = 40;

interface Props {
  onDoubleClick?: (sym: import('../../types').SymbolInstance) => void;
}

export default function CanvasSymbolOverlay({ onDoubleClick }: Props = {}) {
  const viewport = useCanvasStore(s => s.viewport);
  const selectedIds = useCanvasStore(s => s.selectedIds);
  const setSelected = useCanvasStore(s => s.setSelected);
  const snap = useCanvasStore(s => s.snapToGrid);
  const gridSize = useCanvasStore(s => s.gridSize);
  const tool = useCanvasStore(s => s.tool);
  const symbols = useProjectStore(s => s.project.symbols);
  const updateSymbol = useProjectStore(s => s.updateSymbol);
  const removeSymbol = useProjectStore(s => s.removeSymbol);
  const draggingId = useRef<string | null>(null);

  const toWorld = (sx: number, sy: number) => {
    let wp = screenToWorld(sx, sy, viewport.x, viewport.y, viewport.zoom);
    if (snap) wp = { x: snapToGrid(wp.x, gridSize), y: snapToGrid(wp.y, gridSize) };
    return wp;
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (tool === 'delete') { removeSymbol(id); return; }
    if (tool !== 'select') return;
    e.stopPropagation();
    setSelected([id]);
    draggingId.current = id;
    // Double-click: open popup
    if (e.detail === 2 && onDoubleClick) {
      const sym = symbols.find(s => s.id === id);
      if (sym) onDoubleClick(sym);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId.current || e.buttons !== 1 || tool !== 'select') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const wp = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    updateSymbol(draggingId.current, { position: wp });
  };

  const handleMouseUp = () => { draggingId.current = null; };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {symbols.map(sym => {
        const sp = worldToScreen(sym.position.x, sym.position.y, viewport.x, viewport.y, viewport.zoom);
        const size = SYMBOL_SIZE * viewport.zoom;
        const half = size / 2;
        const isSelected = selectedIds.includes(sym.id);
        const SymComp = SYMBOL_COMPONENTS[sym.type];

        return (
          <div
            key={sym.id}
            className="absolute pointer-events-auto"
            style={{
              left: sp.x - half,
              top: sp.y - half,
              width: size,
              height: size,
              transform: `rotate(${sym.rotation}deg)`,
              cursor: tool === 'delete' ? 'not-allowed' : tool === 'select' ? (draggingId.current === sym.id ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={e => handleMouseDown(e, sym.id)}
          >
            {/* Selection ring */}
            {isSelected && (
              <div
                className="absolute inset-0 rounded border-2 border-[#00D4FF] z-10"
                style={{
                  boxShadow: '0 0 12px #00D4FF55',
                  margin: -3,
                  width: 'calc(100% + 6px)',
                  height: 'calc(100% + 6px)',
                }}
              />
            )}

            {/* Background */}
            <div
              className="absolute inset-0 rounded"
              style={{ backgroundColor: 'rgba(13,15,20,0.85)' }}
            />

            {/* SVG Symbol */}
            {SymComp ? (
              <div className="absolute inset-0 flex items-center justify-center p-0.5">
                <SymComp
                  size={size - 4}
                  color={isSelected ? '#00D4FF' : '#E2E8F0'}
                  strokeWidth={1.5 / viewport.zoom}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-mono font-bold text-white/60"
                  style={{ fontSize: Math.max(7, 8 * viewport.zoom) }}
                >
                  {sym.type.slice(0, 4).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Labels rendered separately, outside rotation */}
      {symbols.map(sym => {
        const sp = worldToScreen(sym.position.x, sym.position.y, viewport.x, viewport.y, viewport.zoom);
        const size = SYMBOL_SIZE * viewport.zoom;
        const half = size / 2;
        if (!sym.label && !sym.code) return null;

        return (
          <div
            key={`label-${sym.id}`}
            className="absolute pointer-events-none"
            style={{
              left: sp.x - half,
              top: sp.y + half + 2,
              width: size,
              textAlign: 'center',
            }}
          >
            <span
              className="font-mono text-[#00D4FF]"
              style={{ fontSize: Math.max(8, 9 * viewport.zoom) }}
            >
              {sym.label || sym.code}
            </span>
            {sym.code && sym.label && (
              <span
                className="font-mono text-white/30 block"
                style={{ fontSize: Math.max(7, 8 * viewport.zoom) }}
              >
                {sym.code}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
