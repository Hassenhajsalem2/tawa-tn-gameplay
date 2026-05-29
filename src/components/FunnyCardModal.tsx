import React from 'react';
import { FunnyCard } from '@/types/game';

interface FunnyCardModalProps {
  card: FunnyCard;
  loserName: string;
  onClose: () => void;
}

export const FunnyCardModal: React.FC<FunnyCardModalProps> = ({ card, loserName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-950 to-pink-950 rounded-2xl border border-red-500/30 p-8 max-w-sm w-full text-center shadow-2xl shadow-red-500/20 animate-[bounce_0.5s_ease-in-out]">
        <div className="text-6xl mb-4">{card.icon}</div>
        <h3 className="text-red-300 text-xs uppercase tracking-widest font-bold mb-2">
          PUNISHMENT CARD
        </h3>
        <h2 className="text-white font-black text-2xl mb-3">{card.name}</h2>
        <p className="text-red-200/80 text-sm mb-2 leading-relaxed">
          {card.action}
        </p>
        <p className="text-yellow-300 text-xs font-bold mb-5">
          🎯 Target: {loserName}
        </p>

        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Accept Fate 😭
        </button>
      </div>
    </div>
  );
};
