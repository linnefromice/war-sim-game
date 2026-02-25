import { useContext } from "react";
import { ActionContext } from "./index";
import { loadUnit } from "../../game/gameReducer";
import { useScenario } from "../../contexts/ScenarioContext";
import { UnitIcon } from "./UnitIcon";
import { UNIT_ABILITIES, playerColor } from "../../constants";

export const UnitDetailPanel = () => {
  const {
    gameState: { units, activePlayerId },
    uiState,
  } = useContext(ActionContext);
  const scenario = useScenario();

  const displayUnitId = uiState.targetUnitId ?? uiState.inspectedUnitId;

  if (!displayUnitId) {
    return (
      <div className="unit-detail-panel unit-detail-panel--empty">
        <div className="unit-detail-panel-placeholder">
          ユニットを選択
        </div>
      </div>
    );
  }

  const { spec, status, playerId } = loadUnit(displayUnitId, units);
  const isEnemy = playerId !== activePlayerId;
  const player = scenario.players.find(p => p.id === playerId);
  const color = player ? playerColor(player.rgb) : "white";

  const hpPercent = (status.hp / spec.max_hp) * 100;
  const enPercent = (status.en / spec.max_en) * 100;

  return (
    <div className="unit-detail-panel">
      {/* Portrait */}
      <div className="unit-detail-panel-portrait">
        <UnitIcon unitType={spec.unit_type} className="" />
      </div>

      {/* Unit name */}
      <div className="unit-detail-panel-name" style={{ color }}>
        {spec.name}
        {isEnemy && <span className="unit-detail-panel-enemy-badge">(敵)</span>}
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

      {/* Ability */}
      <div className="unit-detail-panel-ability">
        <div className="unit-detail-panel-ability-title">ABILITY</div>
        <div className="unit-detail-panel-ability-content">
          <span className="unit-detail-panel-ability-name">{UNIT_ABILITIES[spec.unit_type].name}</span>
          <span className="unit-detail-panel-ability-desc">{UNIT_ABILITIES[spec.unit_type].description}</span>
        </div>
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
