import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import "./Stage.scss"
import { DispatchAction, StateActionMenuType } from "../../types";
import { INITIAL_ACTION_MENU, uiReducer, UIAction } from "./logics";
import { Cell } from "./Cell";
import { tutorialScenario } from "../../scenarios/tutorial";
import { GameState, GameAction } from "../../game/types";
import { gameReducer, createInitialGameState, calculateDamage, loadUnit, nextPlayer } from "../../game/gameReducer";
import { ActionButtons } from "./ActionButtons";
import { UnitDetailPanel } from "./UnitDetailPanel";
import { TurnBanner } from "./TurnBanner";
import { AnimationLayer } from "./AnimationLayer";
import { GameOverOverlay } from "./GameOverOverlay";
import { AIDifficulty, AIAction, computeAIActions } from "../../game/ai";
import { Scenario } from "../../types/scenario";
import { ScenarioProvider, useScenario } from "../../contexts/ScenarioContext";
import { UnitStatusSummary } from "./UnitStatusSummary";
import { BattleLog } from "./BattleLog";
import { AI_PLAYER_ID } from "../../constants";

const initialGameState = createInitialGameState();

export const ActionContext = createContext<{
  gameState: GameState;
  uiState: StateActionMenuType;
  dispatch: (action: DispatchAction) => void;
  uiDispatch: (action: UIAction) => void;
  difficulty?: AIDifficulty;
  onRestart?: () => void;
  onMenu?: () => void;
}>({
  gameState: initialGameState,
  uiState: INITIAL_ACTION_MENU,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch: (_: DispatchAction) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uiDispatch: (_: UIAction) => {},
});

type StageProps = {
  scenario?: Scenario;
  difficulty?: AIDifficulty;
  onRestart?: () => void;
  onMenu?: () => void;
  loadedState?: GameState | null;
};

export const Stage = ({ scenario = tutorialScenario, difficulty, onRestart, onMenu, loadedState }: StageProps) => {
  const reducer = (state: GameState, action: GameAction) => gameReducer(state, action, scenario);
  const [gameState, gameDispatch] = useReducer(reducer, loadedState, state => state ?? createInitialGameState(scenario));
  const [uiState, uiDispatch] = useReducer(uiReducer, INITIAL_ACTION_MENU);
  const pendingGameAction = useRef<GameAction | null>(null);

  const dispatch = (action: DispatchAction) => {
    if (gameState.phase.type === "finished") return;
    // Block all actions during animation except ANIMATION_COMPLETE
    if (uiState.animationState.type !== "idle" && action.type !== "ANIMATION_COMPLETE") return;

    switch (action.type) {
      case "OPEN_MENU": {
        const unit = loadUnit(action.unitId, gameState.units);
        if (unit.playerId !== gameState.activePlayerId) {
          uiDispatch({ type: "INSPECT_UNIT", unitId: action.unitId });
          return;
        }
        uiDispatch({ type: "OPEN_MENU", unitId: action.unitId });
        break;
      }
      case "CLOSE_MENU":
        uiDispatch({ type: "CLOSE_MENU" });
        break;
      case "SELECT_MOVE": {
        const unit = loadUnit(action.unitId, gameState.units);
        if (unit.playerId !== gameState.activePlayerId) return;
        uiDispatch({ type: "SELECT_MOVE" });
        break;
      }
      case "SELECT_ATTACK": {
        const unit = loadUnit(action.unitId, gameState.units);
        if (unit.playerId !== gameState.activePlayerId) return;
        uiDispatch({ type: "SELECT_ATTACK", payload: action.attack });
        break;
      }
      case "DO_MOVE": {
        const gameAction: GameAction = { type: "DO_MOVE", unitId: action.unitId, payload: action.move };
        if (reducer(gameState, gameAction) === gameState) return;
        const unit = loadUnit(action.unitId, gameState.units);
        const from = unit.status.coordinate;
        const to = { x: action.move.x, y: action.move.y };
        uiDispatch({ type: "ANIMATION_START_MOVE", unitId: action.unitId, from, to });
        pendingGameAction.current = {
          type: "DO_MOVE",
          unitId: action.unitId,
          payload: action.move,
        };
        break;
      }
      case "DO_ATTACK": {
        const gameAction: GameAction = { type: "DO_ATTACK", unitId: action.unitId, payload: action.attack };
        if (reducer(gameState, gameAction) === gameState) return;
        const unit = loadUnit(action.unitId, gameState.units);
        const target = loadUnit(action.attack.target_unit_id, gameState.units);
        const armament = unit.spec.armaments[action.attack.armament_idx];
        const targetTerrain = scenario.terrain[target.status.coordinate.y][target.status.coordinate.x];
        const { damage } = calculateDamage(unit, target, armament, targetTerrain, gameState.units);
        const destroyed = target.status.hp - damage <= 0;
        uiDispatch({ type: "ANIMATION_START_ATTACK", targetId: action.attack.target_unit_id, damage, destroyed });
        pendingGameAction.current = {
          type: "DO_ATTACK",
          unitId: action.unitId,
          payload: action.attack,
        };
        break;
      }
      case "UNDO_MOVE": {
        gameDispatch({ type: "UNDO_MOVE", unitId: action.unitId });
        uiDispatch({ type: "RESET" });
        break;
      }
      case "ANIMATION_COMPLETE": {
        const completedAction = pendingGameAction.current;
        if (completedAction) {
          gameDispatch(completedAction);
          pendingGameAction.current = null;
          if (completedAction.type === "TURN_END") {
            uiDispatch({ type: "RESET" });
          }
        }
        uiDispatch({ type: "ANIMATION_COMPLETE" });
        // Re-open menu if unit still has actions available
        if (completedAction && (completedAction.type === "DO_MOVE" || completedAction.type === "DO_ATTACK")) {
          const unit = loadUnit(completedAction.unitId, gameState.units);
          const willBeExhausted = completedAction.type === "DO_MOVE"
            ? unit.status.attacked  // After move: exhausted if already attacked
            : unit.status.moved;    // After attack: exhausted if already moved
          if (!willBeExhausted) {
            uiDispatch({ type: "OPEN_MENU", unitId: completedAction.unitId });
          }
        }
        break;
      }
      case "TURN_END": {
        const nextPlayerId = nextPlayer(gameState.activePlayerId, scenario.players).id;
        uiDispatch({ type: "ANIMATION_START_TURN_CHANGE", nextPlayerId });
        pendingGameAction.current = { type: "TURN_END" };
        break;
      }
    }
  };

  return (
    <ScenarioProvider scenario={scenario}>
      <ActionContext.Provider value={{ gameState, uiState, dispatch, uiDispatch, difficulty, onRestart, onMenu }}>
        <StageContent />
      </ActionContext.Provider>
    </ScenarioProvider>
  );
};

