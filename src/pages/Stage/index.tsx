import { createContext, useContext, useReducer, useState } from "react";
import "./Stage.scss"
import { ActionType, PayloadType, StateType } from "../../types";
import { INITIAL_ACTION_MENU, getPlayer, loadUnit, reducer } from "./logics";
import { Cell } from "./Cell";
import { INITIAL_UNITS, PLAYERS } from "../../constants";

const ROW_NUM = 10
const CELL_NUM_IN_ROW = 13

const initialState: StateType = {
  activePlayerId: 1,
  actionMenu: INITIAL_ACTION_MENU,
  units: INITIAL_UNITS,
}

export const ActionContext = createContext({
  state: initialState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch: (_: { type: ActionType, payload?: PayloadType }) => {},
});


export const Stage = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ActionContext.Provider value={{ state, dispatch }}>
      <StageContent />
    </ActionContext.Provider>
  )
}

const StageContent = () => {
  const { state } = useContext(ActionContext);

  const unitsCoordinates = state.units.reduce((map, unit) => {
    const { x, y } = unit.status.coordinate;
    const mapKey = `x${x}y${y}`
    if (map.has(mapKey)) {
      throw new Error(`Duplicate coordinates: ${x},${y} oldUnit=${map.get(mapKey)} newUnit=${unit.spec.id}`)
    }
    map.set(mapKey, unit.spec.id);
    return map;
  }, new Map<string, number>())

  const activePlayer = getPlayer(state.activePlayerId, PLAYERS);

  return (
    <>
      <div className="player-info">
        <p>{`ID: ${activePlayer.id}`}</p>
        <p>{`name: ${activePlayer.name}`}</p>
      </div>
      <div className="play-area">
        <div className="stage">
          {Array.from({ length: ROW_NUM }).map((_, y) => (
            <div key={`row.${y}`} className="row">
              {Array.from({ length: CELL_NUM_IN_ROW }).map((_, x) => {
                const unitId = unitsCoordinates.get(`x${x}y${y}`);
                return <Cell x={x} y={y} unitId={unitId}/>
              })}
            </div>
          ))}
        </div>
        {state.actionMenu.isOpen && <ActionMenu />}
      </div>
    </>
  )
}

const ActionMenu = () => {
  const { state: { units, actionMenu }, dispatch } = useContext(ActionContext);
  const [isAttacking, setIsAttacking] = useState(false);

  const targetUnitId = actionMenu.targetUnitId;
  if (!targetUnitId) return <></>

  const { spec, status } = loadUnit(targetUnitId, units);

  return (
    <div className="action-menu">
      <button
        className={actionMenu.activeActionOption === "MOVE"
          ? "action-menu-btn action-menu-btn-active"
          : "action-menu-btn"
        }
        onClick={() => {
          setIsAttacking(false);
          dispatch({
            type: "SELECT_MOVE",
            payload: { running_unit_id: spec.id }
          });
        }}
        disabled={status.moved}
      >
        移動
      </button>
      <button
        className={isAttacking
          ? "action-menu-btn action-menu-btn-selected"
          : "action-menu-btn"
        }
        onClick={() => setIsAttacking(!isAttacking)}
        disabled={status.attacked}
      >
        攻撃
      </button>
      {isAttacking && <div className="action-sub-menu">
        {spec.armaments.map((armament, idx) => (
          <>
            <button
              key={`action-sub-menu.${idx}`}
              className={actionMenu.activeActionOption === "ATTACK" && actionMenu.selectedArmamentIdx === idx
                ? "action-menu-btn action-menu-btn-active"
                : "action-menu-btn"
              }
              onClick={() => dispatch({
                type: "SELECT_ATTACK",
                payload: {
                  running_unit_id: spec.id,
                  action: {
                    target_unit_id: targetUnitId,
                    armament_idx: idx,
                  }
                }
              })}
              disabled={status.attacked || armament.consumed_en > status.en}
            >
              {armament.name}
            </button>
            <span className="action-sub-menu-description">{`POW: ${armament.value} / EN: ${armament.consumed_en} / RANGE: ${armament.range}`}</span>
          </>
        ))}
      </div>}
      <p style={{ color: "gray"}}>{`----------------`}</p>
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
  )
}
