import { useContext, useState } from "react";
import { ActionContext } from "./index";
import { loadUnit } from "../../game/gameReducer";

export const ActionMenu = () => {
  const {
    gameState: { units },
    uiState: actionMenu,
    dispatch,
  } = useContext(ActionContext);
  const [isAttacking, setIsAttacking] = useState(false);

  const targetUnitId = actionMenu.targetUnitId;
  if (!targetUnitId) return <></>;

  const { spec, status } = loadUnit(targetUnitId, units);

  return (
    <div className="action-menu">
      <button
        className={
          actionMenu.activeActionOption === "MOVE"
            ? "action-menu-btn action-menu-btn-active"
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
      <button
        className={
          isAttacking
            ? "action-menu-btn action-menu-btn-selected"
            : "action-menu-btn"
        }
        onClick={() => setIsAttacking(!isAttacking)}
        disabled={status.attacked}
      >
        攻撃
      </button>
      {isAttacking && (
        <div className="action-sub-menu">
          {spec.armaments.map((armament, idx) => (
            <>
              <button
                key={`action-sub-menu.${idx}`}
                className={
                  actionMenu.activeActionOption === "ATTACK" &&
                  actionMenu.selectedArmamentIdx === idx
                    ? "action-menu-btn action-menu-btn-active"
                    : "action-menu-btn"
                }
                onClick={() =>
                  dispatch({
                    type: "SELECT_ATTACK",
                    payload: {
                      running_unit_id: spec.id,
                      action: {
                        target_unit_id: targetUnitId,
                        armament_idx: idx,
                      },
                    },
                  })
                }
                disabled={status.attacked || armament.consumed_en > status.en}
              >
                {armament.name}
              </button>
              <span className="action-sub-menu-description">{`POW: ${armament.value} / EN: ${armament.consumed_en} / RANGE: ${armament.range}`}</span>
            </>
          ))}
        </div>
      )}
      <p style={{ color: "gray" }}>{`----------------`}</p>
      <button
        className="action-menu-btn"
        onClick={() => dispatch({ type: "TURN_END" })}
      >
        確定
      </button>
      <button
        className="action-menu-btn"
        onClick={() => dispatch({ type: "CLOSE_MENU" })}
      >
        閉じる
      </button>
    </div>
  );
};
