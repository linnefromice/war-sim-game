import React, { useContext } from "react";
import { ActionContext } from ".";
import { MoveModeCell } from "./MoveModeCell";
import { AttackModeCell } from "./AttackModeCell";
import { IdleCell } from "./IdleCell";

export const Cell = React.memo(({ x, y, unitId }: { x: number, y: number, unitId?: number }) => {
  const { uiState: actionMenu } = useContext(ActionContext);
  const isCursor = actionMenu.cursorPosition?.x === x && actionMenu.cursorPosition?.y === y;

  const wrapWithCursor = (cell: React.ReactElement) => {
    if (!isCursor) return cell;
    return <div className="cell-cursor-wrapper">{cell}</div>;
  };

  if (actionMenu.targetUnitId) {
    const targetUnitId = actionMenu.targetUnitId;
    if (targetUnitId === unitId) {
      return wrapWithCursor(<IdleCell x={x} y={y} unitId={unitId} />);
    }

    if (actionMenu.activeActionOption === "MOVE") {
      return wrapWithCursor(<MoveModeCell x={x} y={y} unitId={unitId} targetUnitId={targetUnitId} />);
    }
    if (actionMenu.activeActionOption === "ATTACK") {
      const selectedArmamentIdx = actionMenu.selectedArmamentIdx ?? 0;
      return wrapWithCursor(<AttackModeCell x={x} y={y} unitId={unitId} targetUnitId={targetUnitId} selectedArmamentIdx={selectedArmamentIdx} />);
    }
  }

  return wrapWithCursor(<IdleCell x={x} y={y} unitId={unitId} />);
});

Cell.displayName = "Cell";
