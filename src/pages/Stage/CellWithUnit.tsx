import React, { useContext } from "react";
import { ActionContext } from ".";
import { calculateOrientation, getPlayer, loadUnit } from "../../game/gameReducer";
import { UnitIcon } from "./UnitIcon";
import { tutorialScenario } from "../../scenarios/tutorial";

const hpBarClass = (current: number, max: number): string => {
  const ratio = current / max;
  if (ratio > 0.5) return "stat-bar-fill--healthy";
  if (ratio > 0.25) return "stat-bar-fill--warning";
  return "stat-bar-fill--critical";
};

export const CellWithUnit = React.memo(({ unitId, onClick }: { unitId: number, onClick: () => void }) => {
  const { gameState: { units }, uiState: actionMenu } = useContext(ActionContext);
  const { spec, status, playerId } = loadUnit(unitId, units);
  const { rgb } = getPlayer(playerId, tutorialScenario.players);

  const orientation = calculateOrientation(
    status.coordinate,
    status.previousCoordinate
  );

  const isExhausted = status.moved && status.attacked;
  const isActive = actionMenu.targetUnitId === unitId;

  const cellClassNames = [
    "cell",
    isActive ? "cell-active-unit" : "cell-unit",
    isExhausted ? "cell-exhausted" : "",
  ].filter(Boolean).join(" ");

  const bgColor = isExhausted
    ? "rgba(0, 0, 0, 0.125)"
    : isActive
      ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.375)`
      : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.125)`;

  let cellContentClassForOrientation = "";
  if (orientation === "RIGHT") cellContentClassForOrientation = "rotate-90";
  if (orientation === "DOWN") cellContentClassForOrientation = "rotate-180";
  if (orientation === "LEFT") cellContentClassForOrientation = "rotate-270";

  const hpRatio = (status.hp / spec.max_hp) * 100;
  const enRatio = (status.en / spec.max_en) * 100;

  return (
    <div
      className={cellClassNames}
      style={{ backgroundColor: bgColor, position: "relative" }}
      onClick={onClick}
    >
      {!isExhausted && (status.moved || status.attacked) && (
        <div className="cell-badge-container">
          {status.moved && (
            <span className="cell-badge cell-badge--moved">
              移動済
            </span>
          )}
          {status.attacked && (
            <span className="cell-badge cell-badge--attacked">
              攻撃済
            </span>
          )}
        </div>
      )}
      <div className="cell-content">
        <div className="cell-content-image">
          <UnitIcon
            unitType={spec.unit_type}
            className={cellContentClassForOrientation}
          />
        </div>
        <div className="stat-bars">
          <div className="stat-bar">
            <div
              className={`stat-bar-fill ${hpBarClass(status.hp, spec.max_hp)}`}
              style={{ width: `${hpRatio}%` }}
            />
          </div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill stat-bar-fill--en"
              style={{ width: `${enRatio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

CellWithUnit.displayName = "CellWithUnit";
