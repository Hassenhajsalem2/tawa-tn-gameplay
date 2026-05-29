import React, { useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { Player } from '@/types/game';

const CARD_PREVIEWS = [
  { emoji: '👀', name: 'Peek & Swap' },
  { emoji: '🔀', name: 'Shuffle' },
  { emoji: '🃏', name: 'Joker' },
  { emoji: '7️⃣', name: 'Lucky Seven' },
  { emoji: '🚫', name: 'Blocked' },
  { emoji: '✨', name: 'As I Wish' },
];

export const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [includeBots, setIncludeBots] = useState(false);
  const [botCount, setBotCount] = useState(1);
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [copied, setCopied] = useState(false);

  const initGame = useGameStore(s => s.initGame);
  const startGame = useGameStore(s => s.startGame);
  const phase = useGameStore(s => s.phase);
  const setShowRules = useGameStore(s => s.setShowRules);
  const showRules = useGameStore(s => s.showRules);

  const rs = useRoomStore();

  // Track if local game is initialized
  const gameInitialized = useRef(false);

  // Handle create game
  const handleCreate = async () => {
    if (!playerName.trim()) return;
    const actualBots = includeBots ? botCount : 0;
    await rs.createGame(playerName.trim(), actualBots);
    const room = useRoomStore.getState().room;
    if (room) {
      initGame(playerName.trim(), actualBots, room.id);
      gameInitialized.current = true;
    }
  };

  // Handle join game — joiner does NOT init local game
  // They will receive the full game state from Firebase when the host starts
  const handleJoin = async () => {
    if (!playerName.trim() || roomCode.trim().length < 6) return;
    const ok = await rs.joinGame(roomCode.trim(), playerName.trim());
    if (ok) {
      gameInitialized.current = true;
    }
  };

  // Handle start game (host only)
  const handleStart = async () => {
    // ──── STEP 1: Merge all human joiners from the Firebase room ────
    const room = useRoomStore.getState().room;
    if (room) {
      const gameStore = useGameStore.getState();
      const existingPlayerIds = new Set(gameStore.players.map(p => p.id));

      // Find all human, non-host players from the Firebase room
      const humanJoiners = Object.values(room.players).filter(
        (p: any) => !p.isBot && !p.isHost && !existingPlayerIds.has(p.id)
      );

      if (humanJoiners.length > 0) {
        const newPlayers: Player[] = humanJoiners.map((jp: any) => ({
          id: jp.id,
          name: jp.name,
          isBot: false,
          isHost: false,
          isReady: true,
          hand: [],
          score: 0,
          isBlocked: false,
          canSeeOwnCards: false,
          revealedCardIds: [],
          connected: true,
        }));

        useGameStore.setState({
          players: [...gameStore.players, ...newPlayers],
        });
      }
    }

    // ──── STEP 2: Generate the round (deals cards, challenge, etc.) ────
    startGame();

    // ──── STEP 3: Push full game state to Firebase ────
    const fullState = useGameStore.getState();
    const gameStatePayload = {
      roomId: fullState.roomId,
      phase: fullState.phase,
      players: fullState.players,
      currentPlayerIndex: fullState.currentPlayerIndex,
      drawPile: fullState.drawPile,
      discardPile: fullState.discardPile,
      currentChallenge: fullState.currentChallenge,
      challengeDeck: fullState.challengeDeck,
      funnyCards: fullState.funnyCards,
      visibilityMode: fullState.visibilityMode,
      round: fullState.round,
      maxRounds: fullState.maxRounds,
      pendingEffect: fullState.pendingEffect,
      drawnCard: fullState.drawnCard,
      hasDrawn: fullState.hasDrawn,
      hasDiscarded: fullState.hasDiscarded,
      tawaCallerId: fullState.tawaCallerId,
      winner: fullState.winner,
      roundWinner: fullState.roundWinner,
      funnyCardResult: fullState.funnyCardResult,
      message: fullState.message,
      turnTimer: fullState.turnTimer,
      showDeckBrowser: fullState.showDeckBrowser,
      passItPending: fullState.passItPending,
      passItSelections: fullState.passItSelections,
      jokerReactionWindow: fullState.jokerReactionWindow,
      jokerReactingPlayerId: fullState.jokerReactingPlayerId,
      votingInProgress: fullState.votingInProgress,
      votes: fullState.votes,
    };

    console.log('🚀 Host pushing game state:', {
      phase: fullState.phase,
      players: fullState.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot })),
    });

    await rs.pushGameState(gameStatePayload);

    // ──── STEP 4: Update room status so joiners know the game started ────
    await rs.startGame();
  };

  // Copy room code
  const handleCopy = () => {
    if (!rs.room) return;
    navigator.clipboard.writeText(rs.room.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { });
  };

  const isLoading = rs.status === 'connecting';

  // ============================================================
  // LOBBY WAITING ROOM
  // ============================================================
  if (rs.isInLobby && rs.room) {
    const players = rs.getPlayers();
    const humans = players.filter(p => !p.isBot).length;
    const botsInRoom = players.filter(p => p.isBot).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider">
              TAWA
            </h1>
            <p className="text-white/30 text-xs mt-1">Game Lobby</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Room code */}
            <div className="text-center mb-6 py-5 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl border border-cyan-500/10">
              <span className="text-white/30 text-xs uppercase tracking-[0.3em]">Room Code</span>
              <div className="text-5xl font-black text-cyan-400 tracking-[0.4em] mt-2 font-mono">
                {rs.room.id}
              </div>
              <p className="text-white/20 text-[10px] mt-2">Share this code with friends to join</p>
              <button
                onClick={handleCopy}
                className="mt-3 px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold transition-all"
              >
                {copied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            </div>

            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">
                Live — Real-time sync
              </span>
            </div>

            {/* Players list */}
            <div className="space-y-2 mb-6">
              <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span>Players</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
                  {humans} 👤 + {botsInRoom} 🤖
                </span>
              </h3>

              {players.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] rounded-xl border border-white/5 transition-all"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-xl">{p.isBot ? '🤖' : '👤'}</span>
                  <span className="text-white font-bold text-sm flex-1">{p.name}</span>
                  {p.isHost && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                      HOST
                    </span>
                  )}
                  {p.isBot && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                      BOT
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-[10px]">Ready</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {phase === 'lobby' && rs.isHost && (
                <button
                  onClick={handleStart}
                  className="w-full py-4 rounded-xl font-black text-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  🚀 START GAME
                </button>
              )}

              {phase === 'lobby' && !rs.isHost && (
                <div className="w-full py-4 rounded-xl font-bold text-lg bg-white/5 text-white/40 text-center border border-white/10 animate-pulse">
                  ⏳ Waiting for host to start...
                </div>
              )}

              <button
                onClick={() => { rs.leave(); gameInitialized.current = false; }}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/5 text-white/30 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
              >
                🚪 Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // JOINER: Waiting for host's game state to arrive via Firebase
  // (Room status changed to 'playing' but we don't have cards yet)
  // ============================================================
  if (!rs.isInLobby && !rs.isHost && rs.room && phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl text-center">
          <div className="text-6xl mb-4 animate-pulse">🎮</div>
          <h3 className="text-white font-black text-xl mb-2">Game is Starting!</h3>
          <p className="text-purple-200/60 text-sm mb-4">The host has started the game. Syncing game state...</p>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 text-purple-300 text-xs font-bold animate-pulse">
            ⏳ Loading cards...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN MENU
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {CARD_PREVIEWS.map((card, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-10 animate-bounce"
            style={{
              top: `${15 + (i * 15) % 70}%`,
              left: `${5 + (i * 17) % 90}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          >
            {card.emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <h1
              className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 tracking-wider drop-shadow-2xl"
              style={{ fontFamily: 'system-ui', lineHeight: 1.1 }}
            >
              TAWA
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-2 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-3 text-white/60 text-sm mb-2">
            <span className="flex items-center gap-1">🧠 Memory</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1">⚡ Strategy</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1">🔥 Chaos</span>
          </div>
          <p className="text-cyan-400/50 text-xs tracking-[0.4em] uppercase font-bold">Tunisian Card Game</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === 'create'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white shadow-md border border-cyan-500/20'
                  : 'text-white/40 hover:text-white/70'
                }`}
            >
              🔥 Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === 'join'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-md border border-purple-500/20'
                  : 'text-white/40 hover:text-white/70'
                }`}
            >
              🚪 Join Game
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
                👤 Your Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-lg"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {mode === 'create' && (
              <>
                <div>
                  <label
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => !isLoading && setIncludeBots(!includeBots)}
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${includeBots
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30'
                          : 'bg-white/10 border border-white/10'
                        }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${includeBots ? 'left-[22px]' : 'left-0.5'
                          }`}
                      />
                    </div>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider group-hover:text-white/80 transition-colors">
                      🤖 Add Bot Opponents
                    </span>
                  </label>
                </div>

                {includeBots && (
                  <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                    <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
                      Number of Bots
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setBotCount(n)}
                          disabled={isLoading}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${botCount === n
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                              : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/10 hover:text-white/70'
                            }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-white/20 text-[10px] mt-1.5">{botCount + 1} players total (you + {botCount} bot{botCount > 1 ? 's' : ''})</p>
                  </div>
                )}

                {rs.error && mode === 'create' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-red-400 text-sm">⚠️</span>
                    <p className="text-red-400 text-xs">{rs.error}</p>
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={!playerName.trim() || isLoading}
                  className={`w-full py-4 rounded-xl font-black text-xl tracking-wider transition-all duration-300 ${playerName.trim() && !isLoading
                      ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white hover:shadow-2xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {isLoading ? '⏳ Creating...' : '🔥 CREATE GAME'}
                </button>
              </>
            )}

            {mode === 'join' && (
              <>
                <div>
                  <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
                    🔑 Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-2xl tracking-[0.4em] font-mono text-center uppercase"
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    disabled={isLoading}
                  />
                  <p className="text-white/20 text-[10px] mt-1.5">Ask the host for the 6-letter room code</p>
                </div>

                {rs.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-red-400 text-sm">⚠️</span>
                    <p className="text-red-400 text-xs">{rs.error}</p>
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={!playerName.trim() || roomCode.length < 6 || isLoading}
                  className={`w-full py-4 rounded-xl font-black text-xl tracking-wider transition-all duration-300 ${playerName.trim() && roomCode.length >= 6 && !isLoading
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {isLoading ? '⏳ Joining...' : '🚪 JOIN GAME'}
                </button>
              </>
            )}

            <button
              onClick={() => setShowRules(true)}
              className="w-full py-2 text-white/30 text-sm hover:text-white/60 transition-colors"
              disabled={isLoading}
            >
              📖 Learn How to Play
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 text-center">
            <div className="text-xl mb-1">🎴</div>
            <div className="text-white/40 text-[10px]">56 Cards</div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 text-center">
            <div className="text-xl mb-1">🏆</div>
            <div className="text-white/40 text-[10px]">16 Challenges</div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 text-center">
            <div className="text-xl mb-1">😂</div>
            <div className="text-white/40 text-[10px]">10 Punishments</div>
          </div>
        </div>

        <p className="text-center text-white/10 text-xs mt-6">
          🇹🇳 Made with chaos & love in Tunisia
        </p>
      </div>

      {showRules && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-auto">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl border border-purple-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-xl">📖 How to Play TAWA</h2>
                <button onClick={() => setShowRules(false)} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
              </div>
              <div className="space-y-4 text-sm text-white/80">
                <section>
                  <h3 className="text-cyan-400 font-bold text-base mb-1">🎯 Objective</h3>
                  <p>Win rounds by meeting the Challenge condition, then call <strong className="text-orange-400">TAWA!</strong> to claim points. 5 rounds — highest score wins!</p>
                </section>
                <section>
                  <h3 className="text-cyan-400 font-bold text-base mb-1">🔄 Each Turn</h3>
                  <ol className="list-decimal list-inside space-y-1 text-white/70">
                    <li>Draw 1 card from the deck</li>
                    <li>Choose 1 card to discard (click it twice)</li>
                    <li>If discarded card is special → its effect triggers!</li>
                    <li>When ready, click TAWA to claim the round</li>
                  </ol>
                </section>
                <section>
                  <h3 className="text-purple-400 font-bold text-base mb-1">✨ Special Cards</h3>
                  <div className="grid grid-cols-1 gap-1 text-xs text-white/60">
                    <p>👀 <strong>Peek & Swap</strong> — Look at opponent's card, optionally swap</p>
                    <p>🔀 <strong>Shuffle</strong> — Shuffle an opponent's hand</p>
                    <p>👁️ <strong>Always Look</strong> — See all your own cards</p>
                    <p>✨ <strong>As I Wish</strong> — Inspect opponent's card, decide if they keep it</p>
                    <p>🔄 <strong>Play Again</strong> — Skip everyone, play again</p>
                    <p>🚫 <strong>Blocked</strong> — Block opponent from drawing next turn</p>
                    <p>🧤 <strong>Pick from Deck</strong> — Browse deck and pick any card</p>
                    <p>➡️ <strong>Pass It</strong> — Everyone passes a card left</p>
                    <p>🏆 <strong>New Challenge</strong> — Replace current challenge</p>
                    <p>7️⃣ <strong>Lucky Seven</strong> — Swap entire hand with opponent</p>
                    <p>🃏 <strong>Joker</strong> — Wild card / counter any special</p>
                  </div>
                </section>
                <section>
                  <h3 className="text-red-400 font-bold text-base mb-1">⚠️ Important</h3>
                  <ul className="list-disc list-inside space-y-0.5 text-white/70 text-xs">
                    <li>Always maintain 4 cards after your turn</li>
                    <li>Invalid TAWA call = -10 points + punishment card!</li>
                  </ul>
                </section>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="mt-5 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Got it! 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
