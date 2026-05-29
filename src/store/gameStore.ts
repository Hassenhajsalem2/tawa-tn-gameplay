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
  initGame: (playerName: string, botCount: number, roomId?: string) => void;
  startGame: () => void;
  selectVisibility: (mode: VisibilityMode) => void;
  performDraw: () => void;
  performDiscard: (cardIndex: number) => void;
  performResolveEffect: (targetPlayerId?: string, targetCardIndex?: number, accept?: boolean) => void;
  cancelEffect: () => void;
  setShowDeckBrowser: (show: boolean) => void;
  setPassItSelection: (playerId: string, cardIndex: number) => void;
  performTawa: (callerId: string) => void;
  proceedToNextRound: () => void;
  processBotTurn: () => void;

  selectedTargetPlayer: string | null;
  selectedTargetCard: number | null;
  setSelectedTarget: (playerId: string | null, cardIndex: number | null) => void;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  effectStep: 'select_player' | 'select_card' | 'confirm' | null;
  setEffectStep: (step: 'select_player' | 'select_card' | 'confirm' | null) => void;
  peekedCard: { playerId: string; cardIndex: number; card: import('@/types/game').GameCard } | null;
  setPeekedCard: (card: { playerId: string; cardIndex: number; card: import('@/types/game').GameCard } | null) => void;
  discardMessage: string | null;

  _isRemoteUpdate: boolean;
  _lastAppliedTimestamp: number;
}

function applyState(state: GameState): Partial<GameStore> {
  return {
    roomId: state.roomId, phase: state.phase, players: state.players,
    currentPlayerIndex: state.currentPlayerIndex, drawPile: state.drawPile,
    discardPile: state.discardPile, currentChallenge: state.currentChallenge,
    challengeDeck: state.challengeDeck, funnyCards: state.funnyCards,
    visibilityMode: state.visibilityMode, round: state.round, maxRounds: state.maxRounds,
    pendingEffect: state.pendingEffect, drawnCard: state.drawnCard,
    hasDrawn: state.hasDrawn, hasDiscarded: state.hasDiscarded,
    tawaCallerId: state.tawaCallerId, winner: state.winner,
    roundWinner: state.roundWinner, funnyCardResult: state.funnyCardResult,
    message: state.message, turnTimer: state.turnTimer, animatingCard: state.animatingCard,
    showDeckBrowser: state.showDeckBrowser, passItPending: state.passItPending,
    passItSelections: state.passItSelections, jokerReactionWindow: state.jokerReactionWindow,
    jokerReactingPlayerId: state.jokerReactingPlayerId,
    votingInProgress: state.votingInProgress, votes: state.votes,
  };
}

function getFullState(store: GameStore): GameState {
  return {
    roomId: store.roomId, phase: store.phase, players: store.players,
    currentPlayerIndex: store.currentPlayerIndex, drawPile: store.drawPile,
    discardPile: store.discardPile, currentChallenge: store.currentChallenge,
    challengeDeck: store.challengeDeck, funnyCards: store.funnyCards,
    visibilityMode: store.visibilityMode, round: store.round, maxRounds: store.maxRounds,
    pendingEffect: store.pendingEffect, drawnCard: store.drawnCard,
    hasDrawn: store.hasDrawn, hasDiscarded: store.hasDiscarded,
    tawaCallerId: store.tawaCallerId, winner: store.winner,
    roundWinner: store.roundWinner, funnyCardResult: store.funnyCardResult,
    message: store.message, turnTimer: store.turnTimer, animatingCard: store.animatingCard,
    showDeckBrowser: store.showDeckBrowser, passItPending: store.passItPending,
    passItSelections: store.passItSelections, jokerReactionWindow: store.jokerReactionWindow,
    jokerReactingPlayerId: store.jokerReactingPlayerId,
    votingInProgress: store.votingInProgress, votes: store.votes,
  };
}

const initialState = createInitialState('Player', 2);

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  selectedTargetPlayer: null,
  selectedTargetCard: null,
  showRules: false,
  effectStep: null,
  peekedCard: null,
  discardMessage: null,
  _isRemoteUpdate: false,
  _lastAppliedTimestamp: 0,

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

    if (!afterDiscard.pendingEffect) {
      const discardMsg = afterDiscard.message;
      set({ ...applyState(afterDiscard), discardMessage: discardMsg });
      setTimeout(() => {
        const current = getFullState(get());
        if (current.hasDiscarded && !current.pendingEffect && current.phase === 'playing') {
          const advanced = nextTurn(current);
          set({ ...applyState(advanced), discardMessage: null });
        }
      }, 600);
    } else {
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
    set(s => ({ passItSelections: { ...s.passItSelections, [playerId]: cardIndex } }));
  },

  performTawa: (callerId: string) => {
    const state = getFullState(get());
    const newState = callTawa(state, callerId);
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

// ─────────────────────────────────────────────────────────────
// Firebase sync with echo protection
//
// 1. Every write is tagged with _writtenBy + _timestamp
// 2. Receiver skips own echoes via _writtenBy
// 3. Receiver skips stale writes via _timestamp
// 4. Pending debounce is cancelled when remote state arrives
// ─────────────────────────────────────────────────────────────
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

// Called by applyRemoteState to cancel any pending stale push
export function cancelPendingSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}

// Phase progression: prevent backwards transitions from stale Firebase writes
const PHASE_ORDER: Record<string, number> = {
  lobby: 0,
  draw_challenge: 1,
  choice_circle: 2,
  playing: 3,
  tawa_called: 4,
  round_end: 5,
  game_end: 6,
};

export function getPhaseOrder(phase: string): number {
  return PHASE_ORDER[phase] ?? 0;
}

useGameStore.subscribe((state, prevState) => {
  if (state.phase === 'lobby') return;
  if (state._isRemoteUpdate) {
    // Cancel any pending stale push when remote state arrives
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = null;
    return;
  }

  const significantChange =
    state.phase !== prevState.phase ||
    state.currentPlayerIndex !== prevState.currentPlayerIndex ||
    state.hasDrawn !== prevState.hasDrawn ||
    state.hasDiscarded !== prevState.hasDiscarded ||
    state.pendingEffect !== prevState.pendingEffect ||
    state.tawaCallerId !== prevState.tawaCallerId ||
    state.round !== prevState.round ||
    state.winner !== prevState.winner;

  if (!significantChange) return;

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(() => {
    import('./roomStore').then(({ useRoomStore }) => {
      const rs = useRoomStore.getState();
      if (!rs.room || !rs.userId) return;

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
        _writtenBy: rs.userId,
        _timestamp: Date.now(),
      };
      rs.pushGameState(gameState);
    });
  }, 150);
});
