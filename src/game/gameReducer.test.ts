import { describe, it, expect } from "vitest";
import {
  calculateOrientation,
  getPlayer,
  nextPlayer,
  loadUnit,
  updateUnit,
  removeUnit,
  gameReducer,
} from "./gameReducer";
import { Player, UnitType } from "../types";
import { GameState } from "./types";

// ── Test Helpers ──

const coord = (x: number, y: number) => ({
  coordinate: { x, y },
  previousCoordinate: { x, y },
  initialCoordinate: { x, y },
});

const makeUnit = (id: number, playerId: number, overrides?: Partial<UnitType["status"]>): UnitType => ({
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

const players: Player[] = [
  { id: 1, name: "Hero", rgb: [0, 0, 255] },
  { id: 2, name: "Villain", rgb: [255, 0, 0] },
];

const makeGameState = (overrides?: Partial<GameState>): GameState => ({
  activePlayerId: 1,
  units: [
    makeUnit(1, 1, { ...coord(3, 8) }),
    makeUnit(2, 2, { ...coord(5, 2) }),
  ],
  phase: { type: "playing" },
  ...overrides,
});

// ── Pure Function Tests ──

describe("calculateOrientation", () => {
  it("returns UP when moving upward", () => {
    expect(calculateOrientation({ x: 5, y: 3 }, { x: 5, y: 5 })).toBe("UP");
  });

  it("returns DOWN when moving downward", () => {
    expect(calculateOrientation({ x: 5, y: 7 }, { x: 5, y: 5 })).toBe("DOWN");
  });

  it("returns LEFT when moving left", () => {
    expect(calculateOrientation({ x: 3, y: 5 }, { x: 5, y: 5 })).toBe("LEFT");
  });

  it("returns RIGHT when moving right", () => {
    expect(calculateOrientation({ x: 7, y: 5 }, { x: 5, y: 5 })).toBe("RIGHT");
  });

  it("returns UP when current equals previous (diffY=0 >= diffX=0, diffY not > 0)", () => {
    expect(calculateOrientation({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe("UP");
  });
});

describe("getPlayer", () => {
  it("returns the player by id", () => {
    expect(getPlayer(1, players)).toEqual(players[0]);
    expect(getPlayer(2, players)).toEqual(players[1]);
  });

  it("throws when player id not found", () => {
    expect(() => getPlayer(99, players)).toThrow("Player not found: 99");
  });
});

describe("nextPlayer", () => {
  it("returns the next player in sequence", () => {
    expect(nextPlayer(1, players)).toEqual(players[1]);
  });

  it("wraps around to the first player", () => {
    expect(nextPlayer(2, players)).toEqual(players[0]);
  });

  it("throws for non-existent player id", () => {
    expect(() => nextPlayer(99, players)).toThrow("Player not found: 99");
  });
});

describe("loadUnit", () => {
  const units = [makeUnit(1, 1), makeUnit(2, 2)];

  it("returns the unit by id", () => {
    expect(loadUnit(1, units).spec.id).toBe(1);
  });

  it("throws when unit not found", () => {
    expect(() => loadUnit(99, units)).toThrow("Unit not found: 99");
  });

  it("throws when duplicate units exist", () => {
    const duped = [...units, makeUnit(1, 1)];
    expect(() => loadUnit(1, duped)).toThrow("Duplicate unit: 1");
  });
});

describe("updateUnit", () => {
  it("replaces the matching unit in the array", () => {
    const units = [makeUnit(1, 1), makeUnit(2, 2)];
    const updated = { ...units[0], status: { ...units[0].status, hp: 500 } };
    const result = updateUnit(updated, units);
    expect(result[0].status.hp).toBe(500);
    expect(result[1]).toBe(units[1]); // untouched
  });
});

describe("removeUnit", () => {
  it("removes the unit with the given id", () => {
    const units = [makeUnit(1, 1), makeUnit(2, 2)];
    const result = removeUnit(units, 1);
    expect(result).toHaveLength(1);
    expect(result[0].spec.id).toBe(2);
  });

  it("returns original array length when id not found", () => {
    const units = [makeUnit(1, 1), makeUnit(2, 2)];
    const result = removeUnit(units, 99);
    expect(result).toHaveLength(2);
  });
});

// ── Game Reducer Tests ──

describe("gameReducer", () => {
  describe("DO_MOVE", () => {
    it("updates unit coordinates and sets moved flag", () => {
      const state = makeGameState();
      const result = gameReducer(state, {
        type: "DO_MOVE",
        unitId: 1,
        payload: { x: 4, y: 7 },
      });
      const movedUnit = result.units.find((u: UnitType) => u.spec.id === 1)!;
      expect(movedUnit.status.coordinate).toEqual({ x: 4, y: 7 });
      expect(movedUnit.status.previousCoordinate).toEqual({ x: 3, y: 8 });
      expect(movedUnit.status.moved).toBe(true);
    });

    it("rejects move to negative coordinates (boundary check)", () => {
      const state = makeGameState();
      const result = gameReducer(state, {
        type: "DO_MOVE",
        unitId: 1,
        payload: { x: -1, y: 5 },
      });
      const unit = result.units.find((u: UnitType) => u.spec.id === 1)!;
      expect(unit.status.coordinate).toEqual({ x: 3, y: 8 }); // unchanged
    });

    it("rejects move beyond grid width (x >= CELL_NUM_IN_ROW)", () => {
      const state = makeGameState();
      const result = gameReducer(state, {
        type: "DO_MOVE",
        unitId: 1,
        payload: { x: 13, y: 5 },
      });
      const unit = result.units.find((u: UnitType) => u.spec.id === 1)!;
      expect(unit.status.coordinate).toEqual({ x: 3, y: 8 });
    });

    it("rejects move beyond grid height (y >= ROW_NUM)", () => {
      const state = makeGameState();
      const result = gameReducer(state, {
        type: "DO_MOVE",
        unitId: 1,
        payload: { x: 5, y: 10 },
      });
      const unit = result.units.find((u: UnitType) => u.spec.id === 1)!;
      expect(unit.status.coordinate).toEqual({ x: 3, y: 8 });
    });

    it("rejects move if unit belongs to another player", () => {
      const state = makeGameState({ activePlayerId: 1 });
      const result = gameReducer(state, {
        type: "DO_MOVE",
        unitId: 2, // player 2's unit
        payload: { x: 6, y: 3 },
      });
      const unit = result.units.find((u: UnitType) => u.spec.id === 2)!;
      expect(unit.status.coordinate).toEqual({ x: 5, y: 2 }); // unchanged
    });
  });

  describe("DO_ATTACK", () => {
    it("reduces target HP and consumes attacker EN", () => {
      const state = makeGameState();
      const result = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 1,
        payload: { target_unit_id: 2, armament_idx: 0 }, // Gun: 200 dmg, 50 EN
      });
      const attacker = result.units.find((u: UnitType) => u.spec.id === 1)!;
      const target = result.units.find((u: UnitType) => u.spec.id === 2)!;
      expect(target.status.hp).toBe(800); // 1000 - 200
      expect(attacker.status.en).toBe(150); // 200 - 50
      expect(attacker.status.attacked).toBe(true);
      expect(attacker.status.moved).toBe(true); // can't move after attack
    });

    it("removes target unit when HP drops to 0 or below", () => {
      const state = makeGameState({
        units: [
          makeUnit(1, 1, { ...coord(3, 8) }),
          makeUnit(2, 2, { ...coord(5, 2), hp: 100 }), // low HP
        ],
      });
      const result = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 1,
        payload: { target_unit_id: 2, armament_idx: 0 }, // Gun: 200 dmg
      });
      expect(result.units.find((u: UnitType) => u.spec.id === 2)).toBeUndefined();
      expect(result.units).toHaveLength(1);
    });

    it("rejects attack when EN is insufficient", () => {
      const state = makeGameState({
        units: [
          makeUnit(1, 1, { ...coord(3, 8), en: 10 }), // only 10 EN
          makeUnit(2, 2, { ...coord(5, 2) }),
        ],
      });
      const result = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 1,
        payload: { target_unit_id: 2, armament_idx: 0 }, // Gun costs 50 EN
      });
      const attacker = result.units.find((u: UnitType) => u.spec.id === 1)!;
      const target = result.units.find((u: UnitType) => u.spec.id === 2)!;
      expect(attacker.status.en).toBe(10);
      expect(target.status.hp).toBe(1000);
      expect(attacker.status.attacked).toBe(false);
    });

    it("rejects attack if unit belongs to another player", () => {
      const state = makeGameState({ activePlayerId: 1 });
      const result = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 2, // player 2's unit
        payload: { target_unit_id: 1, armament_idx: 0 },
      });
      const target = result.units.find((u: UnitType) => u.spec.id === 1)!;
      expect(target.status.hp).toBe(1000); // unchanged
    });
  });

  describe("TURN_END", () => {
    it("recovers EN for active player (capped at max), resets moved/attacked, switches player", () => {
      const state = makeGameState({
        activePlayerId: 1,
        units: [
          makeUnit(1, 1, { ...coord(3, 8), en: 150, moved: true, attacked: true }),
          makeUnit(2, 2, { ...coord(5, 2), en: 100 }),
        ],
      });
      const result = gameReducer(state, { type: "TURN_END" });

      // Player 1 unit: EN 150 + 200*0.1 = 170, moved/attacked reset
      const unit1 = result.units.find((u: UnitType) => u.spec.id === 1)!;
      expect(unit1.status.en).toBe(170);
      expect(unit1.status.moved).toBe(false);
      expect(unit1.status.attacked).toBe(false);

      // Player 2 unit: EN unchanged (not active player), but moved/attacked still reset
      const unit2 = result.units.find((u: UnitType) => u.spec.id === 2)!;
      expect(unit2.status.en).toBe(100);
      expect(unit2.status.moved).toBe(false);

      // Active player switches to 2
      expect(result.activePlayerId).toBe(2);
    });

    it("caps EN recovery at max_en", () => {
      const state = makeGameState({
        activePlayerId: 1,
        units: [
          makeUnit(1, 1, { ...coord(3, 8), en: 195 }),
          makeUnit(2, 2, { ...coord(5, 2) }),
        ],
      });
      const result = gameReducer(state, { type: "TURN_END" });
      const unit = result.units.find((u: UnitType) => u.spec.id === 1)!;
      // 195 + 20 = 215, capped to 200
      expect(unit.status.en).toBe(200);
    });
  });

  // ── GamePhase Tests ──

  describe("GamePhase", () => {
    it("stays playing when both players have units", () => {
      const state = makeGameState();
      const result = gameReducer(state, { type: "TURN_END" });
      expect(result.phase).toEqual({ type: "playing" });
    });

    it("transitions to finished when all opponent units are eliminated at TURN_END", () => {
      // Player 1 is active, player 2 has no units left
      const state = makeGameState({
        activePlayerId: 1,
        units: [
          makeUnit(1, 1, { ...coord(3, 8) }),
          // No player 2 units
        ],
      });
      const result = gameReducer(state, { type: "TURN_END" });
      expect(result.phase).toEqual({ type: "finished", winner: 1 });
    });

    it("ignores all actions when game is already finished", () => {
      const state = makeGameState({
        phase: { type: "finished", winner: 1 },
      });

      const moveResult = gameReducer(state, {
        type: "DO_MOVE",
        unitId: 1,
        payload: { x: 4, y: 7 },
      });
      expect(moveResult).toBe(state);

      const attackResult = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 1,
        payload: { target_unit_id: 2, armament_idx: 0 },
      });
      expect(attackResult).toBe(state);

      const turnEndResult = gameReducer(state, { type: "TURN_END" });
      expect(turnEndResult).toBe(state);
    });

    it("does not transition to finished during DO_ATTACK (only at TURN_END)", () => {
      const state = makeGameState({
        activePlayerId: 1,
        units: [
          makeUnit(1, 1, { ...coord(3, 8) }),
          makeUnit(2, 2, { ...coord(5, 2), hp: 100 }), // will be killed
        ],
      });
      const result = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 1,
        payload: { target_unit_id: 2, armament_idx: 0 }, // Gun: 200 dmg > 100 HP
      });
      // Unit killed but phase stays "playing" until TURN_END
      expect(result.phase).toEqual({ type: "playing" });
      expect(result.units).toHaveLength(1);
    });

    it("full sequence: attack kills last unit then TURN_END finishes game", () => {
      const state = makeGameState({
        activePlayerId: 1,
        units: [
          makeUnit(1, 1, { ...coord(3, 8) }),
          makeUnit(2, 2, { ...coord(5, 2), hp: 100 }),
        ],
      });

      // Attack kills the last opponent unit
      const afterAttack = gameReducer(state, {
        type: "DO_ATTACK",
        unitId: 1,
        payload: { target_unit_id: 2, armament_idx: 0 },
      });
      expect(afterAttack.phase).toEqual({ type: "playing" });

      // TURN_END detects no opponent units
      const afterTurnEnd = gameReducer(afterAttack, { type: "TURN_END" });
      expect(afterTurnEnd.phase).toEqual({ type: "finished", winner: 1 });
    });
  });
});
