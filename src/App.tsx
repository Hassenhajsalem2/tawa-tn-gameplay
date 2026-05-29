import { useGameStore } from '@/store/gameStore';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';

function App() {
  const phase = useGameStore(s => s.phase);

  if (phase === 'lobby') {
    return <Lobby />;
  }

  return <GameBoard />;
}

export default App;
