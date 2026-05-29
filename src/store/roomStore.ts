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
      // Step 1: Auth
      const uid = await firebaseSignIn();
      set({ userId: uid });

      // Step 2: Create room in Firebase
      const room = await fbCreateRoom(uid, playerName);

      // Step 3: Add bots
      const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(botCount, 5); i++) {
        await fbAddBot(room.id, `bot-${i}`, shuffled[i]);
      }

      // Step 4: Subscribe to real-time updates
      const unsub = fbSubscribeToRoom(room.id, (updatedRoom) => {
        if (updatedRoom) {
          // If room status is 'playing', we are no longer in lobby
          const gameStarted = updatedRoom.status === 'playing' || updatedRoom.status === 'finished';
          set({ room: updatedRoom, isInLobby: !gameStarted });
        }
      });

      set({
        room,
        isHost: true,
        isInLobby: true,
        status: 'connected',
        _unsub: unsub,
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to create room';
      console.error('Create game error:', msg);
      set({ status: 'error', error: msg });
    }
  },

  joinGame: async (roomCode: string, playerName: string) => {
    set({ status: 'connecting', error: null });

    try {
      // Step 1: Auth
      const uid = await firebaseSignIn();
      set({ userId: uid });

      // Step 2: Join
      const room = await fbJoinRoom(roomCode, uid, playerName);

      if (!room) {
        set({
          status: 'error',
          error: `Room "${roomCode}" not found. Check the code and try again.`,
        });
        return false;
      }

      // Step 3: Subscribe to room updates
      const unsub = fbSubscribeToRoom(room.id, (updatedRoom) => {
        if (updatedRoom) {
          // If room status is 'playing', we are no longer in lobby
          const gameStarted = updatedRoom.status === 'playing' || updatedRoom.status === 'finished';
          set({ room: updatedRoom, isInLobby: !gameStarted });
        } else {
          set({ room: null, isInLobby: false, status: 'idle' });
        }
      });

      // Step 4: Subscribe to game state updates (joiner receives host's game state)
      const unsubGS = fbSubscribeToGameState(room.id, async (remoteState) => {
        if (remoteState && !get().isHost) {
          console.log('📡 Received game state from host, phase:', remoteState.phase);

          // Import gameStore dynamically to avoid circular dependency
          const { useGameStore } = await import('./gameStore');

          // Apply the host's game state to the local store
          useGameStore.setState({
            ...remoteState,
          });

          // If we received a non-lobby phase, ensure we leave the lobby view
          if (remoteState.phase && remoteState.phase !== 'lobby') {
            set({ isInLobby: false });
          }
        }
      });

      set({
        room,
        isHost: false,
        isInLobby: room.status === 'waiting',
        status: 'connected',
        _unsub: unsub,
        _unsubGameState: unsubGS,
      });
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
    if (room && userId) {
      fbLeaveRoom(room.id, userId).catch(() => { });
    }
    set({
      room: null,
      isHost: false,
      isInLobby: false,
      status: 'idle',
      error: null,
      _unsub: null,
      _unsubGameState: null,
    });
  },

  startGame: async () => {
    const { room } = get();
    if (!room) return;
    await fbUpdateStatus(room.id, 'playing');
  },

  pushGameState: async (gameState: any) => {
    const { room, isHost } = get();
    if (!room || !isHost) return;
    await fbSetGameState(room.id, gameState);
  },

  getPlayers: () => {
    const { room } = get();
    if (!room || !room.players) return [];
    return Object.values(room.players);
  },
}));
