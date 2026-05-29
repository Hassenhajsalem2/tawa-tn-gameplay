import React from 'react';
import { Player } from '@/types/game';

interface ScoreboardProps {
  players: Player[];
  roundWinner: string | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players, roundWinner }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 max-w-sm w-full mx-auto">
      <h3 className="text-white font-bold text-center text-lg mb-4 flex items-center justify-center gap-2">
        🏆 Scoreboard
      </h3>

      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
              ${p.id === roundWinner ? 'bg-amber-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-white/5'}
              ${i === 0 ? 'ring-1 ring-amber-400/30' : ''}
            `}
          >
            <span className="text-lg w-8 text-center">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span className="text-white font-bold text-sm flex-1">{p.name}</span>
            <span className="text-amber-400 font-black text-sm">{p.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
