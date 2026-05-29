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
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Draw Pile */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Draw</span>
        <div
          className={`relative ${canDraw ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          onClick={canDraw ? onDraw : undefined}
        >
          <CardBack count={drawPileCount} />
          {canDraw && (
            <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/50 animate-pulse" />
          )}
        </div>
        {canDraw && (
          <span className="text-cyan-300 text-[10px] animate-pulse">Click to draw</span>
        )}
      </div>

      {/* Message */}
      <div className="max-w-xs text-center">
        <div className="bg-white/5 backdrop-blur rounded-xl px-4 py-2 border border-white/10">
          <p className="text-white text-xs leading-relaxed">{message}</p>
        </div>
      </div>

      {/* Discard Pile */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Discard</span>
        {topDiscard ? (
          <Card card={topDiscard} />
        ) : (
          <div className="w-20 h-32 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-xs">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
};
