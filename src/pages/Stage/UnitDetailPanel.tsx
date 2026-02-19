import { useContext } from "react";
import { ActionContext } from "./index";
import { loadUnit } from "../../game/gameReducer";
import { tutorialScenario } from "../../scenarios/tutorial";
import { UnitIcon } from "./UnitIcon";

export const UnitDetailPanel = () => {
  const {
    gameState: { units },
    uiState,
  } = useContext(ActionContext);

  const targetUnitId = uiState.targetUnitId;

  if (!targetUnitId) {
    return (
      <div className="unit-detail-panel unit-detail-panel--empty">
        <div className="unit-detail-panel-placeholder">
          ユニットを選択
        </div>
      </div>
    );
  }

  const { spec, status, playerId } = loadUnit(targetUnitId, units);
  const player = tutorialScenario.players.find(p => p.id === playerId);
  const playerColor = player
    ? `rgb(${player.rgb[0]}, ${player.rgb[1]}, ${player.rgb[2]})`
    : "white";

  const hpPercent = (status.hp / spec.max_hp) * 100;
  const enPercent = (status.en / spec.max_en) * 100;

  return (
    <div className="unit-detail-panel">
      {/* Portrait */}
      <div className="unit-detail-panel-portrait">
        <UnitIcon unitType={spec.unit_type} className="" />
      </div>

      {/* Unit name */}
      <div className="unit-detail-panel-name" style={{ color: playerColor }}>
        {spec.name}
      </div>

      {/* HP bar */}
      <div className="unit-detail-panel-stat">
        <span className="unit-detail-panel-stat-label" style={{ color: "var(--color-hp)" }}>HP</span>
        <div className="unit-detail-panel-stat-bar">
          <div
            className="unit-detail-panel-stat-bar-fill unit-detail-panel-stat-bar-fill--hp"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="unit-detail-panel-stat-value">{status.hp}/{spec.max_hp}</span>
      </div>

      {/* EN bar */}
      <div className="unit-detail-panel-stat">
        <span className="unit-detail-panel-stat-label" style={{ color: "var(--color-en)" }}>EN</span>
        <div className="unit-detail-panel-stat-bar">
          <div
            className="unit-detail-panel-stat-bar-fill unit-detail-panel-stat-bar-fill--en"
            style={{ width: `${enPercent}%` }}
          />
        </div>
        <span className="unit-detail-panel-stat-value">{status.en}/{spec.max_en}</span>
      </div>

      {/* Armament list (read-only) */}
      <div className="unit-detail-panel-armaments">
        <div className="unit-detail-panel-armaments-title">ARMAMENTS</div>
        {spec.armaments.map((armament, idx) => (
          <div key={idx} className="unit-detail-panel-armament">
            <span className="unit-detail-panel-armament-name">{armament.name}</span>
            <div className="unit-detail-panel-armament-stats">
              <span>POW <strong>{armament.value}</strong></span>
              <span>EN <strong>{armament.consumed_en}</strong></span>
              <span>RNG <strong>{armament.range}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
