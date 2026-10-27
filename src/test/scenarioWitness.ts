// Test-only reachability witnesses; never used as an in-game opponent.
import { Scenario } from "../types/scenario";
import { GameAction, GameState } from "../game/types";
import { calculateDamage, createInitialGameState, gameReducer } from "../game/gameReducer";
import { getReachableCells } from "../game/movement";
import { manhattanDistance } from "../game/utils";

export const TRACE_ACTION_LIMIT = 200;
export const TRACE_HALF_TURN_LIMIT = 80;
export const victoryWitness = (scenario: Scenario, winner: number) => {
  let state = createInitialGameState(scenario);
  let halfTurns = 0;
  const steps: { action: GameAction; state: GameState }[] = [];
  const apply = (action: GameAction) => {
    if (steps.length >= TRACE_ACTION_LIMIT) throw new Error("Trace action budget exceeded");
    const next = gameReducer(state, action, scenario);
    if (next === state) throw new Error(`Rejected witness action: ${JSON.stringify(action)}`);
    state = next;
    steps.push({ action, state });
  };
  while (state.phase.type === "playing") {
    if (halfTurns >= TRACE_HALF_TURN_LIMIT) throw new Error("Trace half-turn budget exceeded");
    if (state.activePlayerId === winner) {
      for (const id of state.units.filter(u => u.playerId === winner).map(u => u.spec.id)) {
        let unit = state.units.find(u => u.spec.id === id)!;
        let enemies = state.units.filter(u => u.playerId !== winner);
        if (!enemies.length) break;
        const distance = (position: { x: number; y: number }) => Math.min(...enemies.map(e => manhattanDistance(position, e.status.coordinate)));
        const destinations = [...getReachableCells(unit.status.coordinate, unit.spec.movement_range, scenario)]
          .map(key => { const [x, y] = key.split(",").map(Number); return { x, y }; })
          .filter(p => !state.units.some(u => manhattanDistance(p, u.status.coordinate) === 0))
          .sort((a, b) => distance(a) - distance(b) || a.y - b.y || a.x - b.x);
        const destination = destinations[0];
        if (destination && distance(destination) < distance(unit.status.coordinate)) {
          apply({ type: "DO_MOVE", unitId: id, payload: destination });
          unit = state.units.find(u => u.spec.id === id)!;
        }
        enemies = state.units.filter(u => u.playerId !== winner);
        const attacks = enemies.flatMap(target => unit.spec.armaments.map((weapon, armament_idx) => ({ target, weapon, armament_idx })))
          .filter(a => a.weapon.consumed_en <= unit.status.en && manhattanDistance(unit.status.coordinate, a.target.status.coordinate) <= a.weapon.range)
          .map(a => ({ ...a, damage: calculateDamage(unit, a.target, a.weapon, scenario.terrain[a.target.status.coordinate.y][a.target.status.coordinate.x], state.units).damage }))
          .sort((a, b) => Number(b.damage >= b.target.status.hp) - Number(a.damage >= a.target.status.hp) || b.damage - a.damage || a.target.spec.id - b.target.spec.id);
        if (attacks[0]) apply({ type: "DO_ATTACK", unitId: id, payload: { target_unit_id: attacks[0].target.spec.id, armament_idx: attacks[0].armament_idx } });
      }
    }
    apply({ type: "TURN_END" });
    halfTurns++;
  }
  return { scenarioId: scenario.id, winner, halfTurns, actionCount: steps.length, steps };
};
