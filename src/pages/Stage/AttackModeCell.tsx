import React, { useContext, useState } from "react";
import { ActionContext } from ".";
import { calculateDamage, loadUnit } from "../../game/gameReducer";
import { CellWithUnit } from "./CellWithUnit";
import { TerrainTooltip } from "./TerrainTooltip";
import { getTerrainClass, isWithinRange } from "./cellUtils";
import { useScenario } from "../../contexts/ScenarioContext";

export const AttackModeCell = React.memo(({ x, y, unitId, targetUnitId, selectedArmamentIdx }: { x: number, y: number, unitId?: number, targetUnitId: number, selectedArmamentIdx: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
  const scenario = useScenario();
  const [hovered, setHovered] = useState(false);
  const targetUnit = loadUnit(targetUnitId, units);
  const { spec, status } = targetUnit;
  const attack_range = spec.armaments[selectedArmamentIdx].range;

  if (isWithinRange(status.coordinate, { x, y }, attack_range)) {
    if (unitId) {
      // Calculate damage preview with terrain defense
      const target = loadUnit(unitId, units);
      const weapon = spec.armaments[selectedArmamentIdx];
      const targetTerrain = scenario.terrain[target.status.coordinate.y][target.status.coordinate.x];
      const { damage: predictedDamage, modifiers } = calculateDamage(targetUnit, target, weapon, targetTerrain, units);
      const remainingHp = Math.max(0, target.status.hp - predictedDamage);
      const isLethal = remainingHp === 0;

      return (
        <div
          className="cell-attack-target-wrapper"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <CellWithUnit
            unitId={unitId}
            onClick={() => dispatch({
              type: "DO_ATTACK",
              payload: {
                running_unit_id: targetUnitId,
                action: {
                  target_unit_id: unitId,
                  armament_idx: selectedArmamentIdx
                }
              }
            })}
          />
          <div className={`damage-preview${isLethal ? " damage-preview--lethal" : ""}`}>
            <div className="damage-preview-damage">{`-${predictedDamage} HP`}</div>
            <div className="damage-preview-remaining">{`\u2192 ${remainingHp} HP`}</div>
            {modifiers.map((mod, i) => (
              <div key={i} className="damage-preview-modifier">{mod}</div>
            ))}
            {isLethal && <div className="damage-preview-lethal">DESTROY</div>}
          </div>
        </div>
      );
    }

    return <div
      className="cell cell-attack-range"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => dispatch({ type: "CLOSE_MENU" })}
    >
      {hovered && <TerrainTooltip x={x} y={y} />}
    </div>; // NOTE: not to attack
  }

  if (unitId) {
    return <CellWithUnit
      unitId={unitId}
      onClick={() => null}
    />;
  }

  return (
    <div
      className={`cell${getTerrainClass(scenario.terrain[y][x])}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <TerrainTooltip x={x} y={y} />}
    </div>
  );
});

AttackModeCell.displayName = "AttackModeCell";
