import { useContext, useMemo, useState } from "react";
import "./GameOverOverlay.scss";
import { ActionContext } from "./index";
import { getPlayer } from "../../game/gameReducer";
import { useScenario } from "../../contexts/ScenarioContext";
import { ReplayViewer } from "./ReplayViewer";
import { computeStatistics, BattleStatistics } from "../../game/statistics";

export const GameOverOverlay = ({ winnerId }: { winnerId: number }) => {
  const scenario = useScenario();
  const winner = getPlayer(winnerId, scenario.players);
  const { gameState, onRestart } = useContext(ActionContext);
  const [showReplay, setShowReplay] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const stats = useMemo(
    () => computeStatistics(gameState.history, scenario.units, scenario),
    [gameState.history, scenario],
  );

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
          <button className="game-over-btn" onClick={() => setShowStats(s => !s)}>
            統計
          </button>
        </div>
      </div>
      {showStats && <StatsPanel stats={stats} />}
      {showReplay && (
        <ReplayViewer
          history={gameState.history}
          initialUnits={scenario.units}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
};

const StatsPanel = ({ stats }: { stats: BattleStatistics }) => {
  const scenario = useScenario();
  const mvpEntry = stats.mvpUnitId ? stats.perUnit.get(stats.mvpUnitId) : null;
  const mvpName = mvpEntry ? mvpEntry.name : "—";

  return (
    <div className="stats-panel">
      <div className="stats-panel-header">
        <h3 className="stats-panel-title">Battle Statistics</h3>
        <span className="stats-panel-turns">Turn {stats.turnCount}</span>
      </div>

      {/* MVP */}
      {mvpEntry && (
        <div className="stats-panel-mvp">
          <span className="stats-panel-mvp-label">MVP</span>
          <span className="stats-panel-mvp-name">{mvpName}</span>
          <span className="stats-panel-mvp-damage">{mvpEntry.damageDealt} DMG</span>
        </div>
      )}

      {/* Per-player comparison */}
      <div className="stats-panel-players">
        {stats.perPlayer.map(ps => {
          const player = scenario.players.find(p => p.id === ps.playerId);
          const color = player ? `rgb(${player.rgb[0]}, ${player.rgb[1]}, ${player.rgb[2]})` : "white";
          return (
            <div key={ps.playerId} className="stats-panel-player">
              <span className="stats-panel-player-name" style={{ color }}>{player?.name ?? `P${ps.playerId}`}</span>
              <div className="stats-panel-player-stats">
                <span>DMG <strong>{ps.totalDamage}</strong></span>
                <span>KILLS <strong>{ps.totalKills}</strong></span>
                <span>LOST <strong>{ps.unitsLost}</strong></span>
                <span>ALIVE <strong>{ps.unitsRemaining}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-unit breakdown */}
      <div className="stats-panel-units">
        <div className="stats-panel-units-header">
          <span>Unit</span>
          <span>DMG</span>
          <span>Kills</span>
          <span>Taken</span>
        </div>
        {Array.from(stats.perUnit.entries()).map(([unitId, entry]) => {
          const player = scenario.players.find(p => p.id === entry.playerId);
          const color = player ? `rgba(${player.rgb[0]}, ${player.rgb[1]}, ${player.rgb[2]}, 0.7)` : "white";
          return (
            <div
              key={unitId}
              className={`stats-panel-unit-row ${!entry.alive ? "stats-panel-unit-row--dead" : ""} ${unitId === stats.mvpUnitId ? "stats-panel-unit-row--mvp" : ""}`}
            >
              <span className="stats-panel-unit-name" style={{ color }}>{entry.name}</span>
              <span>{entry.damageDealt}</span>
              <span>{entry.kills}</span>
              <span>{entry.damageTaken}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
