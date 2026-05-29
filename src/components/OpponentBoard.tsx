import React from 'react';
import { Player } from '@/types/game';
import { CardBack } from './Card';

interface OpponentBoardProps {
  player: Player;
  isActive: boolean;
  isTargetable: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export const OpponentBoard: React.FC<OpponentBoardProps> = ({
  player,
  isActive,
  isTargetable,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300
        ${isActive ? 'bg-cyan-500/10 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20' : 'bg-white/5'}
        ${isTargetable ? 'cursor-pointer hover:bg-purple-500/10 hover:ring-2 hover:ring-purple-400/50' : ''}
        ${isSelected ? 'ring-2 ring-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/20' : ''}
        ${player.isBlocked ? 'opacity-60' : ''}
      `}
      onClick={isTargetable ? onSelect : undefined}
    >
      {/* Status indicators */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{player.isBot ? '🤖' : '👤'}</span>
        <span className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-white/80'}`}>
          {player.name}
        </span>
        {player.isBlocked && <span className="text-xs">🚫</span>}
      </div>

      {/* Score */}
      <div className="text-[10px] text-amber-400 font-semibold">
        ⭐ {player.score} pts
      </div>

      {/* Cards */}
      <div className="flex gap-1">
        {player.hand.map((card, i) => (
          <CardBack key={card.id || i} small />
        ))}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
      )}

      {isTargetable && (
        <div className="text-[9px] text-purple-300 mt-0.5">Click to target</div>
      )}
    </div>
  );
};
