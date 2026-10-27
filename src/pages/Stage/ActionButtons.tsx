import { useContext, useState } from "react";
import { ActionContext } from "./index";
import { loadUnit } from "../../game/gameReducer";

export const ActionButtons = () => {
  const { gameState: { units }, uiState, dispatch } = useContext(ActionContext);
  const [isAttacking, setIsAttacking] = useState(false);
  if (!uiState.targetUnitId) return null;
  const { spec, status } = loadUnit(uiState.targetUnitId, units);
  const focusBoard = () => document.querySelector<HTMLElement>(".board-scroll")?.focus({ preventScroll: true });
  return (
    <div className="action-buttons" aria-label={`${spec.name}の行動`}>
      <strong>{spec.name}</strong>
      <button className="action-menu-btn" autoFocus disabled={status.moved}
        onClick={() => { dispatch({ type: "SELECT_MOVE", unitId: spec.id }); focusBoard(); }}>移動</button>
      <button className="action-menu-btn" disabled={!status.moved || status.attacked}
        onClick={() => { dispatch({ type: "UNDO_MOVE", unitId: spec.id }); focusBoard(); }}>戻す</button>
      <button className="action-menu-btn" disabled={status.attacked} onClick={() => setIsAttacking(v => !v)}>攻撃</button>
      {isAttacking && <div className="action-sub-menu">
        {spec.armaments.map((armament, idx) => (
          <button key={idx} className={`action-sub-menu-item${uiState.selectedArmamentIdx === idx ? " action-sub-menu-item--active" : ""}`}
            disabled={status.attacked || armament.consumed_en > status.en}
            onClick={() => {
              dispatch({ type: "SELECT_ATTACK", unitId: spec.id, attack: { target_unit_id: spec.id, armament_idx: idx } });
              focusBoard();
            }}>
            <span className="action-sub-menu-item-name">{armament.name}</span>
            <span className="action-sub-menu-description">POW {armament.value} · EN {armament.consumed_en} · RANGE {armament.range}</span>
          </button>
        ))}
      </div>}
      <button className="action-menu-btn" onClick={() => { dispatch({ type: "CLOSE_MENU" }); focusBoard(); }}>閉じる</button>
    </div>
  );
};
