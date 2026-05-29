import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  const phase = useGameStore(s => s.phase);
  const isInLobby = useRoomStore(s => s.isInLobby);
  const status = useRoomStore(s => s.status);
  const isHost = useRoomStore(s => s.isHost);
  const room = useRoomStore(s => s.room);

  // Show Lobby when:
  // 1. Game is in 'lobby' phase, OR
  // 2. We are in the room lobby waiting for host to start
  if (phase === 'lobby' || (isInLobby && status === 'connected')) {
    return (
      <ErrorBoundary>
        <Lobby />
      </ErrorBoundary>
    );
  }

  // If room status is 'playing' but we're not the host and phase is still 'lobby',
  // the game state hasn't arrived yet — Lobby handles this with a waiting screen
  // via the `!rs.isInLobby && !rs.isHost && rs.room && phase === 'lobby'` check

  // Any non-lobby phase → show the game board
  return (
    <ErrorBoundary>
      <GameBoard />
    </ErrorBoundary>
  );
}

export default App;
