import React from 'react';
import { GameCard, NumberCard, SpecialCard } from '@/types/game';

interface CardProps {
  card: GameCard;
  faceDown?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  small?: boolean;
  glowing?: boolean;
}

const colorMap: Record<string, string> = {
  red: 'from-red-600 to-red-800 border-red-400',
  blue: 'from-blue-600 to-blue-800 border-blue-400',
  green: 'from-emerald-600 to-emerald-800 border-emerald-400',
  yellow: 'from-amber-500 to-amber-700 border-amber-400',
};

const colorTextMap: Record<string, string> = {
  red: 'text-red-200',
  blue: 'text-blue-200',
  green: 'text-emerald-200',
  yellow: 'text-amber-200',
};

const colorDotMap: Record<string, string> = {
  red: '🔴',
  blue: '🔵',
  green: '🟢',
  yellow: '🟡',
};

export const Card: React.FC<CardProps> = ({
  card,
  faceDown = false,
  selected = false,
  highlighted = false,
  onClick,
  small = false,
  glowing = false,
}) => {
  const baseClasses = `
    relative rounded-xl border-2 cursor-pointer select-none
    transition-all duration-300 transform
    ${small ? 'w-16 h-24 text-xs' : 'w-20 h-32 text-sm'}
    ${selected ? 'ring-4 ring-yellow-400 scale-110 -translate-y-2 shadow-lg shadow-yellow-400/50' : ''}
    ${highlighted ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/30' : ''}
    ${glowing ? 'animate-pulse ring-2 ring-purple-400 shadow-lg shadow-purple-500/50' : ''}
    ${onClick ? 'hover:scale-105 hover:-translate-y-1 active:scale-95' : ''}
  `;

  if (faceDown) {
    return (
      <div
        className={`${baseClasses} bg-gradient-to-br from-indigo-900 to-purple-950 border-indigo-500/50`}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl opacity-50">🌙</div>
        </div>
        <div className="absolute inset-1 border border-indigo-500/20 rounded-lg" />
        <div className="absolute inset-2 border border-indigo-500/10 rounded-md flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-400/30 rounded-full" />
        </div>
      </div>
    );
  }

  if (card.type === 'number') {
    const numCard = card as NumberCard;
    return (
      <div
        className={`${baseClasses} bg-gradient-to-br ${colorMap[numCard.color]} shadow-lg`}
        onClick={onClick}
      >
        <div className="absolute top-1 left-1.5 font-bold text-white/90 text-xs">
          {numCard.number}
        </div>
        <div className="absolute bottom-1 right-1.5 font-bold text-white/90 text-xs rotate-180">
          {numCard.number}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black ${small ? 'text-2xl' : 'text-3xl'} text-white drop-shadow-lg`}>
            {numCard.number}
          </span>
          <span className="text-xs mt-0.5">{colorDotMap[numCard.color]}</span>
        </div>
        <div className={`absolute bottom-1 left-0 right-0 text-center text-[9px] font-medium ${colorTextMap[numCard.color]} uppercase tracking-wider`}>
          {numCard.color}
        </div>
      </div>
    );
  }

  // Special card
  const specCard = card as SpecialCard;
  return (
    <div
      className={`${baseClasses} bg-gradient-to-br from-purple-700 to-fuchsia-900 border-purple-400 shadow-lg shadow-purple-500/20`}
      onClick={onClick}
    >
      <div className="absolute top-0.5 left-1 text-[10px] text-purple-200">★</div>
      <div className="absolute bottom-0.5 right-1 text-[10px] text-purple-200 rotate-180">★</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1">
        <span className={`${small ? 'text-xl' : 'text-2xl'}`}>{specCard.icon}</span>
        <span className={`font-bold text-white text-center leading-tight ${small ? 'text-[8px]' : 'text-[10px]'}`}>
          {specCard.displayName}
        </span>
        <span className={`text-purple-300 text-center leading-tight ${small ? 'text-[6px]' : 'text-[7px]'}`}>
          {specCard.tunisianName}
        </span>
      </div>
    </div>
  );
};

export const CardBack: React.FC<{ small?: boolean; onClick?: () => void; count?: number }> = ({ small, onClick, count }) => (
  <div
    className={`
      relative rounded-xl border-2 cursor-pointer select-none
      bg-gradient-to-br from-indigo-900 to-purple-950 border-indigo-500/50
      transition-all duration-200 hover:scale-105
      ${small ? 'w-14 h-20' : 'w-20 h-32'}
    `}
    onClick={onClick}
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`${small ? 'text-lg' : 'text-2xl'} opacity-60`}>🌙</div>
    </div>
    <div className="absolute inset-1 border border-indigo-500/20 rounded-lg" />
    {count !== undefined && (
      <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border border-indigo-400">
        {count}
      </div>
    )}
  </div>
);
