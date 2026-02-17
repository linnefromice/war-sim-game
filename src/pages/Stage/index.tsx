import { createContext, useContext, useMemo, useReducer, useRef } from "react";
import "./Stage.scss"
import { ActionType, PayloadAttackActionType, PayloadMoveActionType, PayloadType, StateActionMenuType } from "../../types";
import { INITIAL_ACTION_MENU, uiReducer } from "./logics";
import { Cell } from "./Cell";
import { tutorialScenario } from "../../scenarios/tutorial";
import { GameState, GameAction } from "../../game/types";
import { gameReducer, getPlayer, loadUnit } from "../../game/gameReducer";
import { ActionMenu } from "./ActionMenu";
import { AnimationLayer } from "./AnimationLayer";

const isPayloadMoveAction = (action: PayloadMoveActionType | PayloadAttackActionType): action is PayloadMoveActionType => {
  return 'x' in action && 'y' in action && !('target_unit_id' in action);
}

const isPayloadAttackAction = (action: PayloadMoveActionType | PayloadAttackActionType): action is PayloadAttackActionType => {
  return 'target_unit_id' in action && 'armament_idx' in action;
}

const initialGameState: GameState = {
  activePlayerId: 1,
  units: tutorialScenario.units,
  phase: { type: "playing" },
};

export const ActionContext = createContext<{
  gameState: GameState;
  uiState: StateActionMenuType;
  dispatch: (action: { type: ActionType; payload?: PayloadType }) => void;
  onRestart?: () => void;
}>({
  gameState: initialGameState,
  uiState: INITIAL_ACTION_MENU,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch: (_: { type: ActionType; payload?: PayloadType }) => {},
});

export const Stage = ({ onRestart }: { onRestart?: () => void }) => {
  const [gameState, gameDispatch] = useReducer(gameReducer, initialGameState);
  const [uiState, uiDispatch] = useReducer(uiReducer, INITIAL_ACTION_MENU);
  const pendingGameAction = useRef<GameAction | null>(null);

  const dispatch = (action: { type: ActionType; payload?: PayloadType }) => {
    const { type, payload } = action;

    // Block all actions during animation except ANIMATION_COMPLETE
    if (uiState.animationState.type !== "idle" && type !== "ANIMATION_COMPLETE") return;

    switch (type) {
      case "OPEN_MENU": {
        if (payload?.running_unit_id === undefined) return;
        const unit = loadUnit(payload.running_unit_id, gameState.units);
        if (unit.playerId !== gameState.activePlayerId) return;
        uiDispatch({ type: "OPEN_MENU", unitId: payload.running_unit_id });
        break;
      }
      case "CLOSE_MENU":
        uiDispatch({ type: "CLOSE_MENU" });
        break;
      case "SELECT_MOVE": {
        if (payload?.running_unit_id === undefined) return;
        const unit = loadUnit(payload.running_unit_id, gameState.units);
        if (unit.playerId !== gameState.activePlayerId) return;
        uiDispatch({ type: "SELECT_MOVE" });
        break;
      }
      case "SELECT_ATTACK": {
        if (payload?.running_unit_id === undefined) return;
        if (payload.action === undefined) return;
        const unit = loadUnit(payload.running_unit_id, gameState.units);
        if (unit.playerId !== gameState.activePlayerId) return;
        if (!isPayloadAttackAction(payload.action)) return;
        uiDispatch({ type: "SELECT_ATTACK", payload: payload.action });
        break;
      }
      case "DO_MOVE": {
        if (payload?.running_unit_id === undefined) return;
        if (payload.action === undefined) return;
        if (!isPayloadMoveAction(payload.action)) return;
        const unit = loadUnit(payload.running_unit_id, gameState.units);
        const from = unit.status.coordinate;
        const to = { x: payload.action.x, y: payload.action.y };
        uiDispatch({ type: "ANIMATION_START_MOVE", unitId: payload.running_unit_id, from, to });
        pendingGameAction.current = {
          type: "DO_MOVE",
          unitId: payload.running_unit_id,
          payload: payload.action,
        };
        break;
      }
      case "DO_ATTACK": {
        if (payload?.running_unit_id === undefined) return;
        if (payload.action === undefined) return;
        if (!isPayloadAttackAction(payload.action)) return;
        const unit = loadUnit(payload.running_unit_id, gameState.units);
        const target = loadUnit(payload.action.target_unit_id, gameState.units);
        const armament = unit.spec.armaments[payload.action.armament_idx];
        const damage = armament.value;
        const destroyed = target.status.hp - damage <= 0;
        uiDispatch({ type: "ANIMATION_START_ATTACK", targetId: payload.action.target_unit_id, damage, destroyed });
        pendingGameAction.current = {
          type: "DO_ATTACK",
          unitId: payload.running_unit_id,
          payload: payload.action,
        };
        break;
      }
      case "ANIMATION_COMPLETE": {
        if (pendingGameAction.current) {
          gameDispatch(pendingGameAction.current);
          pendingGameAction.current = null;
        }
        uiDispatch({ type: "ANIMATION_COMPLETE" });
        break;
      }
      case "TURN_END":
        gameDispatch({ type: "TURN_END" });
        uiDispatch({ type: "RESET" });
        break;
    }
  };

  return (
    <ActionContext.Provider value={{ gameState, uiState, dispatch, onRestart }}>
      <StageContent />
    </ActionContext.Provider>
  );
};

