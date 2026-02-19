import { useContext, useState } from "react";
import "./GameOverOverlay.scss";
import { ActionContext } from "./index";
import { getPlayer } from "../../game/gameReducer";
import { tutorialScenario } from "../../scenarios/tutorial";
import { ReplayViewer } from "./ReplayViewer";

export const GameOverOverlay = ({ winnerId }: { winnerId: number }) => {
  const winner = getPlayer(winnerId, tutorialScenario.players);
  const { gameState, onRestart } = useContext(ActionContext);
  const [showReplay, setShowReplay] = useState(false);

  return (
    <div className="game-over-overlay">
      <div className="game-over-panel">
        <p className="game-over-panel-title">{`Player ${winner.id} Wins!`}</p>
        <p className="game-over-panel-winner">{winner.name}</p>
        <div className="game-over-panel-actions">
          <button className="game-over-btn" onClick={onRestart}>
            Restart
          </button>
          <button className="game-over-btn" onClick={() => setShowReplay(true)}>
            リプレイ
          </button>
        </div>
      </div>
      {showReplay && (
        <ReplayViewer
          history={gameState.history}
          initialUnits={tutorialScenario.units}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
};
