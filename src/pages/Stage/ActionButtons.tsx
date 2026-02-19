import { useContext, useMemo, useState } from "react";
import { ActionContext } from "./index";
import { loadUnit } from "../../game/gameReducer";
import { useScenario } from "../../contexts/ScenarioContext";
import { CELL_INTERVAL, GRID_OFFSET, STAGE_PADDING } from "./layoutConstants";

export const ActionButtons = () => {
  const {
    gameState: { units },
    uiState: actionMenu,
    dispatch,
  } = useContext(ActionContext);
  const [isAttacking, setIsAttacking] = useState(false);
  const scenario = useScenario();

  const targetUnitId = actionMenu.targetUnitId;

  const menuPosition = useMemo(() => {
    if (!targetUnitId) return { top: 0, left: 0, transform: "none" };

    const { status: unitStatus } = loadUnit(targetUnitId, units);
    const coord = unitStatus.coordinate;
    const gridCols = scenario.gridSize.cols;
    const gridRows = scenario.gridSize.rows;

    const showOnLeft = coord.x >= Math.ceil(gridCols / 2);
    const showAbove = coord.y >= Math.ceil(gridRows / 2);

    const transformParts: string[] = [];

    let top: number;
    if (showAbove) {
      top = GRID_OFFSET + STAGE_PADDING + (coord.y + 1) * CELL_INTERVAL;
      transformParts.push("translateY(-100%)");
    } else {
      top = GRID_OFFSET + STAGE_PADDING + coord.y * CELL_INTERVAL;
    }

    let left: number;
    if (showOnLeft) {
      left = GRID_OFFSET + STAGE_PADDING + coord.x * CELL_INTERVAL - 8;
      transformParts.push("translateX(-100%)");
    } else {
      left = GRID_OFFSET + STAGE_PADDING + coord.x * CELL_INTERVAL + CELL_INTERVAL + 8;
    }

    return {
      top,
      left,
      transform: transformParts.length > 0 ? transformParts.join(" ") : "none",
    };
  }, [targetUnitId, units, scenario.gridSize]);

  if (!targetUnitId) return <></>;

  const { spec, status } = loadUnit(targetUnitId, units);

  return (
    <div
      className="action-buttons"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        transform: menuPosition.transform,
      }}
    >
      {/* Move button */}
      <button
        className={
          actionMenu.activeActionOption === "MOVE"
            ? "action-menu-btn action-menu-btn-move-active"
            : "action-menu-btn"
        }
        onClick={() => {
          setIsAttacking(false);
          dispatch({
            type: "SELECT_MOVE",
            payload: { running_unit_id: spec.id },
          });
        }}
        disabled={status.moved}
      >
        移動
      </button>

      {/* Undo Move button */}
      <button
        className="action-menu-btn"
        onClick={() => {
          setIsAttacking(false);
          dispatch({
            type: "UNDO_MOVE",
            payload: { running_unit_id: spec.id },
          });
        }}
        disabled={!status.moved || status.attacked}
      >
        戻す
      </button>

      {/* Attack button */}
      <button
        className={
          isAttacking
            ? "action-menu-btn action-menu-btn-attack-selected"
            : "action-menu-btn"
        }
        onClick={() => setIsAttacking(!isAttacking)}
        disabled={status.attacked}
      >
        攻撃
      </button>

      {/* Weapon sub-menu */}
      {isAttacking && (
        <div className="action-sub-menu">
          {spec.armaments.map((armament, idx) => {
            const isActive =
              actionMenu.activeActionOption === "ATTACK" &&
              actionMenu.selectedArmamentIdx === idx;
            const isDisabled =
              status.attacked || armament.consumed_en > status.en;

            return (
              <div
                key={`action-sub-menu.${idx}`}
                className={[
                  "action-sub-menu-item",
                  isActive && "action-sub-menu-item--active",
                  isDisabled && "action-sub-menu-item--disabled",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (isDisabled) return;
                  dispatch({
                    type: "SELECT_ATTACK",
                    payload: {
                      running_unit_id: spec.id,
                      action: {
                        target_unit_id: targetUnitId,
                        armament_idx: idx,
                      },
                    },
                  });
                }}
              >
                <span className="action-sub-menu-item-name">
                  {armament.name}
                </span>
                <div className="action-sub-menu-description">
                  <span className="action-sub-menu-description-stat">
                    POW <span>{armament.value}</span>
                  </span>
                  <span className="action-sub-menu-description-stat">
                    EN <span>{armament.consumed_en}</span>
                  </span>
                  <span className="action-sub-menu-description-stat">
                    RANGE <span>{armament.range}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Separator */}
      <div className="action-menu-separator" />

      {/* End Turn button */}
      <button
        className="action-menu-btn action-menu-btn-end-turn"
        onClick={() => dispatch({ type: "TURN_END" })}
      >
        確定
      </button>

      {/* Close button */}
      <button
        className="action-menu-btn action-menu-btn-close"
        onClick={() => dispatch({ type: "CLOSE_MENU" })}
      >
        閉じる
      </button>
    </div>
  );
};
