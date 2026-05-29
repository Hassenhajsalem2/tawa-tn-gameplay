import { create } from 'zustand';
import { GameState, VisibilityMode } from '@/types/game';
import {
  createInitialState,
  startNewRound,
  setVisibilityMode,
  drawCard,
  discardCard,
  resolveEffect,
  nextTurn,
  callTawa,
  endRound,
  botTurn,
} from '@/engine/gameEngine';

interface GameStore extends GameState {
  // Lobby actions
  initGame: (playerName: string, botCount: number, roomId?: string) => void;
  startGame: () => void;

  // Game phase actions
  selectVisibility: (mode: VisibilityMode) => void;

  // Turn actions
  performDraw: () => void;
  performDiscard: (cardIndex: number) => void;

  // Effect actions
  performResolveEffect: (targetPlayerId?: string, targetCardIndex?: number, accept?: boolean) => void;
  cancelEffect: () => void;
  setShowDeckBrowser: (show: boolean) => void;
  setPassItSelection: (playerId: string, cardIndex: number) => void;

  // TAWA
  performTawa: () => void;

  // Round management
  proceedToNextRound: () => void;

  // Bot
  processBotTurn: () => void;

  // UI state
  selectedTargetPlayer: string | null;
  selectedTargetCard: number | null;
  setSelectedTarget: (playerId: string | null, cardIndex: number | null) => void;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  effectStep: 'select_player' | 'select_card' | 'confirm' | null;
  setEffectStep: (step: 'select_player' | 'select_card' | 'confirm' | null) => void;
  peekedCard: { playerId: string; cardIndex: number; card: import('@/types/game').GameCard } | null;
  setPeekedCard: (card: { playerId: string; cardIndex: number; card: import('@/types/game').GameCard } | null) => void;

  // Discard animation state
  discardMessage: string | null;
}

function applyState(state: GameState): Partial<GameStore> {
  return {
    roomId: state.roomId,
    phase: state.phase,
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    drawPile: state.drawPile,
    discardPile: state.discardPile,
    currentChallenge: state.currentChallenge,
    challengeDeck: state.challengeDeck,
    funnyCards: state.funnyCards,
    visibilityMode: state.visibilityMode,
    round: state.round,
    maxRounds: state.maxRounds,
    pendingEffect: state.pendingEffect,
    drawnCard: state.drawnCard,
    hasDrawn: state.hasDrawn,
    hasDiscarded: state.hasDiscarded,
    tawaCallerId: state.tawaCallerId,
    winner: state.winner,
    roundWinner: state.roundWinner,
    funnyCardResult: state.funnyCardResult,
    message: state.message,
    turnTimer: state.turnTimer,
    animatingCard: state.animatingCard,
    showDeckBrowser: state.showDeckBrowser,
    passItPending: state.passItPending,
    passItSelections: state.passItSelections,
    jokerReactionWindow: state.jokerReactionWindow,
    jokerReactingPlayerId: state.jokerReactingPlayerId,
    votingInProgress: state.votingInProgress,
    votes: state.votes,
  };
}

function getFullState(store: GameStore): GameState {
  return {
    roomId: store.roomId,
    phase: store.phase,
    players: store.players,
    currentPlayerIndex: store.currentPlayerIndex,
    drawPile: store.drawPile,
    discardPile: store.discardPile,
    currentChallenge: store.currentChallenge,
    challengeDeck: store.challengeDeck,
    funnyCards: store.funnyCards,
    visibilityMode: store.visibilityMode,
    round: store.round,
    maxRounds: store.maxRounds,
    pendingEffect: store.pendingEffect,
    drawnCard: store.drawnCard,
    hasDrawn: store.hasDrawn,
    hasDiscarded: store.hasDiscarded,
    tawaCallerId: store.tawaCallerId,
    winner: store.winner,
    roundWinner: store.roundWinner,
    funnyCardResult: store.funnyCardResult,
    message: store.message,
    turnTimer: store.turnTimer,
    animatingCard: store.animatingCard,
    showDeckBrowser: store.showDeckBrowser,
    passItPending: store.passItPending,
    passItSelections: store.passItSelections,
    jokerReactionWindow: store.jokerReactionWindow,
    jokerReactingPlayerId: store.jokerReactingPlayerId,
    votingInProgress: store.votingInProgress,
    votes: store.votes,
  };
}

