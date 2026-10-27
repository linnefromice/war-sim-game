import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState, gameReducer } from "./gameReducer";
import { deleteSave, hasSavedGame, loadGame, saveGame } from "./saveLoad";
import { scenarios } from "../scenarios";

describe("scenario saves", () => {
  beforeEach(() => localStorage.clear());
  it.each(scenarios)("round trips $id and its current turn", scenario => {
    const state = gameReducer(createInitialGameState(scenario), { type: "TURN_END" }, scenario);
    saveGame(state, undefined, scenario.id);
    expect(loadGame()).toEqual({ gameState: state, difficulty: undefined, scenarioId: scenario.id });
    expect(hasSavedGame()).toBe(true);
    deleteSave();
    expect(loadGame()).toBeNull();
  });
  it.each(["easy", "normal", "hard"] as const)("migrates v1 tutorial %s without deleting it", difficulty => {
    const gameState = createInitialGameState(scenarios[0]);
    const original = JSON.stringify({ version: 1, gameState, difficulty, savedAt: "2026-10-27" });
    localStorage.setItem("war-sim-save", original);
    expect(loadGame()).toEqual({ gameState, difficulty, scenarioId: "tutorial" });
    expect(localStorage.getItem("war-sim-save")).toBe(original);
  });
  it.each(["{", "null", '{"version":3}', '{"version":2,"scenarioId":"missing"}', '{"version":1}'])("rejects invalid data %s", value => {
    localStorage.setItem("war-sim-save", value);
    expect(loadGame()).toBeNull();
  });
  it("rejects corrupt unit coordinates, specs, HP, winner, duplicate units and CPU short maps", () => {
    const scenario = scenarios[1];
    const state = createInitialGameState(scenario);
    const changes = [
      { ...state, units: [state.units[0], state.units[0]] },
      { ...state, units: [{ ...state.units[0], status: { ...state.units[0].status, hp: -1 } }] },
      { ...state, units: [{ ...state.units[0], spec: { ...state.units[0].spec, max_hp: 9999 } }] },
      { ...state, units: [{ ...state.units[0], status: { ...state.units[0].status, coordinate: { x: 99, y: 0 } } }] },
      { ...state, phase: { type: "finished", winner: 99 } },
    ];
    for (const gameState of changes) {
      localStorage.setItem("war-sim-save", JSON.stringify({ version: 2, scenarioId: scenario.id, gameState }));
      expect(loadGame()).toBeNull();
    }
    saveGame(state, "easy", scenario.id);
    expect(loadGame()).toBeNull();
  });
  it("handles unavailable storage on read", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("disabled"); });
    expect(loadGame()).toBeNull();
    spy.mockRestore();
  });
});

it("rejects malformed history before it can crash battle log or replay", () => {
  const scenario = scenarios[1];
  const state = createInitialGameState(scenario);
  for (const action of [null, {}, { type: "UNKNOWN" }, { type: "DO_MOVE", unitId: 1, payload: null },
    { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 999, armament_idx: 0 } },
    { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 2, armament_idx: -1 } }]) {
    localStorage.setItem("war-sim-save", JSON.stringify({ version: 2, scenarioId: scenario.id, gameState: { ...state, history: [action] } }));
    expect(loadGame()).toBeNull();
  }
});
