import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';

function App() {
  const phase = useGameStore(s => s.phase);
  const isInLobby = useRoomStore(s => s.isInLobby);
  const status = useRoomStore(s => s.status);

  // Show Lobby when:
  // 1. Game is in 'lobby' phase, OR
  // 2. We are in the room lobby waiting for host to start (status connected but still in lobby)
  if (phase === 'lobby' || (isInLobby && status === 'connected')) {
    return <Lobby />;
  }

  // Any non-lobby phase → show the game board
  return <GameBoard />;
}

export default App;
