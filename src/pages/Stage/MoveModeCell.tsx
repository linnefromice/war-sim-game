import React, { useContext, useState } from "react";
import { ActionContext } from ".";
import { loadUnit } from "../../game/gameReducer";
import { CellWithUnit } from "./CellWithUnit";
import { TerrainTooltip } from "./TerrainTooltip";
import { isWithinMoveRange } from "./cellUtils";
import { tutorialScenario } from "../../scenarios/tutorial";

const getTerrainClass = (x: number, y: number): string => {
  const terrain = tutorialScenario.terrain[y][x];
  switch (terrain) {
    case "forest": return " cell-terrain-forest";
    case "mountain": return " cell-terrain-mountain";
    case "water": return " cell-terrain-water";
    default: return "";
  }
};

export const MoveModeCell = React.memo(({ x, y, unitId, targetUnitId }: { x: number, y: number, unitId?: number, targetUnitId: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
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
              payload: {
                running_unit_id: spec.id,
                action: {
                  x,
                  y
                }
              }
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
      className={`cell${getTerrainClass(x, y)}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <TerrainTooltip x={x} y={y} />}
    </div>
  );
});

MoveModeCell.displayName = "MoveModeCell";
