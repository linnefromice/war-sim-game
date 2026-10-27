import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Stage } from "./pages/Stage";
import { loadGame } from "./game/saveLoad";
import { AIDifficulty } from "./game/ai";
import { GameState } from "./game/types";
import { findScenario, scenarios } from "./scenarios";
import { Scenario } from "./types/scenario";
import "./pages/Stage/ScenarioSelect.scss";

type Session = { scenario: Scenario; difficulty?: AIDifficulty; loadedState?: GameState };
const App = () => {
  const [restartKey, setRestartKey] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState("");
  const handleLoad = () => {
    const saved = loadGame();
    const scenario = saved && findScenario(saved.scenarioId);
    if (!saved || !scenario) {
      setLoadError("再開できるセーブがありません。シナリオを選んで開始してください。");
      return;
    }
    setSession({ scenario, difficulty: saved.difficulty, loadedState: saved.gameState });
    setRestartKey(k => k + 1);
  };
  return (
    <ErrorBoundary>
      {session === null ? (
        <main className="scenario-select">
          <h1>シナリオ選択</h1>
          <p>ローカル2人交代。同じ端末で、青のPlayer 1と赤のPlayer 2を交代で操作します。</p>
          <div className="scenario-cards">
            {scenarios.map(scenario => (
              <article key={scenario.id}>
                <h2>{scenario.name}</h2>
                <p>{scenario.description ?? "従来のtutorial。3兵種と地形を試す大きな演習マップ。"}</p>
                <p>{scenario.gridSize.cols} × {scenario.gridSize.rows} · {scenario.units.length}ユニット · 敵の全滅で勝利</p>
                <button onClick={() => { setSession({ scenario }); setLoadError(""); }}>「{scenario.name}」を開始</button>
              </article>
            ))}
          </div>
          <button onClick={handleLoad}>保存した対戦を再開</button>
          <p>保存は1件です。旧バージョンのCPU対戦セーブは元のモードで再開します。</p>
          {loadError && <p role="alert">{loadError}</p>}
        </main>
      ) : (
        <Stage key={restartKey} scenario={session.scenario} difficulty={session.difficulty}
          loadedState={session.loadedState}
          onRestart={() => { setSession({ scenario: session.scenario, difficulty: session.difficulty }); setRestartKey(k => k + 1); }}
          onMenu={() => { setSession(null); setLoadError(""); }} />
      )}
    </ErrorBoundary>
  );
};
export default App;
