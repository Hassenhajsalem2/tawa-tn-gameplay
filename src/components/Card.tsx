import React from 'react';
import { GameCard, NumberCard, SpecialCard } from '@/types/game';

interface CardProps {
  card: GameCard;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  highlighted?: boolean;
  glowing?: boolean;
  small?: boolean;
}

const colorMap: Record<string, string> = {
  red: 'from-red-500 to-rose-700 border-red-400',
  blue: 'from-blue-500 to-indigo-700 border-blue-400',
  green: 'from-emerald-500 to-green-700 border-emerald-400',
  yellow: 'from-yellow-400 to-amber-600 border-yellow-300',
};

const colorDotMap: Record<string, string> = {
  red: '🔴',
  blue: '🔵',
  green: '🟢',
  yellow: '🟡',
};

export const Card: React.FC<CardProps> = ({
  card,
  faceDown,
  selected,
  onClick,
  highlighted,
  glowing,
  small,
}) => {
  if (faceDown) {
    return (
      <div
        onClick={onClick}
        className={`
          relative rounded-xl border-2 cursor-pointer select-none transition-all duration-200
          bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-500/50
          ${small ? 'w-10 h-14' : 'w-16 h-22'}
          ${selected ? 'ring-2 ring-yellow-400 -translate-y-2 shadow-lg shadow-yellow-500/30' : ''}
          ${highlighted ? 'hover:-translate-y-1 hover:shadow-lg hover:border-cyan-400/60' : ''}
          ${glowing ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40' : ''}
        `}
      >
        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-60">
          🌙
        </div>
        <div className="absolute inset-1 rounded-lg border border-purple-400/20" />
      </div>
    );
  }

  if (card.type === 'number') {
    const numCard = card as NumberCard;
    const grad = colorMap[numCard.color] || 'from-gray-500 to-gray-700 border-gray-400';

    return (
      <div
        onClick={onClick}
        className={`
          relative rounded-xl border-2 cursor-pointer select-none transition-all duration-200
          bg-gradient-to-br ${grad}
          ${small ? 'w-10 h-14' : 'w-16 h-[88px]'}
          ${selected ? 'ring-2 ring-yellow-400 -translate-y-3 shadow-xl shadow-yellow-500/40' : ''}
          ${highlighted ? 'hover:-translate-y-1.5 hover:shadow-xl' : ''}
          ${glowing ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40' : ''}
        `}
      >
        {/* Top number */}
        <div className={`absolute top-1 left-1.5 font-black text-white leading-none ${small ? 'text-xs' : 'text-sm'}`}>
          {numCard.number}
        </div>
        {/* Center number */}
        <div className={`absolute inset-0 flex items-center justify-center font-black text-white/90 ${small ? 'text-lg' : 'text-3xl'}`}>
          {numCard.number}
        </div>
        {/* Bottom */}
        {!small && (
          <div className="absolute bottom-1 right-1.5 flex flex-col items-end gap-0.5">
            <span className="font-black text-white text-sm leading-none rotate-180">{numCard.number}</span>
            <span className="text-[10px]">{colorDotMap[numCard.color]}</span>
          </div>
        )}
      </div>
    );
  }

  // Special card
  const specCard = card as SpecialCard;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border-2 cursor-pointer select-none transition-all duration-200
        bg-gradient-to-br from-violet-800 to-purple-950 border-violet-400/70
        ${small ? 'w-10 h-14' : 'w-16 h-[88px]'}
        ${selected ? 'ring-2 ring-yellow-400 -translate-y-3 shadow-xl shadow-yellow-500/40' : ''}
        ${highlighted ? 'hover:-translate-y-1.5 hover:shadow-xl hover:border-violet-300' : ''}
        ${glowing ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40' : ''}
      `}
    >
      {/* Star corners */}
      <div className="absolute top-0.5 left-1 text-[8px] text-violet-300/60">★</div>
      <div className="absolute bottom-0.5 right-1 text-[8px] text-violet-300/60 rotate-180">★</div>

      {/* Icon */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 ${small ? '' : 'pt-1'}`}>
        <span className={small ? 'text-base' : 'text-xl'}>{specCard.icon}</span>
        {!small && (
          <>
            <span className="text-white font-bold text-[9px] text-center leading-tight px-0.5 line-clamp-2">
              {specCard.displayName}
            </span>
            <span className="text-violet-300 text-[7px] text-center leading-tight italic px-0.5">
              {specCard.tunisianName}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export const CardBack: React.FC<{
  small?: boolean;
  onClick?: () => void;
  count?: number;
}> = ({ small, onClick, count }) => (
  <div
    onClick={onClick}
    className={`
      relative rounded-xl border-2 border-purple-500/50 cursor-pointer select-none
      bg-gradient-to-br from-indigo-900 to-purple-900 transition-all duration-200
      ${small ? 'w-9 h-12' : 'w-16 h-[88px]'}
      ${onClick ? 'hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-lg' : ''}
    `}
  >
    <div className={`absolute inset-0 flex items-center justify-center opacity-60 ${small ? 'text-base' : 'text-2xl'}`}>
      🌙
    </div>
    <div className="absolute inset-1 rounded-lg border border-purple-400/20" />
    {count !== undefined && (
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg">
        {count}
      </div>
    )}
  </div>
);
