import { create } from 'zustand';
import {
  firebaseSignIn,
  fbCreateRoom,
  fbJoinRoom,
  fbLeaveRoom,
  fbAddBot,
  fbUpdateStatus,
  fbSubscribeToRoom,
  fbSetGameState,
  fbSubscribeToGameState,
  FBRoom,
  FBPlayer,
} from '@/lib/firebase';

const BOT_NAMES = ['Hassen 🇹🇳', 'Oumaima 🌸', 'Khaled 🎯', 'Tasnime ⭐', 'Bader 🌙'];
type RoomStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface RoomStore {
  userId: string | null;
  status: RoomStatus;
  error: string | null;
  room: FBRoom | null;
  isHost: boolean;
  isInLobby: boolean;
  createGame: (playerName: string, botCount: number) => Promise<void>;
  joinGame: (roomCode: string, playerName: string) => Promise<boolean>;
  leave: () => void;
  startGame: () => Promise<void>;
  pushGameState: (gameState: any) => Promise<void>;
  getPlayers: () => FBPlayer[];
  _unsub: (() => void) | null;
  _unsubGameState: (() => void) | null;
}

function fixFirebaseArrays(state: any): any {
  if (!state || typeof state !== 'object') return state;
  const ARRAY_FIELDS = ['players', 'drawPile', 'discardPile', 'challengeDeck', 'funnyCards'];
  const fixed = { ...state };

  for (const field of ARRAY_FIELDS) {
    if (fixed[field] && typeof fixed[field] === 'object' && !Array.isArray(fixed[field])) {
      const keys = Object.keys(fixed[field]).map(Number).sort((a, b) => a - b);
      fixed[field] = keys.map(k => fixed[field][k]);
    }
    if (field === 'players' && Array.isArray(fixed.players)) {
      fixed.players = fixed.players.map((p: any) => ({
        ...p,
        hand: Array.isArray(p.hand) ? p.hand : (p.hand ? Object.values(p.hand) : []),
        revealedCardIds: Array.isArray(p.revealedCardIds) ? p.revealedCardIds : (p.revealedCardIds ? Object.values(p.revealedCardIds) : []),
      }));
    }
  }
  return fixed;
}

