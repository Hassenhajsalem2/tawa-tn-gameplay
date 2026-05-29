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
      <div className="bg-gradient-to-br from-red-900 to-orange-950 rounded-2xl border border-red-500/50 p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="text-6xl mb-4">{card.icon}</div>
        <h2 className="text-white font-black text-2xl mb-2">PUNISHMENT CARD</h2>
        <h3 className="text-orange-300 font-bold text-xl mb-4">{card.name}</h3>
        <p className="text-white/80 text-sm mb-6 bg-white/10 rounded-xl p-4">{card.action}</p>
        <p className="text-red-300 text-xs mb-6">🎯 Target: <strong>{loserName}</strong></p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
        >
          Accept Fate 😭
        </button>
      </div>
    </div>
  );
};
