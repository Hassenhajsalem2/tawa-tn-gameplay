import React, { useEffect, useState } from 'react';
import { ChallengeCard } from '@/types/game';

interface ChallengeBannerProps {
  challenge: ChallengeCard;
  round: number;
  maxRounds: number;
}

export const ChallengeBanner: React.FC<ChallengeBannerProps> = ({ challenge, round, maxRounds }) => {
  const [animate, setAnimate] = useState(false);

  // Re-trigger entrance animation whenever challenge changes
  useEffect(() => {
    setAnimate(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(t);
  }, [challenge.tunisianName]);

  return (
    <div
      className="challenge-banner-wrap"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {/* Animated glow border */}
      <div className="challenge-banner-glow" />

      <div className="challenge-banner-inner">
        {/* Left — trophy + text */}
        <div className="challenge-banner-left">
          <div className="challenge-trophy">🏆</div>
          <div className="challenge-text-group">
            <div className="challenge-label-row">
              <span className="challenge-label">CHALLENGE</span>
              <span className="challenge-round-badge">Round {round}/{maxRounds}</span>
            </div>
            <h2 className="challenge-title">{challenge.tunisianName}</h2>
            <p className="challenge-condition">{challenge.condition}</p>
          </div>
        </div>

        {/* Right — points */}
        <div className="challenge-points-badge">
          <span className="challenge-points-value">+{challenge.points}</span>
          <span className="challenge-points-label">pts</span>
        </div>
      </div>
    </div>
  );
};
