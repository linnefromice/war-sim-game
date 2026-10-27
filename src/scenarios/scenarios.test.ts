import { describe, expect, it } from "vitest";
import { scenarios } from "./index";
import { createInitialGameState, gameReducer } from "../game/gameReducer";

describe("scenario isolation", () => {
  it("keeps tutorial and adds three distinct playable maps", () => {
    expect(scenarios.map(s => s.id)).toEqual(["tutorial", "first-contact", "combined-arms", "crossroads"]);
    for (const scenario of scenarios) {
      const state = createInitialGameState(scenario);
      expect(state.units).toEqual(scenario.units);
      expect(state.units).not.toBe(scenario.units);
      expect(new Set(state.units.map(u => `${u.status.coordinate.x},${u.status.coordinate.y}`)).size).toBe(state.units.length);
      for (const unit of state.units) {
        const { x, y } = unit.status.coordinate;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(scenario.gridSize.cols);
        expect(y).toBeLessThan(scenario.gridSize.rows);
        expect(scenario.terrain[y][x]).not.toBe("water");
        expect(unit.status.hp).toBe(unit.spec.max_hp);
        expect(unit.status.en).toBe(unit.spec.max_en);
      }
      expect(new Set(state.units.map(u => u.playerId)).size).toBe(2);
    }
  });

  it("rejects illegal actions without history or state changes", () => {
    const scenario = scenarios[1];
    const state = createInitialGameState(scenario);
    const badActions = [
      { type: "DO_MOVE" as const, unitId: 1, payload: { x: 5, y: 0 } },
      { type: "DO_MOVE" as const, unitId: 1, payload: { x: 0.5, y: 3 } },
      { type: "DO_MOVE" as const, unitId: 1, payload: { x: NaN, y: 3 } },
      { type: "DO_MOVE" as const, unitId: 2, payload: { x: 3, y: 0 } },
      { type: "DO_ATTACK" as const, unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } },
      { type: "DO_ATTACK" as const, unitId: 1, payload: { target_unit_id: 1, armament_idx: 0 } },
      { type: "DO_ATTACK" as const, unitId: 1, payload: { target_unit_id: 2, armament_idx: 999 } },
      { type: "DO_MOVE" as const, unitId: 999, payload: { x: 0, y: 2 } },
    ];
    for (const action of badActions) expect(gameReducer(state, action, scenario)).toBe(state);
  });
});

describe("action and reset regressions", () => {
  it("deeply resets HP, EN, flags, orientation, history, turn and winner", () => {
    const scenario = scenarios[1];
    const state = createInitialGameState(scenario);
    state.units[0].status.hp = 1;
    state.units[0].status.en = 0;
    state.units[0].status.moved = true;
    state.units[0].status.attacked = true;
    state.units[0].status.previousCoordinate.x = 4;
    state.units[0].spec.armaments[0].value = 99999;
    state.history.push({ type: "TURN_END" });
    state.activePlayerId = 2;
    state.turnNumber = 8;
    state.phase = { type: "finished", winner: 2 };
    const reset = createInitialGameState(scenario);
    expect(reset.units).toEqual(scenario.units);
    expect(reset.activePlayerId).toBe(1);
    expect(reset.phase).toEqual({ type: "playing" });
    expect(reset.history).toEqual([]);
    expect(reset.turnNumber).toBe(1);
    expect(reset.units[0].status.hp).toBe(200);
    expect(reset.units[0].spec.armaments[0].value).toBe(100);
  });

  it("rejects occupied cells, repeated movement and undo into an occupied origin", () => {
    const scenario = scenarios[2];
    const state = createInitialGameState(scenario);
    expect(gameReducer(state, { type: "DO_MOVE", unitId: 1, payload: { x: 1, y: 4 } }, scenario)).toBe(state);
    const moved = gameReducer(state, { type: "DO_MOVE", unitId: 1, payload: { x: 0, y: 3 } }, scenario);
    expect(gameReducer(moved, { type: "DO_MOVE", unitId: 1, payload: { x: 0, y: 2 } }, scenario)).toBe(moved);
    const occupied = gameReducer(moved, { type: "DO_MOVE", unitId: 2, payload: { x: 0, y: 4 } }, scenario);
    expect(gameReducer(occupied, { type: "UNDO_MOVE", unitId: 1 }, scenario)).toBe(occupied);
  });

  it("undoes to this turn's origin after several turns rather than teleporting to spawn", () => {
    const scenario = scenarios[1];
    let state = createInitialGameState(scenario);
    state = gameReducer(state, { type: "DO_MOVE", unitId: 1, payload: { x: 0, y: 2 } }, scenario);
    state = gameReducer(state, { type: "TURN_END" }, scenario);
    state = gameReducer(state, { type: "TURN_END" }, scenario);
    state = gameReducer(state, { type: "DO_MOVE", unitId: 1, payload: { x: 0, y: 1 } }, scenario);
    state = gameReducer(state, { type: "UNDO_MOVE", unitId: 1 }, scenario);
    expect(state.units[0].status.coordinate).toEqual({ x: 0, y: 2 });
    expect(state.units[0].status.moved).toBe(false);
  });

  it("rejects repeated attacks, insufficient energy and missing targets", () => {
    const scenario = scenarios[1];
    const state = createInitialGameState(scenario);
    state.units[0].status.coordinate = { x: 3, y: 0 };
    const action = { type: "DO_ATTACK" as const, unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } };
    const attacked = gameReducer(state, action, scenario);
    expect(attacked.units[1].status.hp).toBe(100);
    expect(gameReducer(attacked, action, scenario)).toBe(attacked);
    state.units[0].status.en = 0;
    expect(gameReducer(state, action, scenario)).toBe(state);
    expect(gameReducer(state, { ...action, payload: { ...action.payload, target_unit_id: 999 } }, scenario)).toBe(state);
  });
});
