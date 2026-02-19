import { describe, it, expect } from "vitest";
import { computeStatistics } from "./statistics";
import { GameAction } from "./types";
import { UnitType, TerrainType } from "../types";
import { Scenario } from "../types/scenario";

const coord = (x: number, y: number) => ({
  coordinate: { x, y },
  previousCoordinate: { x, y },
  initialCoordinate: { x, y },
});

const makeUnit = (
  id: number,
  playerId: number,
  overrides?: Partial<UnitType["status"]>
): UnitType => ({
  spec: {
    id,
    name: `UNIT-${id}`,
    unit_type: "fighter",
    movement_range: 3,
    max_hp: 1000,
    max_en: 200,
    armaments: [
      { name: "Gun", value: 200, range: 2, consumed_en: 50 },
    ],
  },
  status: {
    hp: 1000,
    en: 200,
    ...coord(0, 0),
    moved: false,
    attacked: false,
    ...overrides,
  },
  playerId,
});

const P: TerrainType = "plain";
const minimalTerrain: TerrainType[][] = [
  [P, P, P, P, P],
  [P, P, P, P, P],
  [P, P, P, P, P],
];

const makeScenario = (units: UnitType[]): Scenario => ({
  id: "test",
  name: "Test",
  gridSize: { rows: 3, cols: 5 },
  players: [
    { id: 1, name: "Hero", rgb: [0, 0, 255] },
    { id: 2, name: "Villain", rgb: [255, 0, 0] },
  ],
  units,
  terrain: minimalTerrain,
});

describe("computeStatistics", () => {
  it("returns zero stats for empty history", () => {
    const units = [
      makeUnit(1, 1, { ...coord(0, 0) }),
      makeUnit(2, 2, { ...coord(4, 0) }),
    ];
    const scenario = makeScenario(units);
    const stats = computeStatistics([], units, scenario);

    expect(stats.turnCount).toBe(1);
    expect(stats.mvpUnitId).toBeNull();
    for (const [, entry] of stats.perUnit) {
      expect(entry.damageDealt).toBe(0);
      expect(entry.kills).toBe(0);
      expect(entry.damageTaken).toBe(0);
    }
  });

  it("tracks damage from a single attack", () => {
    const units = [
      makeUnit(1, 1, { ...coord(0, 0), moved: true }),
      makeUnit(2, 2, { ...coord(1, 0) }),
    ];
    const scenario = makeScenario(units);
    const history: GameAction[] = [
      { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } },
    ];
    const stats = computeStatistics(history, units, scenario);

    const attackerEntry = stats.perUnit.get(1)!;
    const defenderEntry = stats.perUnit.get(2)!;

    // Fighter with moved=true gets 強襲 bonus: 200 * 1.2 * 1.0 = 240
    expect(attackerEntry.damageDealt).toBe(240);
    expect(defenderEntry.damageTaken).toBe(240);
    expect(attackerEntry.kills).toBe(0);
    expect(defenderEntry.alive).toBe(true);
  });

  it("tracks kills correctly", () => {
    const units = [
      makeUnit(1, 1, { ...coord(0, 0), moved: true }),
      makeUnit(2, 2, { ...coord(1, 0), hp: 100 }),
    ];
    const scenario = makeScenario(units);
    const history: GameAction[] = [
      { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } },
    ];
    const stats = computeStatistics(history, units, scenario);

    const attackerEntry = stats.perUnit.get(1)!;
    const defenderEntry = stats.perUnit.get(2)!;

    expect(attackerEntry.kills).toBe(1);
    expect(defenderEntry.alive).toBe(false);
  });

  it("identifies MVP as the unit with most damage dealt", () => {
    const units = [
      makeUnit(1, 1, { ...coord(0, 0), moved: true }),
      makeUnit(2, 1, { ...coord(0, 1), moved: true }),
      makeUnit(3, 2, { ...coord(1, 0) }),
      makeUnit(4, 2, { ...coord(1, 1) }),
    ];
    const scenario = makeScenario(units);
    const history: GameAction[] = [
      { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 3, armament_idx: 0 } },
      { type: "DO_ATTACK", unitId: 2, payload: { target_unit_id: 4, armament_idx: 0 } },
      { type: "DO_ATTACK", unitId: 2, payload: { target_unit_id: 3, armament_idx: 0 } },
    ];
    const stats = computeStatistics(history, units, scenario);

    // Unit 2 attacked twice (480 damage), unit 1 attacked once (240 damage)
    expect(stats.mvpUnitId).toBe(2);
  });

  it("computes per-player totals correctly", () => {
    const units = [
      makeUnit(1, 1, { ...coord(0, 0), moved: true }),
      makeUnit(2, 2, { ...coord(1, 0), hp: 100 }),
    ];
    const scenario = makeScenario(units);
    const history: GameAction[] = [
      { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } },
    ];
    const stats = computeStatistics(history, units, scenario);

    const p1 = stats.perPlayer.find(p => p.playerId === 1)!;
    const p2 = stats.perPlayer.find(p => p.playerId === 2)!;

    expect(p1.totalDamage).toBe(240);
    expect(p1.totalKills).toBe(1);
    expect(p1.unitsRemaining).toBe(1);
    expect(p1.unitsLost).toBe(0);

    expect(p2.totalDamage).toBe(0);
    expect(p2.totalKills).toBe(0);
    expect(p2.unitsLost).toBe(1);
    expect(p2.unitsRemaining).toBe(0);
  });

  it("handles multi-turn accumulation with TURN_END", () => {
    const units = [
      makeUnit(1, 1, { ...coord(0, 0), moved: true }),
      makeUnit(2, 2, { ...coord(1, 0) }),
    ];
    const scenario = makeScenario(units);
    const history: GameAction[] = [
      { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } },
      { type: "TURN_END" },
      { type: "TURN_END" },
      { type: "DO_ATTACK", unitId: 1, payload: { target_unit_id: 2, armament_idx: 0 } },
    ];
    const stats = computeStatistics(history, units, scenario);

    const attackerEntry = stats.perUnit.get(1)!;
    // Two attacks: first 240, after TURN_END moved resets to false so second attack = 200 (no 強襲)
    expect(attackerEntry.damageDealt).toBe(240 + 200);
    expect(stats.turnCount).toBe(2);
  });
});
