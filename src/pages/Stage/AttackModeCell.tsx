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
    return unitId
      ? <CellWithUnit
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
      : <div
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