const initialState = createInitialState('Player', 2);

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // UI state
  selectedTargetPlayer: null,
  selectedTargetCard: null,
  showRules: false,
  effectStep: null,
  peekedCard: null,
  discardMessage: null,

  setSelectedTarget: (playerId, cardIndex) => set({ selectedTargetPlayer: playerId, selectedTargetCard: cardIndex }),
  setShowRules: (show) => set({ showRules: show }),
  setEffectStep: (step) => set({ effectStep: step }),
  setPeekedCard: (card) => set({ peekedCard: card }),

  initGame: (playerName, botCount, roomId) => {
    const state = createInitialState(playerName, botCount, roomId);
    set(applyState(state));
  },

  startGame: () => {
    const state = getFullState(get());
    const newState = startNewRound(state);
    set(applyState(newState));
  },

  selectVisibility: (mode) => {
    const state = getFullState(get());
    const newState = setVisibilityMode(state, mode);
    set(applyState(newState));
  },

  performDraw: () => {
    const state = getFullState(get());
    const newState = drawCard(state);
    set(applyState(newState));
  },

  performDiscard: (cardIndex) => {
    const state = getFullState(get());
    const afterDiscard = discardCard(state, cardIndex);

    // If a normal card was discarded (no special effect), show a brief
    // message then auto-advance to next turn after a short delay
    if (!afterDiscard.pendingEffect) {
      // Show the discard message momentarily, then advance turn
      const discardMsg = afterDiscard.message;
      set({ ...applyState(afterDiscard), discardMessage: discardMsg });

      // Auto-advance after a brief pause so the player can see what happened
      setTimeout(() => {
        const current = getFullState(get());
        // Only advance if we're still in the same "discarded" state
        if (current.hasDiscarded && !current.pendingEffect && current.phase === 'playing') {
          const advanced = nextTurn(current);
          set({ ...applyState(advanced), discardMessage: null });
        }
      }, 600);
    } else {
      // Special card played — effect modal will handle the flow
      set(applyState(afterDiscard));
    }
  },

  performResolveEffect: (targetPlayerId, targetCardIndex, accept) => {
    const state = getFullState(get());
    const newState = resolveEffect(state, targetPlayerId, targetCardIndex, accept);
    set({ ...applyState(newState), selectedTargetPlayer: null, selectedTargetCard: null, effectStep: null, peekedCard: null });
  },

  cancelEffect: () => {
    const state = getFullState(get());
    const newState = nextTurn({ ...state, pendingEffect: null });
    set({ ...applyState(newState), selectedTargetPlayer: null, selectedTargetCard: null, effectStep: null, peekedCard: null });
  },

  setShowDeckBrowser: (show) => set({ showDeckBrowser: show }),

  setPassItSelection: (playerId, cardIndex) => {
    set(s => ({
      passItSelections: { ...s.passItSelections, [playerId]: cardIndex },
    }));
  },

  performTawa: () => {
    const state = getFullState(get());
    const newState = callTawa(state, 'player-human');
    set(applyState(newState));
  },

  proceedToNextRound: () => {
    const state = getFullState(get());
    const roundEndState = endRound(state);
    if (roundEndState.phase === 'game_end') {
      set(applyState(roundEndState));
    } else {
      const newRoundState = startNewRound(roundEndState);
      set(applyState(newRoundState));
    }
  },

  processBotTurn: () => {
    const state = getFullState(get());
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer.isBot) return;
    const newState = botTurn(state);
    set(applyState(newState));
  },
}));

// Auto-sync game store to Firebase if current user is the host
// We use a debounce to avoid excessive writes and only sync during active gameplay
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

useGameStore.subscribe((state, prevState) => {
  // Only sync if:
  // 1. The phase changed, OR significant game state changed
  // 2. We're not in lobby (lobby state is managed separately)
  // Skip syncing if nothing important changed
  if (state.phase === 'lobby') return;

  // Skip if the phase didn't change and no game-critical fields changed
  const phaseChanged = state.phase !== prevState.phase;
  const turnChanged = state.currentPlayerIndex !== prevState.currentPlayerIndex;
  const significantChange = phaseChanged || turnChanged ||
    state.hasDrawn !== prevState.hasDrawn ||
    state.hasDiscarded !== prevState.hasDiscarded ||
    state.pendingEffect !== prevState.pendingEffect ||
    state.tawaCallerId !== prevState.tawaCallerId ||
    state.round !== prevState.round;

  if (!significantChange) return;

  // Debounce: wait a short time before pushing to avoid rapid-fire writes
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(() => {
    import('./roomStore').then(({ useRoomStore }) => {
      const roomState = useRoomStore.getState();
      if (roomState.isHost && roomState.room) {
        // Extract serializable game state
        const gameState = {
          roomId: state.roomId,
          phase: state.phase,
          players: state.players,
          currentPlayerIndex: state.currentPlayerIndex,
          drawPile: state.drawPile,
          discardPile: state.discardPile,
          currentChallenge: state.currentChallenge,
          challengeDeck: state.challengeDeck,
          funnyCards: state.funnyCards,
          visibilityMode: state.visibilityMode,
          round: state.round,
          maxRounds: state.maxRounds,
          pendingEffect: state.pendingEffect,
          drawnCard: state.drawnCard,
          hasDrawn: state.hasDrawn,
          hasDiscarded: state.hasDiscarded,
          tawaCallerId: state.tawaCallerId,
          winner: state.winner,
          roundWinner: state.roundWinner,
          funnyCardResult: state.funnyCardResult,
          message: state.message,
          turnTimer: state.turnTimer,
          showDeckBrowser: state.showDeckBrowser,
          passItPending: state.passItPending,
          passItSelections: state.passItSelections,
          jokerReactionWindow: state.jokerReactionWindow,
          jokerReactingPlayerId: state.jokerReactingPlayerId,
          votingInProgress: state.votingInProgress,
          votes: state.votes,
        };
        roomState.pushGameState(gameState);
      }
    });
  }, 150);
});
