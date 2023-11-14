import { useContext } from "react";
import { ActionContext } from ".";
import { calculateOrientation, getPlayer, loadUnit } from "./logics";
import { UnitIcon } from "./UnitIcon";
import { Coordinate, PayloadAttackActionType, PayloadMoveActionType } from "../../types";
import { PLAYERS } from "../../constants";

const isWithinRange = (src: Coordinate, dst: Coordinate, range: number): boolean => {
  const diffX = Math.abs(src.x - dst.x);
  const diffY = Math.abs(src.y - dst.y);
  return diffX + diffY <= range;
}

const statusColor = (current: number, max: number): string => {
  if (current === max) return "#93C572"; // pistachio
  if (current <= max * 0.5) return "#FFAA33"; // yellow orange
  return "";
}
const CellWithUnit = ({ unitId, key, onClick }: { unitId: number, key: string, onClick: () => void }) => {
  const { state: { units, actionMenu } } = useContext(ActionContext);
  const { spec, status, playerId } = loadUnit(unitId, units);
  const { rgb } = getPlayer(playerId, PLAYERS)

  const orientation = calculateOrientation(
    status.coordinate,
    status.previousCoordinate
  );

  const cellClassName = actionMenu.targetUnitId === unitId
    ? "cell cell-active-unit"
    : "cell cell-unit";
  const bgColor = status.moved && status.attacked
    ? "rgba(0, 0, 0, 0.125)"
    : actionMenu.targetUnitId === unitId
      ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.375)`
      : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.125)`;

  let cellContentClassForOrientation = "";
  if (orientation === "RIGHT") cellContentClassForOrientation = "rotate-90";
  if (orientation === "DOWN") cellContentClassForOrientation = "rotate-180";
  if (orientation === "LEFT") cellContentClassForOrientation = "rotate-270";

  return (
    <div
      key={key}
      className={cellClassName}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      <div className="cell-content">
        <div className="cell-content-image">
          <UnitIcon
            unitType={spec.unit_type}
            className={cellContentClassForOrientation}
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
  )
}

export const Cell = ({ x, y, unitId }: { x: number, y: number, unitId?: number }) => {
  const { state: { units, actionMenu }, dispatch } = useContext(ActionContext);
  const key = `cell.x${x}y${y}`

  if (actionMenu.targetUnitId) {
    const targetUnitId = actionMenu.targetUnitId;
    if (targetUnitId === unitId) {
      return <CellWithUnit
        unitId={unitId}
        key={key}
        onClick={() => dispatch({
          type: "OPEN_MENU",
          payload: { running_unit_id: unitId }
        })}
      /> // TODO: consider background by action
    }

    const { spec, status } = loadUnit(targetUnitId, units);

    if (actionMenu.activeActionOption === "MOVE") {
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
                    } as PayloadMoveActionType
                  }
                })
              }
            />
      }
    }
    if (actionMenu.activeActionOption === "ATTACK") {
      const selectedArmamentIdx = actionMenu.selectedArmamentIdx || 0; // temp
      const attack_range = spec.armaments[selectedArmamentIdx].range;
      if (isWithinRange(status.coordinate, { x, y }, attack_range)) {
        return unitId
          ? <CellWithUnit
              unitId={unitId}
              key={key}
              onClick={() => dispatch({
                type: "DO_ATTACK",
                payload: {
                  running_unit_id: targetUnitId,
                  action: {
                    target_unit_id: unitId,
                    armament_idx: selectedArmamentIdx
                  } as PayloadAttackActionType
                }
              })}
            />
          : <div
              key={key}
              className="cell cell-attack-range"
              onClick={() => dispatch({ type: "CLOSE_MENU" })}
            /> // NOTE: not to attack / TODO: clean
      }
    }
  }

  if (unitId) {
    return <CellWithUnit
      unitId={unitId}
      key={key}
      onClick={() => dispatch({
        type: "OPEN_MENU",
        payload: { running_unit_id: unitId }
      })}
    />
  }

  return (
    <div
      key={key}
      className="cell"
    />
  );
}