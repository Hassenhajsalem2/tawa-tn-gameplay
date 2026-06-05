import React, { useEffect, useState } from 'react';
import { SpecialCard } from '@/types/game';

interface SpecialCardToastProps {
  card: SpecialCard;
  playerName: string;
  onDone: () => void;
}

const CARD_THEME: Record<string, {
  gradient: string;
  glow: string;
  border: string;
  accent: string;
  bg: string;
  flavorText: string;
}> = {
  peek_swap: {
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #a855f7 100%)',
    glow: 'rgba(99,102,241,0.7)',
    border: 'rgba(99,102,241,0.6)',
    accent: '#818cf8',
    bg: 'rgba(6,20,60,0.97)',
    flavorText: 'Sneaky peek… then a crafty swap!',
  },
  shuffle: {
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 60%, #a855f7 100%)',
    glow: 'rgba(249,115,22,0.7)',
    border: 'rgba(249,115,22,0.5)',
    accent: '#fb923c',
    bg: 'rgba(40,10,10,0.97)',
    flavorText: 'Cards go flying — chaos reigns!',
  },
  always_look: {
    gradient: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 60%, #c084fc 100%)',
    glow: 'rgba(34,211,238,0.7)',
    border: 'rgba(34,211,238,0.5)',
    accent: '#67e8f9',
    bg: 'rgba(2,20,35,0.97)',
    flavorText: 'Eyes wide open — knowledge is power!',
  },
  as_i_wish: {
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #f97316 100%)',
    glow: 'rgba(251,191,36,0.7)',
    border: 'rgba(251,191,36,0.5)',
    accent: '#fbbf24',
    bg: 'rgba(30,15,0,0.97)',
    flavorText: 'Your destiny is in my hands!',
  },
  play_again: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #0d9488 100%)',
    glow: 'rgba(16,185,129,0.7)',
    border: 'rgba(16,185,129,0.5)',
    accent: '#34d399',
    bg: 'rgba(2,20,15,0.97)',
    flavorText: 'Not done yet — play again!',
  },
  blocked: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 60%, #7f1d1d 100%)',
    glow: 'rgba(239,68,68,0.7)',
    border: 'rgba(239,68,68,0.5)',
    accent: '#f87171',
    bg: 'rgba(30,2,2,0.97)',
    flavorText: 'You\'re not going anywhere!',
  },
  pick_from_deck: {
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #4c1d95 100%)',
    glow: 'rgba(167,139,250,0.7)',
    border: 'rgba(167,139,250,0.5)',
    accent: '#c4b5fd',
    bg: 'rgba(15,5,40,0.97)',
    flavorText: 'Dig into the treasure!',
  },
  pass_it: {
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 60%, #6366f1 100%)',
    glow: 'rgba(6,182,212,0.7)',
    border: 'rgba(6,182,212,0.5)',
    accent: '#22d3ee',
    bg: 'rgba(2,15,30,0.97)',
    flavorText: 'Pass it along — nobody is safe!',
  },
  new_challenge: {
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #e879f9 50%, #a78bfa 100%)',
    glow: 'rgba(232,121,249,0.7)',
    border: 'rgba(232,121,249,0.5)',
    accent: '#f0abfc',
    bg: 'rgba(20,5,35,0.97)',
    flavorText: 'New challenge incoming!',
  },
  lucky_seven: {
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #10b981 100%)',
    glow: 'rgba(251,191,36,0.7)',
    border: 'rgba(251,191,36,0.5)',
    accent: '#fde68a',
    bg: 'rgba(20,15,2,0.97)',
    flavorText: '7 is your lucky number today!',
  },
  joker: {
    gradient: 'linear-gradient(135deg, #f472b6 0%, #a855f7 40%, #6366f1 70%, #22d3ee 100%)',
    glow: 'rgba(244,114,182,0.7)',
    border: 'rgba(244,114,182,0.5)',
    accent: '#f9a8d4',
    bg: 'rgba(20,5,25,0.97)',
    flavorText: 'The wild card strikes!',
  },
};

const DEFAULT_THEME = CARD_THEME.joker;

export const SpecialCardToast: React.FC<SpecialCardToastProps> = ({ card, playerName, onDone }) => {
  const [visible, setVisible] = useState(false);
  const theme = CARD_THEME[card.name] || DEFAULT_THEME;

  useEffect(() => {
    // Trigger entrance
    const enterTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    // Auto-dismiss after 2.8s
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 2800);
    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="special-card-toast-overlay"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Ambient glow behind the bar */}
      <div
        className="special-card-toast-glow"
        style={{ background: theme.glow }}
      />

      <div
        className="special-card-toast-bar"
        style={{ background: theme.bg, borderColor: theme.border }}
      >
        {/* Animated gradient top border */}
        <div
          className="special-card-toast-topline"
          style={{ background: theme.gradient }}
        />

        {/* Left: big icon */}
        <div
          className="special-card-toast-icon"
          style={{ textShadow: `0 0 20px ${theme.glow}` }}
        >
          {card.icon}
        </div>

        {/* Middle: card info */}
        <div className="special-card-toast-info">
          <div className="special-card-toast-player" style={{ color: theme.accent }}>
            {playerName} played
          </div>
          <div
            className="special-card-toast-name"
            style={{
              background: theme.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {card.displayName}
          </div>
          <div className="special-card-toast-tunisian">
            {card.tunisianName}
          </div>
          <div className="special-card-toast-flavor">
            {theme.flavorText}
          </div>
        </div>

        {/* Right: particles burst */}
        <div className="special-card-toast-particles">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="special-card-toast-particle"
              style={{
                background: theme.gradient,
                animationDelay: `${i * 0.08}s`,
                width: i % 2 === 0 ? '8px' : '5px',
                height: i % 2 === 0 ? '8px' : '5px',
                top: `${20 + i * 10}%`,
                right: `${10 + (i % 3) * 10}px`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
