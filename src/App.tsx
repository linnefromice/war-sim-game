import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Stage } from "./pages/Stage";
import { DifficultySelect } from "./pages/Stage/DifficultySelect";
import { AIDifficulty } from "./game/ai";

const App = () => {
  const [restartKey, setRestartKey] = useState(0);
  const [difficulty, setDifficulty] = useState<AIDifficulty | null>(null);

  const handleRestart = () => {
    setDifficulty(null);
    setRestartKey(k => k + 1);
  };

  return (
    <ErrorBoundary>
      {difficulty === null ? (
        <DifficultySelect onSelect={setDifficulty} />
      ) : (
        <Stage key={restartKey} difficulty={difficulty} onRestart={handleRestart} />
      )}
    </ErrorBoundary>
  );
};

export default App
