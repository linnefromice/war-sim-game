import React, { useContext, useState } from "react";
import { ActionContext } from ".";
import { CellWithUnit } from "./CellWithUnit";
import { TerrainTooltip } from "./TerrainTooltip";
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

export const IdleCell = React.memo(({ x, y, unitId }: { x: number, y: number, unitId?: number }) => {
  const { dispatch } = useContext(ActionContext);
  const [hovered, setHovered] = useState(false);

  if (unitId) {
    return <CellWithUnit
      unitId={unitId}
      onClick={() => dispatch({
        type: "OPEN_MENU",
        payload: { running_unit_id: unitId }
      })}
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

IdleCell.displayName = "IdleCell";
