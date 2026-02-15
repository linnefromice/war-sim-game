import React, { useContext } from "react";
import { ActionContext } from ".";
import { CellWithUnit } from "./CellWithUnit";

export const IdleCell = React.memo(({ unitId }: { x: number, y: number, unitId?: number }) => {
  const { dispatch } = useContext(ActionContext);
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
      className="cell"
    />
  );
});

IdleCell.displayName = "IdleCell";
