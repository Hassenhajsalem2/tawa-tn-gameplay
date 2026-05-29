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

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState('Player', 2),
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
    set(applyState(createInitialState(playerName, botCount, roomId)));
  },

  startGame: () => {
    set(applyState(startNewRound(getFullState(get()))));
  },

  selectVisibility: (mode) => {
    set(applyState(setVisibilityMode(getFullState(get()), mode)));
  },

  performDraw: () => {
    const afterDraw = drawCard(getFullState(get()));
    // If hasDrawn=true but drawnCard=null, player was blocked — advance turn immediately
    if (afterDraw.hasDrawn && !afterDraw.drawnCard) {
      set(applyState(nextTurn(afterDraw)));
    } else {
      set(applyState(afterDraw));
    }
  },

  performDiscard: (cardIndex) => {
    const afterDiscard = discardCard(getFullState(get()), cardIndex);
    if (!afterDiscard.pendingEffect) {
      // No special effect — advance turn immediately
      set({ ...applyState(nextTurn(afterDiscard)), discardMessage: null });
    } else {
      // Special card played — show EffectModal, wait for resolution
      set(applyState(afterDiscard));
    }
  },

  performResolveEffect: (targetPlayerId, targetCardIndex, accept) => {
    const newState = resolveEffect(getFullState(get()), targetPlayerId, targetCardIndex, accept);
    set({ ...applyState(newState), selectedTargetPlayer: null, selectedTargetCard: null, effectStep: null, peekedCard: null });
  },

  cancelEffect: () => {
    const newState = nextTurn({ ...getFullState(get()), pendingEffect: null });
    set({ ...applyState(newState), selectedTargetPlayer: null, selectedTargetCard: null, effectStep: null, peekedCard: null });
  },

  setShowDeckBrowser: (show) => set({ showDeckBrowser: show }),

  setPassItSelection: (playerId, cardIndex) => {
    set(s => ({ passItSelections: { ...s.passItSelections, [playerId]: cardIndex } }));
  },

  performTawa: (callerId: string) => {
    set(applyState(callTawa(getFullState(get()), callerId)));
  },

  proceedToNextRound: () => {
    const roundEndState = endRound(getFullState(get()));
    if (roundEndState.phase === 'game_end') {
      set(applyState(roundEndState));
    } else {
      set(applyState(startNewRound(roundEndState)));
    }
  },

  processBotTurn: () => {
    const state = getFullState(get());
    if (!state.players[state.currentPlayerIndex].isBot) return;
    set(applyState(botTurn(state)));
  },
}));

// ─────────────────────────────────────────────────────────────
// FIREBASE SYNC — simple and robust
//
// KEY DESIGN DECISIONS:
//
// 1. Synchronous module-level `isApplyingRemote` flag.
//    Set before setState, cleared after. Since JS is single-threaded,
//    the subscriber always sees the correct value — no race conditions.
//
// 2. Never cancel pending syncs. The _writtenBy echo check on the
//    receiver is sufficient to prevent loops. Cancelling was killing
//    legitimate local actions (like effect resolution).
//
// 3. Read CURRENT state when debounce fires, not the stale closure
//    state from when the subscriber first ran.
// ─────────────────────────────────────────────────────────────

let isApplyingRemote = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Wraps setState with synchronous echo-protection flag */
export function applyRemoteToStore(partial: Record<string, any>) {
  isApplyingRemote = true;
  useGameStore.setState(partial);
  isApplyingRemote = false;
}

useGameStore.subscribe((_s, prevState) => {
  // Always read CURRENT state, not the stale closure arg
  const state = useGameStore.getState();

  if (state.phase === 'lobby') return;
  if (isApplyingRemote) return;

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
    // Read FRESH state right now — not the stale closure from 150ms ago
    const fresh = useGameStore.getState();
    if (fresh.phase === 'lobby') return;

    import('./roomStore').then(({ useRoomStore }) => {
      const rs = useRoomStore.getState();
      if (!rs.room || !rs.userId) return;

      rs.pushGameState({
        roomId: fresh.roomId,
        phase: fresh.phase,
        players: fresh.players,
        currentPlayerIndex: fresh.currentPlayerIndex,
        drawPile: fresh.drawPile,
        discardPile: fresh.discardPile,
        currentChallenge: fresh.currentChallenge,
        challengeDeck: fresh.challengeDeck,
        funnyCards: fresh.funnyCards,
        visibilityMode: fresh.visibilityMode,
        round: fresh.round,
        maxRounds: fresh.maxRounds,
        pendingEffect: fresh.pendingEffect,
        drawnCard: fresh.drawnCard,
        hasDrawn: fresh.hasDrawn,
        hasDiscarded: fresh.hasDiscarded,
        tawaCallerId: fresh.tawaCallerId,
        winner: fresh.winner,
        roundWinner: fresh.roundWinner,
        funnyCardResult: fresh.funnyCardResult,
        message: fresh.message,
        turnTimer: fresh.turnTimer,
        showDeckBrowser: fresh.showDeckBrowser,
        passItPending: fresh.passItPending,
        passItSelections: fresh.passItSelections,
        jokerReactionWindow: fresh.jokerReactionWindow,
        jokerReactingPlayerId: fresh.jokerReactingPlayerId,
        votingInProgress: fresh.votingInProgress,
        votes: fresh.votes,
        _writtenBy: rs.userId,
        _timestamp: Date.now(),
      });
    });
  }, 150);
});
