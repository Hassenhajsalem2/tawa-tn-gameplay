import React from 'react';
import { CardBack } from './Card';
import { Card } from './Card';
import { GameCard } from '@/types/game';

interface ActionPanelProps {
  drawPileCount: number;
  topDiscard: GameCard | null;
  onDraw: () => void;
  canDraw: boolean;
  message: string;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  drawPileCount,
  topDiscard,
  onDraw,
  canDraw,
  message,
}) => {
  const isSpecialOnTop = topDiscard?.type === 'special';

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Draw Pile */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Draw</span>
        <div className="relative">
          <CardBack
            count={drawPileCount}
            onClick={canDraw ? onDraw : undefined}
          />
          {canDraw && (
            <div className="absolute -inset-1 rounded-xl border-2 border-cyan-400 animate-pulse pointer-events-none" />
          )}
        </div>
        {canDraw && (
          <span className="text-cyan-300 text-[10px] font-bold animate-bounce">Click to draw</span>
        )}
      </div>

      {/* Message */}
      <div className="flex-1 text-center max-w-48">
        <p className="text-white/80 text-sm font-semibold leading-tight">{message}</p>
      </div>

      {/* Discard Pile */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Discard</span>
        {topDiscard ? (
          <div className="relative">
            {/* Special card glow ring */}
            {isSpecialOnTop && (
              <div
                className="absolute -inset-2 rounded-2xl pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, #a855f7, #f472b6, #fbbf24, #22d3ee, #a855f7)',
                  animation: 'borderRotate 2s linear infinite',
                  opacity: 0.55,
                  filter: 'blur(5px)',
                }}
              />
            )}
            <Card card={topDiscard} />
            {/* SPECIAL badge */}
            {isSpecialOnTop && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #a855f7, #f472b6)',
                  color: 'white',
                  boxShadow: '0 0 10px rgba(168,85,247,0.6)',
                  letterSpacing: '0.08em',
                }}
              >
                ✨ SPECIAL
              </div>
            )}
          </div>
        ) : (
          <div className="w-16 h-[88px] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 text-xs">
            Empty
          </div>
        )}
      </div>
    </div>
  );
};
