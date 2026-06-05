import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { ChallengeBanner } from './ChallengeBanner';
import { PlayerHand } from './PlayerHand';
import { OpponentBoard } from './OpponentBoard';
import { ActionPanel } from './ActionPanel';
import { TawaButton } from './TawaButton';
import { EffectModal } from './EffectModal';
import { VisibilityVote } from './VisibilityVote';
import { Scoreboard } from './Scoreboard';
import { FunnyCardModal } from './FunnyCardModal';
import { RulesModal } from './RulesModal';
import { SpecialCardToast } from './SpecialCardToast';
import { SpecialCard } from '@/types/game';
import {
  useAudio,
  sfxChallengeReveal,
  sfxDrawCard,
  sfxDiscardCard,
  sfxTawa,
  sfxRoundWin,
  sfxGameOver,
  sfxYourTurn,
  sfxClick,
} from '@/lib/useAudio';

export const GameBoard: React.FC = () => {
  const store = useGameStore();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showChallengeReveal, setShowChallengeReveal] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Special card toast
  const [specialToast, setSpecialToast] = useState<{ card: SpecialCard; playerName: string } | null>(null);
  const prevDiscardTopRef = useRef<string | null>(null);

  const currentUserId = useRoomStore(s => s.userId);
  const isHost = useRoomStore(s => s.isHost);

  // ── Audio ──
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx, initAudio } = useAudio();
  const audioInitRef = useRef(false);
  const prevPhaseRef = useRef(store.phase);
  const prevPlayerIndexRef = useRef(store.currentPlayerIndex);
  const prevHasDrawnRef = useRef(store.hasDrawn);
  const prevHasDiscardedRef = useRef(store.hasDiscarded);

  // Safely handle players array (defensive against Firebase serialization)
  const players = Array.isArray(store.players) ? store.players : [];
  const drawPile = Array.isArray(store.drawPile) ? store.drawPile : [];
  const discardPile = Array.isArray(store.discardPile) ? store.discardPile : [];

  // ── KEY FIX: Each player sees THEIR OWN hand ──
  const humanPlayer = isHost
    ? players.find(p => p.id === 'player-human')
    : players.find(p => p.id === currentUserId);

  const opponents = players.filter(p => p.id !== humanPlayer?.id);
  const currentPlayer = players[store.currentPlayerIndex];
  const isHumanTurn = currentPlayer && currentPlayer.id === humanPlayer?.id;

  // ── Init audio on first human interaction ──
  const handleFirstInteraction = () => {
    if (!audioInitRef.current) {
      audioInitRef.current = true;
      initAudio();
    }
  };

  // ── SFX: fire on state changes ──
  useEffect(() => {
    const phase = store.phase;
    const prevPhase = prevPhaseRef.current;

    if (phase !== prevPhase) {
      if (phase === 'draw_challenge') sfxChallengeReveal();
      if (phase === 'tawa_called') sfxTawa();
      if (phase === 'game_end') sfxGameOver();
      if (phase === 'round_end' && prevPhase === 'tawa_called') sfxRoundWin();
      prevPhaseRef.current = phase;
    }
  }, [store.phase]);

  useEffect(() => {
    if (store.hasDrawn && !prevHasDrawnRef.current) sfxDrawCard();
    prevHasDrawnRef.current = store.hasDrawn;
  }, [store.hasDrawn]);

  useEffect(() => {
    if (store.hasDiscarded && !prevHasDiscardedRef.current) sfxDiscardCard();
    prevHasDiscardedRef.current = store.hasDiscarded;
  }, [store.hasDiscarded]);

  useEffect(() => {
    if (
      store.currentPlayerIndex !== prevPlayerIndexRef.current &&
      isHumanTurn &&
      store.phase === 'playing'
    ) {
      sfxYourTurn();
    }
    prevPlayerIndexRef.current = store.currentPlayerIndex;
  }, [store.currentPlayerIndex, isHumanTurn, store.phase]);

  // ── Challenge reveal animation — ONLY auto-advance on host side ──
  useEffect(() => {
    if (store.phase === 'draw_challenge') {
      setShowChallengeReveal(true);
      if (isHost) {
        const timer = setTimeout(() => {
          setShowChallengeReveal(false);
          useGameStore.setState({ phase: 'choice_circle' });
        }, 2500);
        return () => clearTimeout(timer);
      }
    } else {
      setShowChallengeReveal(false);
    }
  }, [store.phase, store.round, isHost]);

  // ── Bot turn processing — Host only ──
  useEffect(() => {
    if (isHost && store.phase === 'playing' && currentPlayer?.isBot && !store.pendingEffect) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = setTimeout(() => {
        useGameStore.getState().processBotTurn();
      }, 700 + Math.random() * 500);
      return () => {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
      };
    }
  }, [store.phase, store.currentPlayerIndex, currentPlayer?.isBot, store.pendingEffect, isHost]);

  // ── Auto-advance blocked human player's turn ──
  useEffect(() => {
    if (
      store.phase === 'playing' &&
      isHumanTurn &&
      humanPlayer?.isBlocked &&
      !store.hasDrawn &&
      !store.pendingEffect
    ) {
      const timer = setTimeout(() => {
        useGameStore.getState().performDraw();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [store.phase, isHumanTurn, humanPlayer?.isBlocked, store.hasDrawn, store.pendingEffect]);

  // ── Reset selected card when turn changes ──
  useEffect(() => {
    setSelectedCardIndex(null);
  }, [store.currentPlayerIndex]);

  // ── Special card toast: fire when discard top changes to a special card ──
  useEffect(() => {
    const top = discardPile[0];
    if (!top) return;
    if (top.id === prevDiscardTopRef.current) return;
    prevDiscardTopRef.current = top.id;
    if (top.type === 'special' && store.phase === 'playing') {
      // Find who just played (the previous player — currentPlayerIndex already advanced)
      const playerCount = players.length;
      const prevIdx = (store.currentPlayerIndex - 1 + playerCount) % playerCount;
      const playerName = players[prevIdx]?.name || 'Someone';
      setSpecialToast({ card: top as SpecialCard, playerName });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discardPile[0]?.id]);

  // ─── Audio Controls UI ───────────────────────────────────────────────────
  const AudioControls = () => (
    <div className="audio-controls">
      <button
        className={`audio-btn ${musicEnabled ? 'active' : 'muted'}`}
        onClick={() => { sfxClick(); toggleMusic(); }}
        title={musicEnabled ? 'Mute Music' : 'Unmute Music'}
      >
        {musicEnabled ? '🎵' : '🔇'}
      </button>
      <button
        className={`audio-btn ${sfxEnabled ? 'active' : 'muted'}`}
        onClick={() => { toggleSfx(); }}
        title={sfxEnabled ? 'Mute SFX' : 'Unmute SFX'}
      >
        {sfxEnabled ? '🔊' : '🔕'}
      </button>
    </div>
  );

  // ─── Challenge reveal overlay ────────────────────────────────────────────
  if (showChallengeReveal && store.currentChallenge) {
    const particles = [
      { color: '#a855f7', left: '10%', top: '20%', delay: '0s' },
      { color: '#fbbf24', left: '85%', top: '15%', delay: '0.3s' },
      { color: '#22d3ee', left: '20%', top: '75%', delay: '0.5s' },
      { color: '#f472b6', left: '75%', top: '70%', delay: '0.8s' },
      { color: '#a3e635', left: '50%', top: '10%', delay: '1s' },
      { color: '#f97316', left: '40%', top: '85%', delay: '0.2s' },
      { color: '#818cf8', left: '60%', top: '30%', delay: '0.6s' },
      { color: '#fb7185', left: '30%', top: '50%', delay: '1.2s' },
    ];

    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 z-50 flex items-center justify-center"
        style={{ animation: 'fadeIn 0.4s ease-out' }}
      >
        {/* Floating particles */}
        <div className="challenge-reveal-particles">
          {particles.map((p, i) => (
            <div
              key={i}
              className="challenge-reveal-particle"
              style={{
                left: p.left,
                top: p.top,
                background: p.color,
                animationDelay: p.delay,
                width: i % 3 === 0 ? '10px' : '6px',
                height: i % 3 === 0 ? '10px' : '6px',
                boxShadow: `0 0 10px ${p.color}`,
              }}
            />
          ))}
        </div>

        <div
          className="text-center px-6 max-w-lg w-full"
          style={{ animation: 'slideUp 0.5s ease-out' }}
        >
          {/* Decorative ring */}
          <div className="relative inline-block mb-5">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #a855f7, #fbbf24, #22d3ee, #f472b6, #a855f7)',
                animation: 'borderRotate 2s linear infinite',
                filter: 'blur(8px)',
                opacity: 0.7,
                transform: 'scale(1.3)',
              }}
            />
            <div className="text-7xl relative z-10 animate-bounce">🏆</div>
          </div>

          <p className="text-white/40 text-xs uppercase tracking-[0.35em] mb-3 font-bold">
            Round {store.round} Challenge
          </p>

          <h1
            className="font-black text-5xl mb-4 drop-shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #e879f9, #a78bfa, #fbbf24, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {store.currentChallenge.tunisianName}
          </h1>

          <p className="text-purple-200/80 text-base mb-6 leading-relaxed">
            {store.currentChallenge.condition}
          </p>

          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))',
              border: '2px solid rgba(251,191,36,0.5)',
              boxShadow: '0 0 24px rgba(251,191,36,0.3)',
              color: '#fbbf24',
            }}
          >
            ⭐ +{store.currentChallenge.points} points
          </div>

          {!isHost && (
            <div className="mt-5 text-white/30 text-xs animate-pulse">⏳ Waiting for host...</div>
          )}
        </div>
      </div>
    );
  }

  // ─── Choice circle ───────────────────────────────────────────────────────
  if (store.phase === 'choice_circle') {
    if (isHost) {
      return <VisibilityVote onSelect={(mode) => store.selectVisibility(mode)} />;
    }

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 z-50 flex items-center justify-center p-4">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl text-center">
          <div className="text-6xl mb-4 animate-pulse">🎴</div>
          <h3 className="text-white font-black text-xl mb-2">Choice Circle</h3>
          <p className="text-purple-200/60 text-sm mb-4">How much do you want to see?</p>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 text-purple-300 text-xs font-bold animate-pulse">
            ⏳ Waiting for host to choose...
          </div>
        </div>
      </div>
    );
  }

  // ─── Tawa called ─────────────────────────────────────────────────────────
  if (store.phase === 'tawa_called') {
    const caller = players.find(p => p.id === store.tawaCallerId);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 gap-6">
        {store.funnyCardResult ? (
          <FunnyCardModal
            card={store.funnyCardResult}
            loserName={caller?.name || 'Unknown'}
            onClose={() => isHost && store.proceedToNextRound()}
          />
        ) : (
          <>
            <div className="text-center">
              <div className="text-8xl mb-4" style={{ animation: 'fadeIn 0.5s ease-out' }}>🔥</div>
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 mb-3">
                TAWA!
              </h1>
              <p className="text-white text-xl mb-2">
                {store.roundWinner
                  ? `${caller?.name} wins the round! 🎉`
                  : `${caller?.name}'s call was invalid! 💀`}
              </p>
              <p className="text-white/40 text-sm">{store.message}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
              {players.map(p => (
                <div
                  key={p.id}
                  className={`text-center p-3 rounded-xl ${p.id === store.roundWinner
                    ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                    : 'bg-white/5'
                    }`}
                >
                  <p className="text-white text-sm font-bold mb-2 flex items-center justify-center gap-1">
                    {p.isBot ? '🤖' : '👤'} {p.name}
                    {p.id === store.roundWinner && <span className="ml-1">👑</span>}
                  </p>
                  <div className="flex gap-1.5 justify-center">
                    {Array.isArray(p.hand) && p.hand.map(card => (
                      <div key={card.id} className="w-12 h-16">
                        {card.type === 'number' ? (
                          <div className={`w-full h-full rounded-lg bg-gradient-to-br ${card.color === 'red' ? 'from-red-500 to-red-700' :
                            card.color === 'blue' ? 'from-blue-500 to-blue-700' :
                              card.color === 'green' ? 'from-emerald-500 to-emerald-700' :
                                'from-amber-400 to-amber-600'
                            } flex items-center justify-center text-white font-black text-lg shadow-md`}>
                            {card.number}
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-800 flex items-center justify-center text-lg shadow-md">
                            {card.type === 'special' && card.icon}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-amber-400 text-xs font-bold mt-1">⭐ {p.score}</p>
                </div>
              ))}
            </div>

            <Scoreboard players={players} roundWinner={store.roundWinner} />

            {isHost && (
              <button
                onClick={() => { sfxClick(); store.proceedToNextRound(); }}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95"
              >
                {store.round >= store.maxRounds ? '🏆 Final Results' : '➡️ Next Round'}
              </button>
            )}
            {!isHost && (
              <div className="text-white/30 text-sm animate-pulse">⏳ Waiting for host...</div>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── Round end ───────────────────────────────────────────────────────────
  if (store.phase === 'round_end') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-5xl mb-2">📊</div>
        <h2 className="text-white font-black text-2xl">Round {store.round} Complete!</h2>
        <Scoreboard players={players} roundWinner={store.roundWinner} />
        {isHost && (
          <button
            onClick={() => { sfxClick(); store.proceedToNextRound(); }}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity hover:scale-105 active:scale-95"
          >
            ➡️ Next Round
          </button>
        )}
        {!isHost && (
          <div className="text-white/30 text-sm animate-pulse">⏳ Waiting for host...</div>
        )}
      </div>
    );
  }

  // ─── Game end ─────────────────────────────────────────────────────────────
  if (store.phase === 'game_end') {
    const winner = players.find(p => p.id === store.winner);
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-3">
            GAME OVER
          </h1>
          <h2 className="text-white text-3xl font-bold mb-1">{winner?.name} wins!</h2>
          <p className="text-amber-400 text-xl font-bold">{winner?.score} points</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-sm w-full">
          <h3 className="text-white font-bold text-center text-lg mb-4">Final Standings</h3>
          <div className="space-y-2">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'}`}
              >
                <span className="text-xl w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <span className="text-white font-bold flex-1">{p.name}</span>
                <span className="text-amber-400 font-black">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            sfxClick();
            const name = humanPlayer?.name || 'Player';
            store.initGame(name, opponents.length);
          }}
          className="px-10 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white rounded-2xl font-black text-xl hover:shadow-xl hover:shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
        >
          🔥 Play Again
        </button>
      </div>
    );
  }

  // ─── Syncing ──────────────────────────────────────────────────────────────
  if (!humanPlayer) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 z-50 flex items-center justify-center p-4">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl text-center">
          <div className="text-6xl mb-4 animate-pulse">🎮</div>
          <h3 className="text-white font-black text-xl mb-2">Syncing Game State</h3>
          <p className="text-purple-200/60 text-sm mb-2">Fetching game details from host...</p>
          <p className="text-white/20 text-xs mb-1">isHost: {String(isHost)} | Your ID: {currentUserId}</p>
          <p className="text-white/20 text-xs mb-4">Players: {players.map(p => p.id).join(', ') || 'none'}</p>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 text-purple-300 text-xs font-bold animate-pulse">
            ⏳ Please wait...
          </div>
        </div>
      </div>
    );
  }

  // ─── Main game view ───────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 relative overflow-hidden"
      onClick={handleFirstInteraction}
      onKeyDown={handleFirstInteraction}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-3 gap-3">
        {/* ── Top bar: challenge + controls ── */}
        <div className="flex items-start gap-3">
          {/* Challenge banner — now takes most of the width */}
          <div className="flex-1 min-w-0">
            {store.currentChallenge && (
              <ChallengeBanner
                challenge={store.currentChallenge}
                round={store.round}
                maxRounds={store.maxRounds}
              />
            )}
          </div>

          {/* Right controls */}
          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            <div className="bg-white/5 rounded-lg px-2.5 py-1 border border-white/10">
              <span className="text-[10px] text-white/40">Room </span>
              <span className="text-cyan-400 font-bold text-xs">{store.roomId}</span>
            </div>
            {/* Audio + Rules in a row */}
            <div className="flex items-center gap-1.5">
              <AudioControls />
              <button
                onClick={() => { sfxClick(); store.setShowRules(true); }}
                className="audio-btn"
                title="Rules"
              >
                📖
              </button>
            </div>
          </div>
        </div>

        {/* Opponents */}
        <div className="flex flex-wrap justify-center gap-3 px-2">
          {opponents.map(p => (
            <OpponentBoard
              key={p.id}
              player={p}
              isActive={players[store.currentPlayerIndex]?.id === p.id}
              isTargetable={false}
              isSelected={false}
              onSelect={() => { }}
            />
          ))}
        </div>

        {/* Draw / Discard piles */}
        <div className="flex-1 flex items-center justify-center py-2">
          <ActionPanel
            drawPileCount={drawPile.length}
            topDiscard={discardPile[0] || null}
            onDraw={() => {
              store.performDraw();
              setSelectedCardIndex(null);
            }}
            canDraw={isHumanTurn && !store.hasDrawn && store.phase === 'playing' && !store.pendingEffect}
            message={store.message}
          />
        </div>

        {/* Player hand + TAWA button */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <PlayerHand
            player={humanPlayer}
            isCurrentPlayer={isHumanTurn}
            drawnCard={isHumanTurn ? store.drawnCard : null}
            hasDrawn={store.hasDrawn}
            hasDiscarded={store.hasDiscarded}
            onDiscard={(idx) => {
              store.performDiscard(idx);
              setSelectedCardIndex(null);
            }}
            selectedCardIndex={selectedCardIndex}
            onSelectCard={setSelectedCardIndex}
            canSeeCards={store.visibilityMode === 'reveal_all'}
          />

          <TawaButton
            onTawa={() => { store.performTawa(humanPlayer.id); }}
            disabled={store.phase !== 'playing'}
          />
        </div>

        {/* Player turn indicators */}
        <div className="flex justify-center gap-3 py-1.5 flex-wrap">
          {players.map(p => {
            const isCurrent = players[store.currentPlayerIndex]?.id === p.id;
            const isMe = p.id === humanPlayer?.id;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all ${isCurrent ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5 border border-white/5'
                  } ${p.isBlocked ? 'opacity-50' : ''} ${isMe ? 'ring-1 ring-cyan-400/30' : ''}`}
              >
                <span>{p.isBot ? '🤖' : (isMe ? '👤' : '👤')}</span>
                <span className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-white/60'}`}>
                  {p.name}{isMe ? ' (you)' : ''}
                </span>
                <span className="text-amber-400 font-bold">⭐{p.score}</span>
                {p.isBlocked && <span>🚫</span>}
                {isCurrent && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Effect modal */}
      {store.pendingEffect && isHumanTurn && (
        <EffectModal
          effect={store.pendingEffect}
          players={players}
          currentPlayerId={humanPlayer.id}
          onResolve={(t, c, a) => store.performResolveEffect(t, c, a)}
          onCancel={() => store.cancelEffect()}
          drawPile={drawPile}
          showDeckBrowser={store.showDeckBrowser}
          effectStep={store.effectStep}
          setEffectStep={store.setEffectStep}
          selectedTargetPlayer={store.selectedTargetPlayer}
          setSelectedTarget={store.setSelectedTarget}
          peekedCard={store.peekedCard}
          setPeekedCard={store.setPeekedCard}
        />
      )}

      {/* Rules modal */}
      {store.showRules && (
        <RulesModal onClose={() => store.setShowRules(false)} />
      )}

      {/* Special card toast */}
      {specialToast && (
        <SpecialCardToast
          card={specialToast.card}
          playerName={specialToast.playerName}
          onDone={() => setSpecialToast(null)}
        />
      )}
    </div>
  );
};
