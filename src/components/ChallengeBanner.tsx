import React, { useEffect, useState } from 'react';
import { ChallengeCard } from '@/types/game';

interface ChallengeBannerProps {
  challenge: ChallengeCard;
  round: number;
  maxRounds: number;
}

/** Map challenge point values → tier (1-5 dots) */
function getTier(points: number): number {
  if (points >= 50) return 5;
  if (points >= 40) return 4;
  if (points >= 30) return 3;
  if (points >= 20) return 2;
  return 1;
}

/** Pick a decorative emoji hint based on keywords in the condition */
function getCategoryHint(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('red')) return '🔴';
  if (c.includes('special')) return '✨';
  if (c.includes('pair') || c.includes('same')) return '🃏';
  if (c.includes('odd')) return '🔢';
  if (c.includes('even')) return '🔢';
  if (c.includes('consecutive') || c.includes('sequence')) return '📈';
  if (c.includes('highest') || c.includes('most')) return '🏅';
  if (c.includes('lowest') || c.includes('fewest')) return '🎯';
  if (c.includes('different')) return '🌈';
  if (c.includes('no cards') || c.includes('empty')) return '💨';
  return '🎲';
}

export const ChallengeBanner: React.FC<ChallengeBannerProps> = ({ challenge, round, maxRounds }) => {
  const [animate, setAnimate] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Re-trigger entrance animation whenever challenge changes
  useEffect(() => {
    setAnimate(false);
    setExpanded(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(t);
  }, [challenge.tunisianName]);

  const tier = getTier(challenge.points);
  const categoryHint = getCategoryHint(challenge.condition);

  return (
    <div
      className="challenge-banner-wrap"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
      onClick={() => setExpanded(e => !e)}
      title="Click to expand challenge details"
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
              <span
                style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  marginLeft: '2px',
                }}
              >
                {categoryHint}
              </span>
            </div>

            <h2 className="challenge-title">{challenge.tunisianName}</h2>

            {/* Collapsed: single-line condition preview */}
            {!expanded && (
              <p className="challenge-condition">
                {challenge.condition}
                <span style={{ color: 'rgba(167,139,250,0.5)', marginLeft: '4px', fontSize: '9px' }}>
                  ▾ tap
                </span>
              </p>
            )}

            {/* Expanded: full condition + tier bar */}
            {expanded && (
              <div className="challenge-condition-full">
                <span style={{ marginRight: '6px' }}>{categoryHint}</span>
                {challenge.condition}
                <div className="challenge-tier-bar">
                  <span style={{ fontSize: '8px', color: 'rgba(251,191,36,0.6)', fontWeight: 700, marginRight: '4px' }}>
                    REWARD
                  </span>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`challenge-tier-dot${i <= tier ? ' filled' : ''}`}
                    />
                  ))}
                  <span style={{ fontSize: '8px', color: 'rgba(251,191,36,0.7)', fontWeight: 700, marginLeft: '4px' }}>
                    {tier === 5 ? 'LEGENDARY' : tier === 4 ? 'EPIC' : tier === 3 ? 'RARE' : tier === 2 ? 'UNCOMMON' : 'BASIC'}
                  </span>
                </div>
                <p style={{ fontSize: '8px', color: 'rgba(167,139,250,0.4)', marginTop: '4px', fontStyle: 'italic' }}>
                  ▴ tap to collapse
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right — points badge */}
        <div className="challenge-points-badge">
          <span className="challenge-points-value">+{challenge.points}</span>
          <span className="challenge-points-label">pts</span>
        </div>
      </div>
    </div>
  );
};
