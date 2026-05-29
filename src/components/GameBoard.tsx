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
import { nextTurn } from '@/engine/gameEngine';

export const GameBoard: React.FC = () => {
  const store = useGameStore();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showChallengeReveal, setShowChallengeReveal] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const humanPlayer = store.players.find(p => !p.isBot);
  const opponents = store.players.filter(p => p.isBot);
  const currentPlayer = store.players[store.currentPlayerIndex];
  const isHumanTurn = currentPlayer && !currentPlayer.isBot;

  // Challenge reveal animation
  useEffect(() => {
    if (store.phase === 'draw_challenge') {
      setShowChallengeReveal(true);
      const timer = setTimeout(() => {
        setShowChallengeReveal(false);
        useGameStore.setState({ phase: 'choice_circle' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [store.phase, store.round]);

  // Handle blocked human player — they draw (which clears blocked status and
  // sets hasDrawn=true with no drawnCard), then we auto-advance after a beat.
  useEffect(() => {
    if (
      store.phase === 'playing' &&
      isHumanTurn &&
      store.hasDrawn &&
      !store.drawnCard &&
      !store.hasDiscarded &&
      !store.pendingEffect
    ) {
      // Player was blocked – no card to discard, just advance
      const timer = setTimeout(() => {
        const s = useGameStore.getState();
        // Build a GameState from the store to call nextTurn
        const gs = extractGameState(s);
        const advanced = nextTurn(gs);
        useGameStore.setState(applyPartial(advanced));
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [store.phase, isHumanTurn, store.hasDrawn, store.drawnCard, store.hasDiscarded, store.pendingEffect]);

  // Bot turn processing (Host only)
  useEffect(() => {
    const isHost = useRoomStore.getState().isHost;
    if (isHost && store.phase === 'playing' && currentPlayer?.isBot && !store.pendingEffect) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = setTimeout(() => {
        useGameStore.getState().processBotTurn();
      }, 700 + Math.random() * 500);
      return () => {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
      };
    }
  }, [store.phase, store.currentPlayerIndex, currentPlayer?.isBot, store.pendingEffect]);

  // Reset selected card when turn changes
  useEffect(() => {
    setSelectedCardIndex(null);
  }, [store.currentPlayerIndex]);

  // Challenge reveal overlay
  if (showChallengeReveal && store.currentChallenge) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 z-50 flex items-center justify-center">
        <div className="text-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="text-7xl mb-5 animate-bounce">🏆</div>
          <h2 className="text-white/50 text-xs uppercase tracking-[0.3em] mb-3">Round {store.round} Challenge</h2>
          <h1 className="text-white font-black text-5xl mb-4 drop-shadow-lg">{store.currentChallenge.tunisianName}</h1>
          <p className="text-purple-200/80 text-lg mb-4 max-w-md mx-auto">{store.currentChallenge.condition}</p>
          <div className="inline-flex items-center gap-2 bg-amber-500/20 px-5 py-2.5 rounded-full border border-amber-500/30">
            <span className="text-amber-300 font-bold text-lg">+{store.currentChallenge.points} points</span>
          </div>
        </div>
      </div>
    );
  }

  // Choice circle
  if (store.phase === 'choice_circle') {
    const isHost = useRoomStore.getState().isHost;
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

  // Tawa called
  if (store.phase === 'tawa_called') {
    const caller = store.players.find(p => p.id === store.tawaCallerId);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 gap-6">
        {store.funnyCardResult ? (
          <FunnyCardModal
            card={store.funnyCardResult}
            loserName={caller?.name || 'Unknown'}
            onClose={() => store.proceedToNextRound()}
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

            {/* Show all hands revealed */}
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
              {store.players.map(p => (
                <div
                  key={p.id}
                  className={`text-center p-3 rounded-xl ${
                    p.id === store.roundWinner
                      ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                      : 'bg-white/5'
                  }`}
                >
                  <p className="text-white text-sm font-bold mb-2 flex items-center justify-center gap-1">
                    {p.isBot ? '🤖' : '👤'} {p.name}
                    {p.id === store.roundWinner && <span className="ml-1">👑</span>}
                  </p>
                  <div className="flex gap-1.5 justify-center">
                    {p.hand.map(card => (
                      <div key={card.id} className="w-12 h-16">
                        {card.type === 'number' ? (
                          <div className={`w-full h-full rounded-lg bg-gradient-to-br ${
                            card.color === 'red' ? 'from-red-500 to-red-700' :
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

            <Scoreboard players={store.players} roundWinner={store.roundWinner} />

            <button
              onClick={() => store.proceedToNextRound()}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95"
            >
              {store.round >= store.maxRounds ? '🏆 Final Results' : '➡️ Next Round'}
            </button>
          </>
        )}
      </div>
    );
  }

  // Round end
  if (store.phase === 'round_end') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-5xl mb-2">📊</div>
        <h2 className="text-white font-black text-2xl">Round {store.round} Complete!</h2>
        <Scoreboard players={store.players} roundWinner={store.roundWinner} />
        <button
          onClick={() => store.proceedToNextRound()}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity hover:scale-105 active:scale-95"
        >
          ➡️ Next Round
        </button>
      </div>
    );
  }

  // Game end
  if (store.phase === 'game_end') {
    const winner = store.players.find(p => p.id === store.winner);
    const sorted = [...store.players].sort((a, b) => b.score - a.score);
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

        {/* Final standings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-sm w-full">
          <h3 className="text-white font-bold text-center text-lg mb-4">Final Standings</h3>
          <div className="space-y-2">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  ${i === 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'}
                `}
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

  // Main game view
  if (!humanPlayer) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 z-50 flex items-center justify-center p-4">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl text-center">
          <div className="text-6xl mb-4 animate-pulse">🎮</div>
          <h3 className="text-white font-black text-xl mb-2">Syncing Game State</h3>
          <p className="text-purple-200/60 text-sm mb-4">Fetching game details from host...</p>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 text-purple-300 text-xs font-bold animate-pulse">
            ⏳ Please wait...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-3 gap-3">
        {/* Top bar: Challenge + Room + Controls */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {store.currentChallenge && (
              <ChallengeBanner
                challenge={store.currentChallenge}
                round={store.round}
                maxRounds={store.maxRounds}
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="bg-white/5 rounded-lg px-2.5 py-1 border border-white/10">
              <span className="text-[10px] text-white/40">Room </span>
              <span className="text-cyan-400 font-bold text-xs">{store.roomId}</span>
            </div>
            <button
              onClick={() => store.setShowRules(true)}
              className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-sm"
              title="Rules"
            >
              📖
            </button>
          </div>
        </div>

        {/* Opponents area */}
        <div className="flex flex-wrap justify-center gap-3 px-2">
          {opponents.map(p => (
            <OpponentBoard
              key={p.id}
              player={p}
              isActive={store.players[store.currentPlayerIndex]?.id === p.id}
              isTargetable={false}
              isSelected={false}
              onSelect={() => {}}
            />
          ))}
        </div>

        {/* Center: Draw/Discard piles + Message */}
        <div className="flex-1 flex items-center justify-center py-2">
          <ActionPanel
            drawPileCount={store.drawPile.length}
            topDiscard={store.discardPile[0] || null}
            onDraw={() => {
              store.performDraw();
              setSelectedCardIndex(null);
            }}
            canDraw={isHumanTurn && !store.hasDrawn && store.phase === 'playing' && !store.pendingEffect}
            message={store.message}
          />
        </div>

        {/* Player's hand + TAWA */}
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
            onTawa={() => store.performTawa()}
            disabled={store.phase !== 'playing'}
          />
        </div>

        {/* Bottom score strip */}
        <div className="flex justify-center gap-3 py-1.5 flex-wrap">
          {store.players.map(p => {
            const isCurrent = store.players[store.currentPlayerIndex]?.id === p.id;
            return (
              <div
                key={p.id}
                className={`
                  flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all
                  ${isCurrent ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5 border border-white/5'}
                  ${p.isBlocked ? 'opacity-50' : ''}
                `}
              >
                <span>{p.isBot ? '🤖' : '👤'}</span>
                <span className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-white/60'}`}>
                  {p.name}
                </span>
                <span className="text-amber-400 font-bold">⭐{p.score}</span>
                {p.isBlocked && <span>🚫</span>}
                {isCurrent && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Effect Modal */}
      {store.pendingEffect && isHumanTurn && (
        <EffectModal
          effect={store.pendingEffect}
          players={store.players}
          currentPlayerId={humanPlayer.id}
          onResolve={(t, c, a) => store.performResolveEffect(t, c, a)}
          onCancel={() => store.cancelEffect()}
          drawPile={store.drawPile}
          showDeckBrowser={store.showDeckBrowser}
          effectStep={store.effectStep}
          setEffectStep={store.setEffectStep}
          selectedTargetPlayer={store.selectedTargetPlayer}
          setSelectedTarget={store.setSelectedTarget}
          peekedCard={store.peekedCard}
          setPeekedCard={store.setPeekedCard}
        />
      )}

      {/* Rules Modal */}
      {store.showRules && (
        <RulesModal onClose={() => store.setShowRules(false)} />
      )}
    </div>
  );
};

// Helper to extract a GameState from the store
function extractGameState(s: ReturnType<typeof useGameStore.getState>): import('@/types/game').GameState {
  return {
    roomId: s.roomId,
    phase: s.phase,
    players: s.players,
    currentPlayerIndex: s.currentPlayerIndex,
    drawPile: s.drawPile,
    discardPile: s.discardPile,
    currentChallenge: s.currentChallenge,
    challengeDeck: s.challengeDeck,
    funnyCards: s.funnyCards,
    visibilityMode: s.visibilityMode,
    round: s.round,
    maxRounds: s.maxRounds,
    pendingEffect: s.pendingEffect,
    drawnCard: s.drawnCard,
    hasDrawn: s.hasDrawn,
    hasDiscarded: s.hasDiscarded,
    tawaCallerId: s.tawaCallerId,
    winner: s.winner,
    roundWinner: s.roundWinner,
    funnyCardResult: s.funnyCardResult,
    message: s.message,
    turnTimer: s.turnTimer,
    animatingCard: s.animatingCard,
    showDeckBrowser: s.showDeckBrowser,
    passItPending: s.passItPending,
    passItSelections: s.passItSelections,
    jokerReactionWindow: s.jokerReactionWindow,
    jokerReactingPlayerId: s.jokerReactingPlayerId,
    votingInProgress: s.votingInProgress,
    votes: s.votes,
  };
}

function applyPartial(gs: import('@/types/game').GameState): Partial<ReturnType<typeof useGameStore.getState>> {
  return {
    roomId: gs.roomId,
    phase: gs.phase,
    players: gs.players,
    currentPlayerIndex: gs.currentPlayerIndex,
    drawPile: gs.drawPile,
    discardPile: gs.discardPile,
    currentChallenge: gs.currentChallenge,
    challengeDeck: gs.challengeDeck,
    funnyCards: gs.funnyCards,
    visibilityMode: gs.visibilityMode,
    round: gs.round,
    maxRounds: gs.maxRounds,
    pendingEffect: gs.pendingEffect,
    drawnCard: gs.drawnCard,
    hasDrawn: gs.hasDrawn,
    hasDiscarded: gs.hasDiscarded,
    tawaCallerId: gs.tawaCallerId,
    winner: gs.winner,
    roundWinner: gs.roundWinner,
    funnyCardResult: gs.funnyCardResult,
    message: gs.message,
    turnTimer: gs.turnTimer,
    animatingCard: gs.animatingCard,
    showDeckBrowser: gs.showDeckBrowser,
    passItPending: gs.passItPending,
    passItSelections: gs.passItSelections,
    jokerReactionWindow: gs.jokerReactionWindow,
    jokerReactingPlayerId: gs.jokerReactingPlayerId,
    votingInProgress: gs.votingInProgress,
    votes: gs.votes,
  };
}
