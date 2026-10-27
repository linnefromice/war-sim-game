import { describe, expect, it } from "vitest";
import { shortScenarios } from "./index";
import { gameReducer } from "../game/gameReducer";
import { victoryWitness, TRACE_ACTION_LIMIT, TRACE_HALF_TURN_LIMIT } from "../test/scenarioWitness";

describe.each(shortScenarios)("$id legal victory reachability", scenario => {
  it.each([1, 2])("reaches winner %i within the fixed budget and freezes after victory", winner => {
    const trace = victoryWitness(scenario, winner);
    expect(trace.actionCount).toBeLessThanOrEqual(TRACE_ACTION_LIMIT);
    expect(trace.halfTurns).toBeLessThanOrEqual(TRACE_HALF_TURN_LIMIT);
    const last = trace.steps[trace.steps.length - 1];
    expect(last.action.type).toBe("TURN_END");
    expect(last.state.phase).toEqual({ type: "finished", winner });
    const finalKill = trace.steps[trace.steps.length - 2];
    expect(finalKill.action.type).toBe("DO_ATTACK");
    expect(finalKill.state.phase.type).toBe("playing");
    expect(finalKill.state.units.every(u => u.playerId === winner)).toBe(true);
    for (const action of [
      { type: "TURN_END" as const },
      { type: "DO_MOVE" as const, unitId: last.state.units[0].spec.id, payload: { x: 0, y: 0 } },
      { type: "DO_ATTACK" as const, unitId: 999, payload: { target_unit_id: 999, armament_idx: 999 } },
      { type: "UNDO_MOVE" as const, unitId: last.state.units[0].spec.id },
    ]) expect(gameReducer(last.state, action, scenario)).toBe(last.state);

  });
});
