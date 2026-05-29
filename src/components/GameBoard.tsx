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

export const GameBoard: React.FC = () => {
  const store = useGameStore();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showChallengeReveal, setShowChallengeReveal] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = useRoomStore(s => s.userId);
  const isHost = useRoomStore(s => s.isHost);

  // Safely handle players array (defensive against Firebase serialization)
  const players = Array.isArray(store.players) ? store.players : [];
  const drawPile = Array.isArray(store.drawPile) ? store.drawPile : [];
  const discardPile = Array.isArray(store.discardPile) ? store.discardPile : [];

  // ── KEY FIX: Each player sees THEIR OWN hand ──
  // Host's player ID is always 'player-human' (hardcoded in gameEngine)
  // Joiner's player ID is their Firebase UID (set when host merges room players)
  const humanPlayer = isHost
    ? players.find(p => p.id === 'player-human')
    : players.find(p => p.id === currentUserId);

  const opponents = players.filter(p => p.id !== humanPlayer?.id);
  const currentPlayer = players[store.currentPlayerIndex];
  const isHumanTurn = currentPlayer && currentPlayer.id === humanPlayer?.id;

  // Challenge reveal animation — ONLY auto-advance on host side.
  // Joiners receive the phase change from Firebase.
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

  // Bot turn processing — Host only (bots run on host's device)
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

  // Auto-advance blocked human player's turn
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
          {!isHost && (
            <div className="mt-4 text-white/30 text-xs animate-pulse">⏳ Waiting for host...</div>
          )}
        </div>
      </div>
    );
  }

  // Choice circle
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

  // Tawa called
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
                onClick={() => store.proceedToNextRound()}
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

  // Round end
  if (store.phase === 'round_end') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-5xl mb-2">📊</div>
        <h2 className="text-white font-black text-2xl">Round {store.round} Complete!</h2>
        <Scoreboard players={players} roundWinner={store.roundWinner} />
        {isHost && (
          <button
            onClick={() => store.proceedToNextRound()}
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

  // Game end
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'
                  }`}
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

  // Main game view — show "syncing" if humanPlayer not found yet
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-3 gap-3">
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

        {/* Opponents: for host = [joiner, bots], for joiner = [host, bots] */}
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

        {/* YOUR hand — each player sees their own cards */}
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
            onTawa={() => store.performTawa(humanPlayer.id)}
            disabled={store.phase !== 'playing'}
          />
        </div>

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

      {store.showRules && (
        <RulesModal onClose={() => store.setShowRules(false)} />
      )}
    </div>
  );
};

