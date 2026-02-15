import React, { useContext } from "react";
import { ActionContext } from ".";
import { loadUnit } from "../../game/gameReducer";
import { UnitIcon } from "./UnitIcon";
import { Coordinate } from "../../types";

const isWithinRange = (src: Coordinate, dst: Coordinate, range: number): boolean => {
  const diffX = Math.abs(src.x - dst.x);
  const diffY = Math.abs(src.y - dst.y);
  return diffX + diffY <= range;
};

const statusColor = (current: number, max: number): string => {
  if (current === max) return "#93C572"; // pistachio
  if (current <= max * 0.5) return "#FFAA33"; // yellow orange
  return "";
};

const CellWithUnit = ({ unitId, key, onClick }: { unitId: number, key: string, onClick: () => void }) => {
  const { gameState: { units } } = useContext(ActionContext);
  const { spec, status } = loadUnit(unitId, units);

  return (
    <div
      key={key}
      className="cell cell-unit"
      onClick={onClick}
    >
      <div className="cell-content">
        <div className="cell-content-image">
          <UnitIcon
            unitType={spec.unit_type}
            className=""
          />
        </div>
        <div className="cell-content-text">
          <div>
            <span
              className="cell-unit-status-sm"
              style={{ color: statusColor(status.hp, spec.max_hp) }}
            >
              {status.hp}
            </span>
            <span className="cell-unit-status-xs" style={{ color: "gray" }}>{`/${spec.max_hp}`}</span>
          </div>
          <div>
            <span
              className="cell-unit-status-sm"
              style={{ color: statusColor(status.en, spec.max_en) }}
            >
              {status.en}
            </span>
            <span className="cell-unit-status-xs" style={{ color: "gray" }}>{`/${spec.max_en}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MoveModeCell = React.memo(({ x, y, unitId, targetUnitId }: { x: number, y: number, unitId?: number, targetUnitId: number }) => {
  const { gameState: { units }, dispatch } = useContext(ActionContext);
  const key = `cell.x${x}y${y}`;
  const targetUnit = loadUnit(targetUnitId, units);
  const { spec, status } = targetUnit;

  if (isWithinRange(status.coordinate, { x, y }, spec.movement_range)) {
    return unitId
      ? <CellWithUnit
          unitId={unitId}
          key={key}
          onClick={() => null}
        /> // NOTE: unable to move where the unit is.
      : <div
          key={key}
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
      key={key}
      onClick={() => null}
    />;
  }

  return (
    <div
      key={key}
      className="cell"
    />
  );
});

MoveModeCell.displayName = "MoveModeCell";