const StageContent = () => {
  const { dispatch, uiDispatch, gameState, uiState, difficulty, onMenu } = useContext(ActionContext);
  const scenario = useScenario();

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys during animations
      if (uiState.animationState.type !== "idle" || gameState.phase.type === "finished") return;
      const target = e.target;
      if (!(target instanceof HTMLElement) || !target.closest(".board-scroll")) return;
      if (e.shiftKey && e.key === "Tab") return;
      // Block keyboard input during AI turn
      if (difficulty && gameState.activePlayerId === AI_PLAYER_ID) return;

      switch (e.key) {
        case "Escape": {
          e.preventDefault();
          if (uiState.isOpen) {
            dispatch({ type: "CLOSE_MENU" });
          }
          uiDispatch({ type: "CLEAR_CURSOR" });
          break;
        }
        case "Enter": {
          // If cursor is active, act as cell click
          if (uiState.cursorPosition) {
            e.preventDefault();
            const { x, y } = uiState.cursorPosition;
            const unitId = unitsCoordinates.get(`x${x}y${y}`);

            if (uiState.activeActionOption === "MOVE") {
              if (uiState.targetUnitId) {
                dispatch({
                  type: "DO_MOVE",
                  unitId: uiState.targetUnitId,
                  move: { x, y },
                });
              }
            } else if (uiState.activeActionOption === "ATTACK") {
              if (uiState.targetUnitId && unitId) {
                dispatch({
                  type: "DO_ATTACK",
                  unitId: uiState.targetUnitId,
                  attack: {
                    target_unit_id: unitId,
                    armament_idx: uiState.selectedArmamentIdx ?? 0,
                  },
                });
              }
            } else if (unitId) {
              dispatch({ type: "OPEN_MENU", unitId });
            }
          } else {
            e.preventDefault();
            dispatch({ type: "TURN_END" });
          }
          break;
        }
        case "Tab": {
          if (uiState.isOpen) return;
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

          dispatch({ type: "OPEN_MENU", unitId: nextUnit.spec.id });
          uiDispatch({ type: "MOVE_CURSOR", position: nextUnit.status.coordinate });
          break;
        }
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          const cur = uiState.cursorPosition ?? { x: 0, y: 0 };
          let nx = cur.x;
          let ny = cur.y;
          if (e.key === "ArrowUp") ny = Math.max(0, cur.y - 1);
          if (e.key === "ArrowDown") ny = Math.min(scenario.gridSize.rows - 1, cur.y + 1);
          if (e.key === "ArrowLeft") nx = Math.max(0, cur.x - 1);
          if (e.key === "ArrowRight") nx = Math.min(scenario.gridSize.cols - 1, cur.x + 1);
          uiDispatch({ type: "MOVE_CURSOR", position: { x: nx, y: ny } });
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, uiDispatch, gameState.units, gameState.activePlayerId, uiState.isOpen, uiState.targetUnitId, uiState.animationState.type, uiState.cursorPosition, uiState.activeActionOption, uiState.selectedArmamentIdx, unitsCoordinates, difficulty, gameState.phase.type, scenario]);

  // --- AI Opponent ---
  const aiActionsRef = useRef<AIAction[]>([]);

  useEffect(() => {
    // Only act when it's AI's turn, animation is idle, game is playing
    if (!difficulty || gameState.activePlayerId !== AI_PLAYER_ID) {
      aiActionsRef.current = [];
      return;
    }
    if (uiState.animationState.type !== "idle") return;
    if (gameState.phase.type !== "playing") return;

    // Compute AI actions if queue is empty
    if (aiActionsRef.current.length === 0) {
      aiActionsRef.current = computeAIActions(gameState.units, AI_PLAYER_ID, difficulty ?? "easy");
    }

    // Dispatch next action from queue
    if (aiActionsRef.current.length > 0) {
      const nextAction = aiActionsRef.current.shift()!;
      const timer = setTimeout(() => {
        switch (nextAction.type) {
          case "move":
            dispatch({
              type: "DO_MOVE",
              unitId: nextAction.unitId,
              move: nextAction.payload,
            });
            break;
          case "attack":
            dispatch({
              type: "DO_ATTACK",
              unitId: nextAction.unitId,
              attack: nextAction.payload,
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
  }, [gameState.activePlayerId, gameState.units, gameState.phase.type, uiState.animationState.type, dispatch, difficulty]);

  return (
    <>
      <header className="scenario-header">
        <div><h1>{scenario.name}</h1><p>{scenario.description ?? "既存の大きな演習マップ。地形と3兵種の基本を試そう。"}</p>
        <p>{difficulty ? "既存セーブのCPU対戦" : "ローカル2人交代 · Player 1 / Player 2"} · 敵を全滅させたら「確定」で勝敗判定</p></div>
        {onMenu && <button onClick={onMenu}>シナリオ選択へ</button>}
      </header>
      <p className="keyboard-help">マウス / タッチ: 味方→移動・攻撃→対象。キーボード: Tabで戦場へ入り、さらにTabで味方選択。矢印でマス、Enterで操作、Escで閉じる。ボタンはTabとEnter、Shift+Tabで前へ。</p>
      <TurnBanner />
      <UnitStatusSummary />
      <div className="board-scroll" tabIndex={0} aria-label="戦場。Tabで味方選択、矢印でマス移動">
        <div className="play-area">
          <div className="stage">
          {Array.from({ length: scenario.gridSize.rows }).map((_, y) => (
            <div key={`row.${y}`} className="row">
              {Array.from({ length: scenario.gridSize.cols }).map((_, x) => {
                const unitId = unitsCoordinates.get(`x${x}y${y}`);
                return <Cell key={`cell.x${x}y${y}`} x={x} y={y} unitId={unitId} />;
              })}
            </div>
          ))}
        </div>
          <AnimationLayer />
        </div>
      </div>
      <div className="stage-controls">
        {uiState.isOpen && <ActionButtons />}
        <UnitDetailPanel />
      </div>
      <BattleLog />
      {gameState.phase.type === "finished" && (
        <GameOverOverlay winnerId={gameState.phase.winner} />
      )}
    </>
  );
};

