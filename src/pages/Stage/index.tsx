import { createContext, useContext, useMemo, useReducer } from "react";
import "./Stage.scss"
import { ActionType, PayloadAttackActionType, PayloadMoveActionType, PayloadType, StateActionMenuType } from "../../types";
import { INITIAL_ACTION_MENU, uiReducer } from "./logics";
import { Cell } from "./Cell";
import { tutorialScenario } from "../../scenarios/tutorial";
import { GameState } from "../../game/types";
import { gameReducer, getPlayer, loadUnit } from "../../game/gameReducer";
import { ActionMenu } from "./ActionMenu";

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

  const dispatch = (action: { type: ActionType; payload?: PayloadType }) => {
    const { type, payload } = action;

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
        gameDispatch({
          type: "DO_MOVE",
          unitId: payload.running_unit_id,
          payload: payload.action,
        });
        uiDispatch({ type: "RESET" });
        break;
      }
      case "DO_ATTACK": {
        if (payload?.running_unit_id === undefined) return;
        if (payload.action === undefined) return;
        if (!isPayloadAttackAction(payload.action)) return;
        gameDispatch({
          type: "DO_ATTACK",
          unitId: payload.running_unit_id,
          payload: payload.action,
        });
        uiDispatch({ type: "RESET" });
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
    return gameState.units.reduce((map, unit) => {
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
  }, [gameState.units]);

  const activePlayer = getPlayer(gameState.activePlayerId, tutorialScenario.players);

  return (
    <>
      <div className="player-info">
        <p>{`ID: ${activePlayer.id}`}</p>
        <p>{`name: ${activePlayer.name}`}</p>
      </div>
      <div className="play-area">
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
