import React, { useContext } from "react";
import { ActionContext } from ".";
import { loadUnit } from "../../game/gameReducer";
import { CellWithUnit } from "./CellWithUnit";
import { isWithinRange } from "./cellUtils";

export const AttackModeCell = React.memo(({ x, y, unitId, targetUnitId, selectedArmamentIdx }: { x: number, y: number, unitId?: number, targetUnitId: number, selectedArmamentIdx: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
  const targetUnit = loadUnit(targetUnitId, units);
  const { spec, status } = targetUnit;
  const attack_range = spec.armaments[selectedArmamentIdx].range;

  if (isWithinRange(status.coordinate, { x, y }, attack_range)) {
    if (unitId) {
      // Calculate damage preview
      const target = loadUnit(unitId, units);
      const weapon = spec.armaments[selectedArmamentIdx];
      const predictedDamage = weapon.value;
      const remainingHp = Math.max(0, target.status.hp - predictedDamage);
      const isLethal = remainingHp === 0;

      return (
        <div style={{ position: "relative" }}>
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
          <div
            className="damage-preview"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: isLethal ? "rgba(255, 0, 0, 0.85)" : "rgba(255, 100, 0, 0.75)",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: "bold",
              padding: "1px 3px",
              borderRadius: "2px",
              pointerEvents: "none",
              lineHeight: 1.2,
            }}
          >
            <div>{`-${predictedDamage}`}</div>
            <div style={{ fontSize: "0.55rem" }}>{`→${remainingHp}`}</div>
            {isLethal && <div style={{ fontSize: "0.6rem" }}>💀</div>}
          </div>
        </div>
      );
    }

    return <div
      className="cell cell-attack-range"
      onClick={() => dispatch({ type: "CLOSE_MENU" })}
    />; // NOTE: not to attack
  }

  if (unitId) {
    return <CellWithUnit
      unitId={unitId}
      onClick={() => null}
    />;
  }

  return (
    <div
      className="cell"
    />
  );
});

AttackModeCell.displayName = "AttackModeCell";
