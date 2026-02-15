import React, { useContext } from "react";
import { ActionContext } from ".";
import { loadUnit } from "../../game/gameReducer";
import { CellWithUnit } from "./CellWithUnit";
import { isWithinRange } from "./cellUtils";

export const MoveModeCell = React.memo(({ x, y, unitId, targetUnitId }: { x: number, y: number, unitId?: number, targetUnitId: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
  const targetUnit = loadUnit(targetUnitId, units);
  const { spec, status } = targetUnit;

  if (isWithinRange(status.coordinate, { x, y }, spec.movement_range)) {
    return unitId
      ? <CellWithUnit
          unitId={unitId}
          onClick={() => null}
        /> // NOTE: unable to move where the unit is.
      : <div
          className="cell cell-move-range"
          onClick={
            () => dispatch({
              type: "DO_MOVE",
              payload: {
                running_unit_id: spec.id,
                action: {
                  x,
                  y
                }
              }
            })
          }
        />;
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

MoveModeCell.displayName = "MoveModeCell";
