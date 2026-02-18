import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import "./Stage.scss"
import { ActionType, PayloadAttackActionType, PayloadMoveActionType, PayloadType, StateActionMenuType } from "../../types";
import { INITIAL_ACTION_MENU, uiReducer } from "./logics";
import { Cell } from "./Cell";
import { tutorialScenario } from "../../scenarios/tutorial";
import { GameState, GameAction } from "../../game/types";
import { gameReducer, getPlayer, getTerrainDefenseReduction, loadUnit, nextPlayer } from "../../game/gameReducer";
import { ActionMenu } from "./ActionMenu";
import { AnimationLayer } from "./AnimationLayer";
import { ReplayViewer } from "./ReplayViewer";
import { AIAction, computeAIActions } from "../../game/ai";

const AI_PLAYER_ID = 2;

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
  history: [],
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
        const targetTerrain = tutorialScenario.terrain[target.status.coordinate.y][target.status.coordinate.x];
        const defenseReduction = getTerrainDefenseReduction(targetTerrain);
        const damage = Math.floor(armament.value * (1 - defenseReduction));
        const destroyed = target.status.hp - damage <= 0;
        uiDispatch({ type: "ANIMATION_START_ATTACK", targetId: payload.action.target_unit_id, damage, destroyed });
        pendingGameAction.current = {
          type: "DO_ATTACK",
          unitId: payload.running_unit_id,
          payload: payload.action,
        };
        break;
      }
      case "UNDO_MOVE": {
        if (payload?.running_unit_id === undefined) return;
        gameDispatch({ type: "UNDO_MOVE", unitId: payload.running_unit_id });
        uiDispatch({ type: "RESET" });
        break;
      }
      case "ANIMATION_COMPLETE": {
        if (pendingGameAction.current) {
          const action = pendingGameAction.current;
          gameDispatch(action);
          pendingGameAction.current = null;
          if (action.type === "TURN_END") {
            uiDispatch({ type: "RESET" });
          }
        }
        uiDispatch({ type: "ANIMATION_COMPLETE" });
        break;
      }
      case "TURN_END": {
        const nextPlayerId = nextPlayer(gameState.activePlayerId, tutorialScenario.players).id;
        uiDispatch({ type: "ANIMATION_START_TURN_CHANGE", nextPlayerId });
        pendingGameAction.current = { type: "TURN_END" };
        break;
      }
    }
  };

  return (
    <ActionContext.Provider value={{ gameState, uiState, dispatch, onRestart }}>
      <StageContent />
    </ActionContext.Provider>
  );
};

