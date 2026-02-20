import React, { useContext, useState } from "react";
import { ActionContext } from ".";
import { loadUnit } from "../../game/gameReducer";
import { CellWithUnit } from "./CellWithUnit";
import { TerrainTooltip } from "./TerrainTooltip";
import { getTerrainClass, isWithinMoveRange } from "./cellUtils";
import { useScenario } from "../../contexts/ScenarioContext";

export const MoveModeCell = React.memo(({ x, y, unitId, targetUnitId }: { x: number, y: number, unitId?: number, targetUnitId: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
  const scenario = useScenario();
  const [hovered, setHovered] = useState(false);
  const targetUnit = loadUnit(targetUnitId, units);
  const { spec, status } = targetUnit;

  if (isWithinMoveRange(status.coordinate, { x, y }, spec.movement_range)) {
    return unitId
      ? <CellWithUnit
          unitId={unitId}
          onClick={() => null}
        /> // NOTE: unable to move where the unit is.
      : <div
          className="cell cell-move-range"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={
            () => dispatch({
              type: "DO_MOVE",
              unitId: spec.id,
              move: { x, y },
            })
          }
        >
          {hovered && <TerrainTooltip x={x} y={y} />}
        </div>;
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

MoveModeCell.displayName = "MoveModeCell";
