import React, { useContext } from "react";
import { ActionContext } from ".";
import { calculateOrientation, getPlayer, loadUnit } from "../../game/gameReducer";
import { UnitIcon } from "./UnitIcon";
import { PLAYERS } from "../../constants";

const statusColor = (current: number, max: number): string => {
  if (current === max) return "#93C572"; // pistachio
  if (current <= max * 0.5) return "#FFAA33"; // yellow orange
  return "";
};

export const CellWithUnit = React.memo(({ unitId, onClick }: { unitId: number, onClick: () => void }) => {
  const { gameState: { units }, uiState: actionMenu } = useContext(ActionContext);
  const { spec, status, playerId } = loadUnit(unitId, units);
  const { rgb } = getPlayer(playerId, PLAYERS);

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
  );
});

CellWithUnit.displayName = "CellWithUnit";