const StageContent = () => {
  const { dispatch, gameState, uiState } = useContext(ActionContext);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys during animations
      if (uiState.animationState.type !== "idle") return;
      // Block keyboard input during AI turn
      if (gameState.activePlayerId === AI_PLAYER_ID) return;

      switch (e.key) {
        case "Escape": {
          if (uiState.isOpen) {
            e.preventDefault();
            dispatch({ type: "CLOSE_MENU" });
          }
          break;
        }
        case "Enter": {
          if (uiState.isOpen) {
            e.preventDefault();
            dispatch({ type: "TURN_END" });
          }
          break;
        }
        case "Tab": {
          e.preventDefault();
          // Find current player's units
          const playerUnits = gameState.units
            .filter(u => u.playerId === gameState.activePlayerId)
            .sort((a, b) => a.spec.id - b.spec.id);

          if (playerUnits.length === 0) return;

          // Find current selected unit index, cycle to next
          const currentIdx = uiState.targetUnitId
            ? playerUnits.findIndex(u => u.spec.id === uiState.targetUnitId)
            : -1;
          const nextIdx = (currentIdx + 1) % playerUnits.length;
          const nextUnit = playerUnits[nextIdx];

          dispatch({ type: "OPEN_MENU", payload: { running_unit_id: nextUnit.spec.id } });
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, gameState.units, gameState.activePlayerId, uiState.isOpen, uiState.targetUnitId, uiState.animationState.type]);

  // --- AI Opponent ---
  const aiActionsRef = useRef<AIAction[]>([]);

  useEffect(() => {
    // Only act when it's AI's turn, animation is idle, game is playing
    if (gameState.activePlayerId !== AI_PLAYER_ID) {
      aiActionsRef.current = [];
      return;
    }
    if (uiState.animationState.type !== "idle") return;
    if (gameState.phase.type !== "playing") return;

    // Compute AI actions if queue is empty
    if (aiActionsRef.current.length === 0) {
      aiActionsRef.current = computeAIActions(gameState.units, AI_PLAYER_ID);
    }

    // Dispatch next action from queue
    if (aiActionsRef.current.length > 0) {
      const nextAction = aiActionsRef.current.shift()!;
      const timer = setTimeout(() => {
        switch (nextAction.type) {
          case "move":
            dispatch({
              type: "DO_MOVE",
              payload: {
                running_unit_id: nextAction.unitId,
                action: nextAction.payload,
              },
            });
            break;
          case "attack":
            dispatch({
              type: "DO_ATTACK",
              payload: {
                running_unit_id: nextAction.unitId,
                action: nextAction.payload,
              },
            });
            break;
          case "turn_end":
            dispatch({ type: "TURN_END" });
            aiActionsRef.current = [];
            break;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.activePlayerId, gameState.units, gameState.phase.type, uiState.animationState.type, dispatch]);

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

  const player1Units = gameState.units.filter(u => u.playerId === 1);
  const player2Units = gameState.units.filter(u => u.playerId === 2);

  return (
    <>
      <div className="player-info" style={{
        backgroundColor: `rgba(${activePlayer.rgb[0]}, ${activePlayer.rgb[1]}, ${activePlayer.rgb[2]}, 0.15)`,
        border: `2px solid rgba(${activePlayer.rgb[0]}, ${activePlayer.rgb[1]}, ${activePlayer.rgb[2]}, 0.5)`,
        borderRadius: "8px",
        padding: "8px 16px",
        marginBottom: "8px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div>
            <span style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              color: `rgb(${activePlayer.rgb[0]}, ${activePlayer.rgb[1]}, ${activePlayer.rgb[2]})`,
            }}>
              ▶ {activePlayer.name}
            </span>
            <span style={{ color: "gray", marginLeft: "8px", fontSize: "0.9rem" }}>
              のターン
            </span>
            {gameState.activePlayerId === AI_PLAYER_ID && (
              <span style={{
                marginLeft: "8px",
                padding: "2px 8px",
                backgroundColor: "rgba(255,0,0,0.3)",
                borderRadius: "4px",
                fontSize: "0.75rem",
              }}>
                AI
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem" }}>
            <span style={{
              color: `rgb(${tutorialScenario.players[0].rgb[0]}, ${tutorialScenario.players[0].rgb[1]}, ${tutorialScenario.players[0].rgb[2]})`,
            }}>
              {tutorialScenario.players[0].name}: {player1Units.length}体
            </span>
            <span style={{ color: "gray" }}>vs</span>
            <span style={{
              color: `rgb(${tutorialScenario.players[1].rgb[0]}, ${tutorialScenario.players[1].rgb[1]}, ${tutorialScenario.players[1].rgb[2]})`,
            }}>
              {tutorialScenario.players[1].name}: {player2Units.length}体
            </span>
          </div>
        </div>
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
  const { gameState, onRestart } = useContext(ActionContext);
  const [showReplay, setShowReplay] = useState(false);
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
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
          <button
            onClick={onRestart}
            style={{
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
          <button
            onClick={() => setShowReplay(true)}
            style={{
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
            リプレイ
          </button>
        </div>
      </div>
      {showReplay && (
        <ReplayViewer
          history={gameState.history}
          initialUnits={tutorialScenario.units}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
};
