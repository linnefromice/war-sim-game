import { useContext, useMemo, useState } from "react";
import { ActionContext } from "./index";
import { loadUnit } from "../../game/gameReducer";
import { tutorialScenario } from "../../scenarios/tutorial";

// Layout constants matching cell grid
const CELL_SIZE = 64;
const CELL_BORDER = 1;
const CELL_MARGIN = 1;
const STAGE_MARGIN = 4;
const CELL_INTERVAL = CELL_SIZE + (CELL_BORDER + CELL_MARGIN) * 2; // 68
const GRID_OFFSET = STAGE_MARGIN + 1; // stage margin + small offset for padding

export const ActionMenu = () => {
  const {
    gameState: { units },
    uiState: actionMenu,
    dispatch,
  } = useContext(ActionContext);
  const [isAttacking, setIsAttacking] = useState(false);

  const targetUnitId = actionMenu.targetUnitId;

  // Calculate context position near the selected unit
  // Hook must be called before any early return to satisfy Rules of Hooks
  const menuPosition = useMemo(() => {
    if (!targetUnitId) return { top: 0, left: 0, transform: "none" };

    const { status: unitStatus } = loadUnit(targetUnitId, units);
    const coord = unitStatus.coordinate;
    const gridCols = tutorialScenario.gridSize.cols;
    const showOnLeft = coord.x >= Math.ceil(gridCols / 2); // >= 7 out of 13

    // Account for stage padding (12px from .stage padding in SCSS)
    const stagePadding = 12;

    if (showOnLeft) {
      // Show to the LEFT of the unit cell
      return {
        top: GRID_OFFSET + stagePadding + coord.y * CELL_INTERVAL,
        left: GRID_OFFSET + stagePadding + coord.x * CELL_INTERVAL - 8, // 8px gap
        transform: "translateX(-100%)",
      };
    } else {
      // Show to the RIGHT of the unit cell
      return {
        top: GRID_OFFSET + stagePadding + coord.y * CELL_INTERVAL,
        left: GRID_OFFSET + stagePadding + coord.x * CELL_INTERVAL + CELL_INTERVAL + 8, // 8px gap
        transform: "none",
      };
    }
  }, [targetUnitId, units]);

  if (!targetUnitId) return <></>;

  const { spec, status, playerId } = loadUnit(targetUnitId, units);

  const hpPercent = (status.hp / spec.max_hp) * 100;
  const enPercent = (status.en / spec.max_en) * 100;

  const player = tutorialScenario.players.find((p) => p.id === playerId);
  const playerColor = player
    ? `rgb(${player.rgb[0]}, ${player.rgb[1]}, ${player.rgb[2]})`
    : "white";

  return (
    <div
      className="action-menu"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        transform: menuPosition.transform,
      }}
    >
      {/* Unit summary header */}
      <div className="action-menu-header">
        <div className="action-menu-header-name" style={{ color: playerColor }}>
          {spec.name}
        </div>
        <div className="action-menu-header-bars">
          <div className="action-menu-header-stat">
            <span
              className="action-menu-header-stat-label"
              style={{ color: "#4ade80" }}
            >
              HP
            </span>
            <div className="action-menu-header-stat-bar">
              <div
                className="action-menu-header-stat-bar-fill action-menu-header-stat-bar-fill--hp"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className="action-menu-header-stat-value">
              {status.hp}/{spec.max_hp}
            </span>
          </div>
          <div className="action-menu-header-stat">
            <span
              className="action-menu-header-stat-label"
              style={{ color: "#60a5fa" }}
            >
              EN
            </span>
            <div className="action-menu-header-stat-bar">
              <div
                className="action-menu-header-stat-bar-fill action-menu-header-stat-bar-fill--en"
                style={{ width: `${enPercent}%` }}
              />
            </div>
            <span className="action-menu-header-stat-value">
              {status.en}/{spec.max_en}
            </span>
          </div>
        </div>
      </div>

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
