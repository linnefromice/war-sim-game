import React, { useContext, useState } from "react";
import { ActionContext } from ".";
import { CellWithUnit } from "./CellWithUnit";
import { TerrainTooltip } from "./TerrainTooltip";
import { getTerrainClass } from "./cellUtils";
import { useScenario } from "../../contexts/ScenarioContext";

export const IdleCell = React.memo(({ x, y, unitId }: { x: number, y: number, unitId?: number }) => {
  const { dispatch } = useContext(ActionContext);
  const scenario = useScenario();
  const [hovered, setHovered] = useState(false);

  if (unitId) {
    return <CellWithUnit
      unitId={unitId}
      onClick={() => dispatch({ type: "OPEN_MENU", unitId })}
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

IdleCell.displayName = "IdleCell";
