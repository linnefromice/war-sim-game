import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import "./Stage.scss"
import { ActionType, PayloadAttackActionType, PayloadMoveActionType, PayloadType, StateActionMenuType } from "../../types";
import { INITIAL_ACTION_MENU, uiReducer } from "./logics";
import { Cell } from "./Cell";
import { tutorialScenario } from "../../scenarios/tutorial";
import { GameState, GameAction } from "../../game/types";
import { gameReducer, getTerrainDefenseReduction, loadUnit, nextPlayer } from "../../game/gameReducer";
import { ActionButtons } from "./ActionButtons";
import { UnitDetailPanel } from "./UnitDetailPanel";
import { TurnBanner } from "./TurnBanner";
import { AnimationLayer } from "./AnimationLayer";
import { GameOverOverlay } from "./GameOverOverlay";
import { AIAction, computeAIActions } from "../../game/ai";
import { ScenarioProvider } from "../../contexts/ScenarioContext";

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
  turnNumber: 1,
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
    <ScenarioProvider scenario={tutorialScenario}>
      <ActionContext.Provider value={{ gameState, uiState, dispatch, onRestart }}>
        <StageContent />
      </ActionContext.Provider>
    </ScenarioProvider>
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

  return (
    <>
      <TurnBanner />
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
        <AnimationLayer />
        {uiState.isOpen && <ActionButtons />}
        <UnitDetailPanel />
      </div>
      {gameState.phase.type === "finished" && (
        <GameOverOverlay winnerId={gameState.phase.winner} />
      )}
    </>
  );
};

