import React from 'react';
import { ChallengeCard } from '@/types/game';

interface ChallengeBannerProps {
  challenge: ChallengeCard;
  round: number;
  maxRounds: number;
}

export const ChallengeBanner: React.FC<ChallengeBannerProps> = ({ challenge, round, maxRounds }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-sm rounded-xl border border-purple-500/30 px-4 py-2.5 shadow-lg">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-black text-sm tracking-wide">
                {challenge.tunisianName}
              </h3>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                +{challenge.points} pts
              </span>
            </div>
            <p className="text-purple-200/80 text-[11px] mt-0.5">
              {challenge.condition}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-cyan-300/70 uppercase tracking-wider font-bold">Round</div>
          <div className="text-white font-black text-lg leading-tight">{round}/{maxRounds}</div>
        </div>
      </div>
    </div>
  );
};
