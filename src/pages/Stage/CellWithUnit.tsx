import React, { useContext } from "react";
import { ActionContext } from ".";
import { calculateOrientation, getPlayer, loadUnit } from "../../game/gameReducer";
import { UnitIcon } from "./UnitIcon";
import { tutorialScenario } from "../../scenarios/tutorial";

const hpBarColor = (current: number, max: number): string => {
  const ratio = current / max;
  if (ratio > 0.5) return "#4CAF50";
  if (ratio > 0.25) return "#FF9800";
  return "#F44336";
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
        <div style={{
          position: "absolute",
          top: "1px",
          left: "1px",
          display: "flex",
          gap: "1px",
          zIndex: 1,
        }}>
          {status.moved && (
            <span style={{
              fontSize: "0.5rem",
              backgroundColor: "rgba(100, 100, 100, 0.7)",
              color: "white",
              padding: "0px 2px",
              borderRadius: "2px",
              lineHeight: 1.3,
            }}>
              移動済
            </span>
          )}
          {status.attacked && (
            <span style={{
              fontSize: "0.5rem",
              backgroundColor: "rgba(180, 0, 0, 0.7)",
              color: "white",
              padding: "0px 2px",
              borderRadius: "2px",
              lineHeight: 1.3,
            }}>
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
              className="stat-bar-fill"
              style={{
                width: `${hpRatio}%`,
                backgroundColor: hpBarColor(status.hp, spec.max_hp),
              }}
            />
          </div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${enRatio}%`,
                backgroundColor: "#2196F3",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

CellWithUnit.displayName = "CellWithUnit";
