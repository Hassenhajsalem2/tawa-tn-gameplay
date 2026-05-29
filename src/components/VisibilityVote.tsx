import React from 'react';
import { VisibilityMode } from '@/types/game';

interface VisibilityVoteProps {
  onSelect: (mode: VisibilityMode) => void;
}

const options: { mode: VisibilityMode; icon: string; title: string; desc: string }[] = [
  {
    mode: 'reveal_all',
    icon: '👁️',
    title: 'Reveal All',
    desc: 'See all your cards from the start',
  },
  {
    mode: 'reveal_two',
    icon: '👀',
    title: 'Reveal Two',
    desc: 'See 2 random cards at the start',
  },
  {
    mode: 'keep_hidden',
    icon: '🙈',
    title: 'Keep Hidden',
    desc: 'Full mystery! All cards face down',
  },
];

export const VisibilityVote: React.FC<VisibilityVoteProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl border border-purple-500/30 p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-white font-black text-xl mb-1">🎴 Choice Circle</h3>
          <p className="text-purple-200/60 text-sm">How much do you want to see?</p>
        </div>

        <div className="space-y-3">
          {options.map(opt => (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              className="w-full px-5 py-4 bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-400/40 rounded-xl transition-all group text-left flex items-center gap-4"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{opt.icon}</span>
              <div>
                <h4 className="text-white font-bold text-sm">{opt.title}</h4>
                <p className="text-white/40 text-xs">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
