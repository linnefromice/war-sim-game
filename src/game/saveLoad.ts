import { GameState } from "./types";
import { AIDifficulty } from "./ai";
import { Scenario } from "../types/scenario";
import { isPayloadMoveAction, isPayloadAttackAction } from "./gameReducer";
import { findScenario } from "../scenarios";

const SAVE_KEY = "war-sim-save";
type SavedGame = { gameState: GameState; difficulty?: AIDifficulty; scenarioId: string };

const validHistory = (history: unknown[], scenario: Scenario): boolean => history.every(value => {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  if (action.type === "TURN_END") return true;
  const unit = scenario.units.find(u => u.spec.id === action.unitId);
  if (!unit) return false;
  if (action.type === "UNDO_MOVE") return true;
  if (action.type === "DO_MOVE" && isPayloadMoveAction(action.payload)) {
    const { x, y } = action.payload;
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < scenario.gridSize.cols && y < scenario.gridSize.rows;
  }
  if (action.type === "DO_ATTACK" && isPayloadAttackAction(action.payload)) {
    const { armament_idx, target_unit_id } = action.payload;
    return Number.isInteger(armament_idx) && !!unit.spec.armaments[armament_idx] && scenario.units.some(u => u.spec.id === target_unit_id);
  }
  return false;
});

export const saveGame = (gameState: GameState, difficulty?: AIDifficulty, scenarioId = "tutorial"): void => {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, gameState, difficulty, scenarioId, savedAt: new Date().toISOString() }));
};

export const loadGame = (): SavedGame | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || (data.version !== 1 && data.version !== 2)) return null;
    const scenarioId = data.version === 1 ? "tutorial" : data.scenarioId;
    const scenario = findScenario(scenarioId);
    if (!scenario) return null;
    const difficulty = data.difficulty;
    if (data.version === 1 && difficulty === undefined) return null;
    if (difficulty !== undefined && !["easy", "normal", "hard"].includes(difficulty)) return null;
    if (difficulty && scenarioId !== "tutorial") return null;
    const state = data.gameState;
    if (!state || !scenario.players.some(p => p.id === state.activePlayerId) ||
        !Array.isArray(state.units) || !Array.isArray(state.history) ||
        !Number.isInteger(state.turnNumber) || state.turnNumber < 1 ||
        !state.phase || !["playing", "finished"].includes(state.phase.type)) return null;
    if (!validHistory(state.history, scenario) || state.units.length === 0) return null;
    if (state.phase.type === "finished" && !scenario.players.some(p => p.id === state.phase.winner)) return null;
    const ids = new Set<number>();
    const cells = new Set<string>();
    for (const unit of state.units) {
      const original = scenario.units.find(u => u.spec.id === unit?.spec?.id);
      if (!original || original.playerId !== unit.playerId || JSON.stringify(original.spec) !== JSON.stringify(unit.spec)) return null;
      const status = unit.status;
      if (!status || !Number.isFinite(status.hp) || status.hp <= 0 || status.hp > original.spec.max_hp ||
          !Number.isFinite(status.en) || status.en < 0 || status.en > original.spec.max_en ||
          typeof status.moved !== "boolean" || typeof status.attacked !== "boolean") return null;
      for (const c of [status.coordinate, status.previousCoordinate, status.initialCoordinate]) {
        if (!c || !Number.isInteger(c.x) || !Number.isInteger(c.y) || c.x < 0 || c.y < 0 ||
            c.x >= scenario.gridSize.cols || c.y >= scenario.gridSize.rows || scenario.terrain[c.y][c.x] === "water") return null;
      }
      const cell = `${status.coordinate.x},${status.coordinate.y}`;
      if (ids.has(unit.spec.id) || cells.has(cell)) return null;
      ids.add(unit.spec.id); cells.add(cell);
    }
    return { gameState: state, difficulty, scenarioId };
  } catch {
    return null;
  }
};
export const hasSavedGame = (): boolean => loadGame() !== null;
export const deleteSave = (): void => localStorage.removeItem(SAVE_KEY);
