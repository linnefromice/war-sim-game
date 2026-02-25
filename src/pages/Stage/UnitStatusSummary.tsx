import { useContext } from "react";
import { ActionContext } from "./index";
import { UnitType } from "../../types";
import { UnitIcon } from "./UnitIcon";

type UnitActionStatus = "idle" | "moved" | "attacked" | "exhausted";

const getUnitActionStatus = (unit: UnitType): UnitActionStatus => {
  if (unit.status.moved && unit.status.attacked) return "exhausted";
  if (unit.status.moved) return "moved";
  if (unit.status.attacked) return "attacked";
  return "idle";
};

const STATUS_LABELS: Record<UnitActionStatus, string> = {
  idle: "待機",
  moved: "移動済",
  attacked: "攻撃済",
  exhausted: "行動完了",
};

export const UnitStatusSummary = () => {
  const { gameState, dispatch } = useContext(ActionContext);

  const playerUnits = gameState.units
    .filter(u => u.playerId === gameState.activePlayerId)
    .sort((a, b) => a.spec.id - b.spec.id);

  if (playerUnits.length === 0) return null;

  return (
    <div className="unit-status-summary">
      {playerUnits.map(unit => {
        const status = getUnitActionStatus(unit);
        const isExhausted = status === "exhausted";

        return (
          <button
            key={unit.spec.id}
            className={`unit-status-summary-item ${isExhausted ? "unit-status-summary-item--exhausted" : ""}`}
            onClick={() => dispatch({ type: "OPEN_MENU", unitId: unit.spec.id })}
          >
            <UnitIcon unitType={unit.spec.unit_type} className="unit-status-summary-icon" />
            <span className={`unit-status-summary-badge unit-status-summary-badge--${status}`}>
              {STATUS_LABELS[status]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
