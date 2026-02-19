import { describe, it, expect } from "vitest";
import { computeAIActions, AIAction } from "./ai";
import { UnitType } from "../types";

// ── Test Helpers ──

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
      { name: "Missile", value: 400, range: 3, consumed_en: 100 },
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

const AI_PLAYER_ID = 2;

describe("computeAIActions", () => {
  it("always ends with turn_end", () => {
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 2) }),
      makeUnit(2, 1, { ...coord(5, 8) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[actions.length - 1]).toEqual({ type: "turn_end" });
  });

  it("generates move action toward nearest enemy", () => {
    // AI unit at (5,2), enemy at (5,8) — AI should move toward enemy (closer to row 8)
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 2) }),
      makeUnit(2, 1, { ...coord(5, 8) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const moveAction = actions.find(a => a.type === "move");
    expect(moveAction).toBeDefined();
    if (moveAction && moveAction.type === "move") {
      // Should have moved closer to y=8 (i.e., y > 2)
      expect(moveAction.payload.y).toBeGreaterThan(2);
      expect(moveAction.unitId).toBe(1);
    }
  });

  it("generates attack action when enemy is within weapon range", () => {
    // AI unit at (5,3), enemy at (5,4) — distance 1, within Gun range (2)
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3) }),
      makeUnit(2, 1, { ...coord(5, 4) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const attackAction = actions.find(a => a.type === "attack");
    expect(attackAction).toBeDefined();
    if (attackAction && attackAction.type === "attack") {
      expect(attackAction.payload.target_unit_id).toBe(2);
      expect(attackAction.unitId).toBe(1);
    }
  });

  it("selects highest-damage weapon when multiple weapons are in range", () => {
    // AI unit at (5,3), enemy at (5,5) — distance 2, within both Gun (range 2) and Missile (range 3)
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3) }),
      makeUnit(2, 1, { ...coord(5, 5) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const attackAction = actions.find(
      (a): a is Extract<AIAction, { type: "attack" }> => a.type === "attack"
    );
    expect(attackAction).toBeDefined();
    // Missile (idx 1) does 400 damage vs Gun (idx 0) 200 damage, both on plain
    expect(attackAction!.payload.armament_idx).toBe(1);
  });

  it("does not attack when no weapon has enough EN", () => {
    // AI unit has only 10 EN, Gun costs 50, Missile costs 100
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3), en: 10 }),
      makeUnit(2, 1, { ...coord(5, 4) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const attackAction = actions.find(a => a.type === "attack");
    expect(attackAction).toBeUndefined();
  });

  it("does not move to a cell occupied by another unit", () => {
    // AI unit at (5,2), friendly unit at (5,3), enemy far away at (5,8)
    // The AI should not move to (5,3) which is occupied by the friendly unit
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 2) }),
      makeUnit(3, AI_PLAYER_ID, { ...coord(5, 3) }),
      makeUnit(2, 1, { ...coord(5, 8) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const moveActions = actions.filter(
      (a): a is Extract<AIAction, { type: "move" }> => a.type === "move"
    );

    for (const move of moveActions) {
      // No move action should target the occupied friendly cell
      if (move.unitId === 1) {
        expect(`${move.payload.x},${move.payload.y}`).not.toBe("5,3");
      }
    }
  });

  it("does not generate move action for unit that already moved", () => {
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3), moved: true }),
      makeUnit(2, 1, { ...coord(5, 8) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const moveAction = actions.find(
      (a): a is Extract<AIAction, { type: "move" }> =>
        a.type === "move" && a.unitId === 1
    );
    expect(moveAction).toBeUndefined();
  });

  it("does not generate attack action for unit that already attacked", () => {
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3), attacked: true }),
      makeUnit(2, 1, { ...coord(5, 4) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const attackAction = actions.find(
      (a): a is Extract<AIAction, { type: "attack" }> =>
        a.type === "attack" && a.unitId === 1
    );
    expect(attackAction).toBeUndefined();
  });

  it("processes multiple AI units in spec.id order", () => {
    const units = [
      makeUnit(5, AI_PLAYER_ID, { ...coord(7, 2) }),
      makeUnit(3, AI_PLAYER_ID, { ...coord(5, 2) }),
      makeUnit(2, 1, { ...coord(5, 8) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    // Filter move actions — unit 3 (lower id) should come before unit 5
    const moveActions = actions.filter(
      (a): a is Extract<AIAction, { type: "move" }> => a.type === "move"
    );
    expect(moveActions.length).toBe(2);
    expect(moveActions[0].unitId).toBe(3);
    expect(moveActions[1].unitId).toBe(5);
  });

  it("returns only turn_end when AI has no units", () => {
    const units = [
      makeUnit(1, 1, { ...coord(5, 8) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);
    expect(actions).toEqual([{ type: "turn_end" }]);
  });

  it("returns only turn_end when there are no enemies", () => {
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 2) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);
    // Should just end turn since there's nothing to attack or move toward
    expect(actions[actions.length - 1]).toEqual({ type: "turn_end" });
  });

  // ── Difficulty-specific tests ──

  describe("normal difficulty", () => {
    it("prefers attacking wounded enemy over full-HP enemy", () => {
      // Two enemies in range: one at full HP (1000), one wounded (200)
      const units = [
        makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3) }),
        makeUnit(2, 1, { ...coord(5, 4), hp: 1000 }),  // full HP
        makeUnit(3, 1, { ...coord(5, 5), hp: 200 }),    // wounded
      ];
      const actions = computeAIActions(units, AI_PLAYER_ID, "normal");

      const attackAction = actions.find(
        (a): a is Extract<AIAction, { type: "attack" }> => a.type === "attack"
      );
      expect(attackAction).toBeDefined();
      // Should prefer the wounded enemy (id=3) since damage scoring considers HP ratio
      // Wounded at 200/1000 = 20% HP, gets higher priority than full HP
      expect(attackAction!.payload.target_unit_id).toBe(3);
    });

    it("prioritizes killable target over wounded target", () => {
      // Enemy with 100 HP (killable with Gun 200 damage) vs enemy with 300 HP (wounded but not killable)
      const units = [
        makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3) }),
        makeUnit(2, 1, { ...coord(5, 4), hp: 100 }),   // killable
        makeUnit(3, 1, { ...coord(5, 5), hp: 300 }),    // wounded but not killable with best weapon in range
      ];
      const actions = computeAIActions(units, AI_PLAYER_ID, "normal");

      const attackAction = actions.find(
        (a): a is Extract<AIAction, { type: "attack" }> => a.type === "attack"
      );
      expect(attackAction).toBeDefined();
      expect(attackAction!.payload.target_unit_id).toBe(2);
    });
  });

  describe("hard difficulty", () => {
    it("multiple AI units prefer attacking same target (focus fire)", () => {
      // Two AI units, two enemies — hard should focus fire on one target
      const units = [
        makeUnit(1, AI_PLAYER_ID, { ...coord(5, 3) }),
        makeUnit(2, AI_PLAYER_ID, { ...coord(7, 3) }),
        makeUnit(3, 1, { ...coord(5, 4), hp: 1000 }),
        makeUnit(4, 1, { ...coord(7, 4), hp: 1000 }),
      ];
      const actions = computeAIActions(units, AI_PLAYER_ID, "hard");

      const attackActions = actions.filter(
        (a): a is Extract<AIAction, { type: "attack" }> => a.type === "attack"
      );
      expect(attackActions.length).toBe(2);
      // Second AI unit should prefer the same target as the first (focus fire bonus)
      expect(attackActions[1].payload.target_unit_id).toBe(attackActions[0].payload.target_unit_id);
    });
  });

  it("moves first then attacks in the same turn for a unit", () => {
    // AI unit at (5,2), enemy at (5,5) — distance 3
    // Movement range 3 allows moving to (5,4) or (5,5) area
    // After moving closer, should be able to attack
    const units = [
      makeUnit(1, AI_PLAYER_ID, { ...coord(5, 2) }),
      makeUnit(2, 1, { ...coord(5, 5) }),
    ];
    const actions = computeAIActions(units, AI_PLAYER_ID);

    const moveIdx = actions.findIndex(a => a.type === "move" && a.unitId === 1);
    const attackIdx = actions.findIndex(a => a.type === "attack" && a.unitId === 1);

    // Both should exist
    expect(moveIdx).not.toBe(-1);
    expect(attackIdx).not.toBe(-1);
    // Move should come before attack
    expect(moveIdx).toBeLessThan(attackIdx);
  });
});