function applyRemoteState(remoteState: any, myUserId: string, roomStoreSet: (p: any) => void) {
  // Skip own echoes — _writtenBy tag prevents loop
  if (remoteState._writtenBy && remoteState._writtenBy === myUserId) {
    return;
  }

  const fixed = fixFirebaseArrays(remoteState);

  import('./gameStore').then(({ applyRemoteToStore }) => {
    applyRemoteToStore({
      roomId: fixed.roomId ?? null,
      phase: fixed.phase ?? 'lobby',
      players: fixed.players ?? [],
      currentPlayerIndex: fixed.currentPlayerIndex ?? 0,
      drawPile: fixed.drawPile ?? [],
      discardPile: fixed.discardPile ?? [],
      currentChallenge: fixed.currentChallenge ?? null,
      challengeDeck: fixed.challengeDeck ?? [],
      funnyCards: fixed.funnyCards ?? [],
      visibilityMode: fixed.visibilityMode ?? 'keep_hidden',
      round: fixed.round ?? 0,
      maxRounds: fixed.maxRounds ?? 5,
      pendingEffect: fixed.pendingEffect ?? null,
      drawnCard: fixed.drawnCard ?? null,
      hasDrawn: fixed.hasDrawn ?? false,
      hasDiscarded: fixed.hasDiscarded ?? false,
      tawaCallerId: fixed.tawaCallerId ?? null,
      winner: fixed.winner ?? null,
      roundWinner: fixed.roundWinner ?? null,
      funnyCardResult: fixed.funnyCardResult ?? null,
      message: fixed.message ?? '',
      turnTimer: fixed.turnTimer ?? 30,
      animatingCard: fixed.animatingCard ?? null,
      showDeckBrowser: fixed.showDeckBrowser ?? false,
      passItPending: fixed.passItPending ?? false,
      passItSelections: fixed.passItSelections ?? {},
      jokerReactionWindow: fixed.jokerReactionWindow ?? false,
      jokerReactingPlayerId: fixed.jokerReactingPlayerId ?? null,
      votingInProgress: fixed.votingInProgress ?? false,
      votes: fixed.votes ?? {},
    });

    if (fixed.phase && fixed.phase !== 'lobby') {
      roomStoreSet({ isInLobby: false });
    }
  }).catch((err) => console.error('❌ applyRemoteState failed:', err));
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  userId: null,
  status: 'idle',
  error: null,
  room: null,
  isHost: false,
  isInLobby: false,
  _unsub: null,
  _unsubGameState: null,

  createGame: async (playerName: string, botCount: number) => {
    set({ status: 'connecting', error: null });
    try {
      const uid = await firebaseSignIn();
      set({ userId: uid });

      const room = await fbCreateRoom(uid, playerName);

      const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(botCount, 5); i++) {
        await fbAddBot(room.id, `bot-${i}`, shuffled[i]);
      }

      const unsub = fbSubscribeToRoom(room.id, (updatedRoom) => {
        if (updatedRoom) {
          const gameStarted = updatedRoom.status === 'playing' || updatedRoom.status === 'finished';
          set({ room: updatedRoom, isInLobby: !gameStarted });
        }
      });

      const unsubGS = fbSubscribeToGameState(room.id, (remoteState) => {
        if (!remoteState) return;
        applyRemoteState(remoteState, get().userId!, set);
      });

      set({ room, isHost: true, isInLobby: true, status: 'connected', _unsub: unsub, _unsubGameState: unsubGS });
    } catch (err: any) {
      const msg = err?.message || 'Failed to create room';
      console.error('Create game error:', msg);
      set({ status: 'error', error: msg });
    }
  },

  joinGame: async (roomCode: string, playerName: string) => {
    set({ status: 'connecting', error: null });
    try {
      const uid = await firebaseSignIn();
      set({ userId: uid });

      const room = await fbJoinRoom(roomCode, uid, playerName);
      if (!room) {
        set({ status: 'error', error: `Room "${roomCode}" not found. Check the code and try again.` });
        return false;
      }

      const unsub = fbSubscribeToRoom(room.id, (updatedRoom) => {
        if (updatedRoom) {
          const gameStarted = updatedRoom.status === 'playing' || updatedRoom.status === 'finished';
          set({ room: updatedRoom, isInLobby: !gameStarted });
        } else {
          set({ room: null, isInLobby: false, status: 'idle' });
        }
      });

      const unsubGS = fbSubscribeToGameState(room.id, (remoteState) => {
        if (!remoteState) return;
        applyRemoteState(remoteState, get().userId!, set);
      });

      set({ room, isHost: false, isInLobby: room.status === 'waiting', status: 'connected', _unsub: unsub, _unsubGameState: unsubGS });
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to join room';
      console.error('Join game error:', msg);
      set({ status: 'error', error: msg });
      return false;
    }
  },

  leave: () => {
    const { room, userId, _unsub, _unsubGameState } = get();
    if (_unsub) _unsub();
    if (_unsubGameState) _unsubGameState();
    if (room && userId) fbLeaveRoom(room.id, userId).catch(() => { });
    set({ room: null, isHost: false, isInLobby: false, status: 'idle', error: null, _unsub: null, _unsubGameState: null });
  },

  startGame: async () => {
    const { room } = get();
    if (!room) return;
    await fbUpdateStatus(room.id, 'playing');
  },

  pushGameState: async (gameState: any) => {
    const { room, userId } = get();
    if (!room) return;
    await fbSetGameState(room.id, {
      ...gameState,
      _writtenBy: userId || 'unknown',
      _timestamp: Date.now(),
    });
  },

  getPlayers: () => {
    const { room } = get();
    if (!room || !room.players) return [];
    return Object.values(room.players);
  },
}));