const StageContent = () => {
  const { gameState, uiState } = useContext(ActionContext);

  const unitsCoordinates = useMemo(() => {
    // Hide moving unit from grid during move animation (AnimationLayer renders it)
    const animatingUnitId = uiState.animationState.type === "move" ? uiState.animationState.unitId : null;
    return gameState.units.reduce((map, unit) => {
      if (unit.spec.id === animatingUnitId) return map;
      const { x, y } = unit.status.coordinate;
      const mapKey = `x${x}y${y}`;
      if (map.has(mapKey)) {
        throw new Error(
          `Duplicate coordinates: ${x},${y} oldUnit=${map.get(mapKey)} newUnit=${unit.spec.id}`
        );
      }
      map.set(mapKey, unit.spec.id);
      return map;
    }, new Map<string, number>());
  }, [gameState.units, uiState.animationState]);

  const activePlayer = getPlayer(gameState.activePlayerId, tutorialScenario.players);

  return (
    <>
      <div className="player-info">
        <p>{`ID: ${activePlayer.id}`}</p>
        <p>{`name: ${activePlayer.name}`}</p>
      </div>
      <div className="play-area" style={{ position: "relative" }}>
        <div className="stage">
          {Array.from({ length: tutorialScenario.gridSize.rows }).map((_, y) => (
            <div key={`row.${y}`} className="row">
              {Array.from({ length: tutorialScenario.gridSize.cols }).map((_, x) => {
                const unitId = unitsCoordinates.get(`x${x}y${y}`);
                return <Cell key={`cell.x${x}y${y}`} x={x} y={y} unitId={unitId} />;
              })}
            </div>
          ))}
        </div>
        <AnimationLayer />
        {uiState.isOpen && <ActionMenu />}
      </div>
      {gameState.phase.type === "finished" && (
        <GameOverOverlay winnerId={gameState.phase.winner} />
      )}
    </>
  );
};

const GameOverOverlay = ({ winnerId }: { winnerId: number }) => {
  const winner = getPlayer(winnerId, tutorialScenario.players);
  const { onRestart } = useContext(ActionContext);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "3rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        <p>{`Player ${winner.id} Wins!`}</p>
        <p style={{ fontSize: "1.5rem" }}>{winner.name}</p>
        <button
          onClick={onRestart}
          style={{
            marginTop: "2rem",
            padding: "1rem 2rem",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: "transparent",
            border: "2px solid white",
            borderRadius: "0.5rem",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
};
