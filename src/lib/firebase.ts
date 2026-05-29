import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off, remove } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Your Firebase config loaded dynamically from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getDatabase>;
let auth: ReturnType<typeof getAuth>;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
} catch (err) {
  console.error('Firebase init error:', err);
}

// ============================================================
// AUTH
// ============================================================
export async function firebaseSignIn(): Promise<string> {
  try {
    const result = await signInAnonymously(auth);
    console.log('✅ Firebase auth OK, uid:', result.user.uid);
    return result.user.uid;
  } catch (err: any) {
    console.error('❌ Firebase auth failed:', err?.code, err?.message);
    throw new Error(`Auth failed: ${err?.message || 'Unknown error'}`);
  }
}

// ============================================================
// ROOM TYPES
// ============================================================
export interface FBPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface FBRoom {
  id: string;
  hostId: string;
  players: Record<string, FBPlayer>;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

// ============================================================
// ROOM CODE
// ============================================================
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================
// CREATE ROOM
// ============================================================
export async function fbCreateRoom(hostId: string, hostName: string): Promise<FBRoom> {
  const roomId = generateRoomCode();
  const room: FBRoom = {
    id: roomId,
    hostId,
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        isHost: true,
        isBot: false,
        isReady: true,
        joinedAt: Date.now(),
      }
    },
    status: 'waiting',
    createdAt: Date.now(),
  };

  try {
    await set(ref(db, `rooms/${roomId}`), room);
    console.log('✅ Room created:', roomId);
    return room;
  } catch (err: any) {
    console.error('❌ Create room failed:', err?.code, err?.message);
    throw new Error(`Create room failed: ${err?.message || 'Unknown'}`);
  }
}

// ============================================================
// ADD BOT
// ============================================================
export async function fbAddBot(roomId: string, botId: string, botName: string): Promise<void> {
  const botPlayer: FBPlayer = {
    id: botId,
    name: botName,
    isHost: false,
    isBot: true,
    isReady: true,
    joinedAt: Date.now(),
  };
  await set(ref(db, `rooms/${roomId}/players/${botId}`), botPlayer);
}

// ============================================================
// JOIN ROOM
// ============================================================
export async function fbJoinRoom(roomId: string, playerId: string, playerName: string): Promise<FBRoom | null> {
  const roomCode = roomId.toUpperCase();
  
  try {
    const snapshot = await get(ref(db, `rooms/${roomCode}`));

    if (!snapshot.exists()) {
      console.log('❌ Room not found:', roomCode);
      return null;
    }

    const room = snapshot.val() as FBRoom;

    if (room.status !== 'waiting') {
      console.log('❌ Room not waiting:', room.status);
      return null;
    }

    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount >= 6) {
      console.log('❌ Room full');
      return null;
    }

    if (room.players[playerId]) {
      return room;
    }

    const player: FBPlayer = {
      id: playerId,
      name: playerName,
      isHost: false,
      isBot: false,
      isReady: true,
      joinedAt: Date.now(),
    };

    await set(ref(db, `rooms/${roomCode}/players/${playerId}`), player);
    console.log('✅ Joined room:', roomCode);

    const updated = await get(ref(db, `rooms/${roomCode}`));
    return updated.val() as FBRoom;
  } catch (err: any) {
    console.error('❌ Join room failed:', err?.code, err?.message);
    throw new Error(`Join failed: ${err?.message || 'Unknown'}`);
  }
}

// ============================================================
// LEAVE ROOM
// ============================================================
export async function fbLeaveRoom(roomId: string, playerId: string): Promise<void> {
  try {
    await remove(ref(db, `rooms/${roomId}/players/${playerId}`));
    const snapshot = await get(ref(db, `rooms/${roomId}/players`));
    if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
      await remove(ref(db, `rooms/${roomId}`));
    }
  } catch (err) {
    console.error('Leave room error:', err);
  }
}

// ============================================================
// UPDATE STATUS
// ============================================================
export async function fbUpdateStatus(roomId: string, status: FBRoom['status']): Promise<void> {
  await set(ref(db, `rooms/${roomId}/status`), status);
}

// ============================================================
// GAME STATE SYNC
// ============================================================
export async function fbSetGameState(roomId: string, gameState: any): Promise<void> {
  await set(ref(db, `rooms/${roomId}/gameState`), gameState);
}

export function fbSubscribeToGameState(roomId: string, callback: (state: any | null) => void): () => void {
  const gsRef = ref(db, `rooms/${roomId}/gameState`);
  const handler = onValue(gsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  return () => off(gsRef, 'value', handler);
}

// ============================================================
// SUBSCRIBE (real-time)
// ============================================================
export function fbSubscribeToRoom(roomId: string, callback: (room: FBRoom | null) => void): () => void {
  const roomRef = ref(db, `rooms/${roomId}`);
  const handler = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as FBRoom);
    } else {
      callback(null);
    }
  });
  return () => off(roomRef, 'value', handler);
}
