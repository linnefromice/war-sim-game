import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Stage } from "./pages/Stage";

const App = () => {
  const [restartKey, setRestartKey] = useState(0);
  return (
    <ErrorBoundary>
      <Stage key={restartKey} onRestart={() => setRestartKey(k => k + 1)} />
    </ErrorBoundary>
  );
};

export default App
