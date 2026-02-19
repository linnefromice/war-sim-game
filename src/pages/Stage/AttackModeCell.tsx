import React, { useContext, useState } from "react";
import { ActionContext } from ".";
import { getTerrainDefenseReduction, loadUnit } from "../../game/gameReducer";
import { CellWithUnit } from "./CellWithUnit";
import { TerrainTooltip } from "./TerrainTooltip";
import { isWithinRange } from "./cellUtils";
import { tutorialScenario } from "../../scenarios/tutorial";

const TERRAIN_LABELS: Record<string, string> = {
  plain: "平地",
  forest: "森林",
  mountain: "山岳",
  water: "水域",
};

const getTerrainClass = (x: number, y: number): string => {
  const terrain = tutorialScenario.terrain[y][x];
  switch (terrain) {
    case "forest": return " cell-terrain-forest";
    case "mountain": return " cell-terrain-mountain";
    case "water": return " cell-terrain-water";
    default: return "";
  }
};

export const AttackModeCell = React.memo(({ x, y, unitId, targetUnitId, selectedArmamentIdx }: { x: number, y: number, unitId?: number, targetUnitId: number, selectedArmamentIdx: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
  const [hovered, setHovered] = useState(false);
  const targetUnit = loadUnit(targetUnitId, units);
  const { spec, status } = targetUnit;
  const attack_range = spec.armaments[selectedArmamentIdx].range;

  if (isWithinRange(status.coordinate, { x, y }, attack_range)) {
    if (unitId) {
      // Calculate damage preview with terrain defense
      const target = loadUnit(unitId, units);
      const weapon = spec.armaments[selectedArmamentIdx];
      const targetTerrain = tutorialScenario.terrain[target.status.coordinate.y][target.status.coordinate.x];
      const defenseReduction = getTerrainDefenseReduction(targetTerrain);
      const predictedDamage = Math.floor(weapon.value * (1 - defenseReduction));
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
            {defenseReduction > 0 && (
              <div className="damage-preview-terrain">
                {TERRAIN_LABELS[targetTerrain]} DEF {Math.round(defenseReduction * 100)}%
              </div>
            )}
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
      className={`cell${getTerrainClass(x, y)}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <TerrainTooltip x={x} y={y} />}
    </div>
  );
});

AttackModeCell.displayName = "AttackModeCell";
