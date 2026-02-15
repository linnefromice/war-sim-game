import React, { useContext } from "react";
import { ActionContext } from ".";
import { MoveModeCell } from "./MoveModeCell";
import { AttackModeCell } from "./AttackModeCell";
import { IdleCell } from "./IdleCell";

export const Cell = React.memo(({ x, y, unitId }: { x: number, y: number, unitId?: number }) => {
  const { uiState: actionMenu } = useContext(ActionContext);

  if (actionMenu.targetUnitId) {
    const targetUnitId = actionMenu.targetUnitId;
    if (targetUnitId === unitId) {
      return <IdleCell x={x} y={y} unitId={unitId} />;
    }

    if (actionMenu.activeActionOption === "MOVE") {
      return <MoveModeCell x={x} y={y} unitId={unitId} targetUnitId={targetUnitId} />;
    }
    if (actionMenu.activeActionOption === "ATTACK") {
      const selectedArmamentIdx = actionMenu.selectedArmamentIdx || 0;
      return <AttackModeCell x={x} y={y} unitId={unitId} targetUnitId={targetUnitId} selectedArmamentIdx={selectedArmamentIdx} />;
    }
  }

  return <IdleCell x={x} y={y} unitId={unitId} />;
});

Cell.displayName = "Cell";
