import { useContext, useState } from "react";
import { ActionContext } from "./index";
import { getPlayer } from "../../game/gameReducer";
import { useScenario } from "../../contexts/ScenarioContext";
import { saveGame } from "../../game/saveLoad";
import { AI_PLAYER_ID, playerColor } from "../../constants";

export const TurnBanner = () => {
  const { gameState, uiState, dispatch, difficulty } = useContext(ActionContext);
  const scenario = useScenario();
  const [saveFlash, setSaveFlash] = useState(false);

  const activePlayer = getPlayer(gameState.activePlayerId, scenario.players);
  const player1 = scenario.players[0];
  const player2 = scenario.players[1];
  const player1Units = gameState.units.filter(u => u.playerId === 1);
  const player2Units = gameState.units.filter(u => u.playerId === 2);

  const isEndTurnDisabled =
    gameState.activePlayerId === AI_PLAYER_ID ||
    uiState.animationState.type !== "idle" ||
    gameState.phase.type === "finished";

  return (
    <div className="turn-banner">
      {/* Left badge */}
      <div className="turn-banner-badge">
        <span
          className="turn-banner-badge-name"
          style={{ color: playerColor(player1.rgb) }}
        >
          {player1.name}
        </span>
        <span className="turn-banner-badge-count">{player1Units.length} Units</span>
      </div>

      {/* Center: active turn indicator */}
      <div className="turn-banner-center">
        <span className="turn-banner-turn-number">TURN {gameState.turnNumber}</span>
        <span
          className="turn-banner-center-name"
          style={{ color: playerColor(activePlayer.rgb) }}
        >
          {activePlayer.name}
        </span>
        <span className="turn-banner-center-label">TURN</span>
        {gameState.activePlayerId === AI_PLAYER_ID && (
          <span className="turn-banner-ai-badge">AI</span>
        )}
        <button
          className="turn-banner-end-turn-btn"
          onClick={() => dispatch({ type: "TURN_END" })}
          disabled={isEndTurnDisabled}
        >
          確定
        </button>
        <button
          className="turn-banner-end-turn-btn"
          onClick={() => {
            if (difficulty) {
              saveGame(gameState, difficulty);
              setSaveFlash(true);
              setTimeout(() => setSaveFlash(false), 1500);
            }
          }}
          disabled={gameState.phase.type === "finished" || uiState.animationState.type !== "idle"}
        >
          {saveFlash ? "保存済" : "保存"}
        </button>
      </div>

      {/* Right badge */}
      <div className="turn-banner-badge">
        <span
          className="turn-banner-badge-name"
          style={{ color: playerColor(player2.rgb) }}
        >
          {player2.name}
        </span>
        <span className="turn-banner-badge-count">{player2Units.length} Units</span>
      </div>
    </div>
  );
};
