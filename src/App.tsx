import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Stage } from "./pages/Stage";
import { DifficultySelect } from "./pages/Stage/DifficultySelect";
import { AIDifficulty } from "./game/ai";
import { loadGame } from "./game/saveLoad";
import { GameState } from "./game/types";

const App = () => {
  const [restartKey, setRestartKey] = useState(0);
  const [difficulty, setDifficulty] = useState<AIDifficulty | null>(null);
  const [loadedState, setLoadedState] = useState<GameState | null>(null);

  const handleRestart = () => {
    setDifficulty(null);
    setLoadedState(null);
    setRestartKey(k => k + 1);
  };

  const handleLoad = () => {
    const saved = loadGame();
    if (saved) {
      setDifficulty(saved.difficulty);
      setLoadedState(saved.gameState);
      setRestartKey(k => k + 1);
    }
  };

  return (
    <ErrorBoundary>
      {difficulty === null ? (
        <DifficultySelect onSelect={setDifficulty} onLoad={handleLoad} />
      ) : (
        <Stage key={restartKey} difficulty={difficulty} onRestart={handleRestart} loadedState={loadedState} />
      )}
    </ErrorBoundary>
  );
};

export default App
