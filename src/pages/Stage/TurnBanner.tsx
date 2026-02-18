import { useContext } from "react";
import { ActionContext } from "./index";
import { getPlayer } from "../../game/gameReducer";
import { tutorialScenario } from "../../scenarios/tutorial";

const AI_PLAYER_ID = 2;

export const TurnBanner = () => {
  const { gameState } = useContext(ActionContext);

  const activePlayer = getPlayer(gameState.activePlayerId, tutorialScenario.players);
  const player1 = tutorialScenario.players[0];
  const player2 = tutorialScenario.players[1];
  const player1Units = gameState.units.filter(u => u.playerId === 1);
  const player2Units = gameState.units.filter(u => u.playerId === 2);

  return (
    <div className="turn-banner">
      {/* Left badge */}
      <div className="turn-banner-badge">
        <span
          className="turn-banner-badge-name"
          style={{ color: `rgb(${player1.rgb[0]}, ${player1.rgb[1]}, ${player1.rgb[2]})` }}
        >
          {player1.name}
        </span>
        <span className="turn-banner-badge-count">{player1Units.length} Units</span>
      </div>

      {/* Center: active turn indicator */}
      <div className="turn-banner-center">
        <span
          className="turn-banner-center-name"
          style={{ color: `rgb(${activePlayer.rgb[0]}, ${activePlayer.rgb[1]}, ${activePlayer.rgb[2]})` }}
        >
          {activePlayer.name}
        </span>
        <span className="turn-banner-center-label">TURN</span>
        {gameState.activePlayerId === AI_PLAYER_ID && (
          <span className="turn-banner-ai-badge">AI</span>
        )}
      </div>

      {/* Right badge */}
      <div className="turn-banner-badge">
        <span
          className="turn-banner-badge-name"
          style={{ color: `rgb(${player2.rgb[0]}, ${player2.rgb[1]}, ${player2.rgb[2]})` }}
        >
          {player2.name}
        </span>
        <span className="turn-banner-badge-count">{player2Units.length} Units</span>
      </div>
    </div>
  );
};
