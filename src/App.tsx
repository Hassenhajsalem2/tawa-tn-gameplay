import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const phase = useGameStore(s => s.phase);
  const isInLobby = useRoomStore(s => s.isInLobby);
  const status = useRoomStore(s => s.status);
  const isHost = useRoomStore(s => s.isHost);
  const room = useRoomStore(s => s.room);

  // Show Lobby when:
  // 1. Game is in 'lobby' phase, OR
  // 2. We are in the room lobby waiting for host to start
  const showLobby = phase === 'lobby' || (isInLobby && status === 'connected');

  // If room status is 'playing' but we're not the host and phase is still 'lobby',
  // the game state hasn't arrived yet — Lobby handles this with a waiting screen
  // via the `!rs.isInLobby && !rs.isHost && rs.room && phase === 'lobby'` check

  return (
    <ErrorBoundary>
      {showLobby ? <Lobby /> : <GameBoard />}
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
