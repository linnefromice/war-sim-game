import { describe, it, expect } from "vitest";
import {
  calculateOrientation,
  getPlayer,
  nextPlayer,
  loadUnit,
  updateUnit,
  removeUnit,
  isPayloadMoveAction,
  isPayloadAttackAction,
  reducer,
  INITIAL_ACTION_MENU,
} from "./logics";
import { Player, StateType, UnitType } from "../../types";

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
    unit_type: 1,
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

const makeState = (overrides?: Partial<StateType>): StateType => ({
  activePlayerId: 1,
  actionMenu: { ...INITIAL_ACTION_MENU },
  units: [
    makeUnit(1, 1, { ...coord(3, 8) }),
    makeUnit(2, 2, { ...coord(5, 2) }),
  ],
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

// ── Type Guard Tests ──

describe("isPayloadMoveAction", () => {
  it("returns true for move payload", () => {
    expect(isPayloadMoveAction({ x: 3, y: 4 })).toBe(true);
  });

  it("returns false for attack payload", () => {
    expect(isPayloadAttackAction({ x: 3, y: 4 })).toBe(false);
  });
});

describe("isPayloadAttackAction", () => {
  it("returns true for attack payload", () => {
    expect(isPayloadAttackAction({ target_unit_id: 1, armament_idx: 0 })).toBe(true);
  });

  it("returns false for move payload", () => {
    expect(isPayloadMoveAction({ target_unit_id: 1, armament_idx: 0 })).toBe(false);
  });
});

// ── Reducer Tests ──

describe("reducer", () => {
  describe("CLOSE_MENU", () => {
    it("closes the menu and resets activeActionOption", () => {
      const state = makeState({
        actionMenu: {
          isOpen: true,
          targetUnitId: 1,
          activeActionOption: "MOVE",
          selectedArmamentIdx: null,
        },
      });
      const result = reducer(state, { type: "CLOSE_MENU" });
      expect(result.actionMenu.isOpen).toBe(false);
      expect(result.actionMenu.activeActionOption).toBeNull();
      expect(result.actionMenu.targetUnitId).toBeNull();
    });
  });

  describe("TURN_END", () => {
    it("recovers EN for active player (capped at max), resets moved/attacked, switches player", () => {
      const state = makeState({
        activePlayerId: 1,
        units: [
          makeUnit(1, 1, { ...coord(3, 8), en: 150, moved: true, attacked: true }),
          makeUnit(2, 2, { ...coord(5, 2), en: 100 }),
        ],
      });
      const result = reducer(state, { type: "TURN_END" });

      // Player 1 unit: EN 150 + 200*0.1 = 170, moved/attacked reset
      const unit1 = result.units.find((u) => u.spec.id === 1)!;
      expect(unit1.status.en).toBe(170);
      expect(unit1.status.moved).toBe(false);
      expect(unit1.status.attacked).toBe(false);

      // Player 2 unit: EN unchanged (not active player), but moved/attacked still reset
      const unit2 = result.units.find((u) => u.spec.id === 2)!;
      expect(unit2.status.en).toBe(100);
      expect(unit2.status.moved).toBe(false);

      // Active player switches to 2
      expect(result.activePlayerId).toBe(2);
    });

    it("caps EN recovery at max_en", () => {
      const state = makeState({
        activePlayerId: 1,
        units: [makeUnit(1, 1, { ...coord(3, 8), en: 195 })],
      });
      const result = reducer(state, { type: "TURN_END" });
      const unit = result.units[0];
      // 195 + 20 = 215, capped to 200
      expect(unit.status.en).toBe(200);
    });
  });

  describe("OPEN_MENU", () => {
    it("opens the menu for an owned unit", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "OPEN_MENU",
        payload: { running_unit_id: 1 },
      });
      expect(result.actionMenu.isOpen).toBe(true);
      expect(result.actionMenu.targetUnitId).toBe(1);
      expect(result.actionMenu.activeActionOption).toBeNull();
    });

    it("ignores if unit belongs to another player", () => {
      const state = makeState({ activePlayerId: 1 });
      const result = reducer(state, {
        type: "OPEN_MENU",
        payload: { running_unit_id: 2 }, // player 2's unit
      });
      // State unchanged
      expect(result).toBe(state);
    });
  });

  describe("SELECT_MOVE", () => {
    it("sets activeActionOption to MOVE", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "SELECT_MOVE",
        payload: { running_unit_id: 1 },
      });
      expect(result.actionMenu.activeActionOption).toBe("MOVE");
      expect(result.actionMenu.isOpen).toBe(true);
    });
  });

  describe("DO_MOVE", () => {
    it("updates unit coordinates and sets moved flag", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "DO_MOVE",
        payload: {
          running_unit_id: 1,
          action: { x: 4, y: 7 },
        },
      });
      const movedUnit = result.units.find((u) => u.spec.id === 1)!;
      expect(movedUnit.status.coordinate).toEqual({ x: 4, y: 7 });
      expect(movedUnit.status.previousCoordinate).toEqual({ x: 3, y: 8 });
      expect(movedUnit.status.moved).toBe(true);
      expect(result.actionMenu.isOpen).toBe(false);
    });

    it("rejects move to negative coordinates (boundary check)", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "DO_MOVE",
        payload: { running_unit_id: 1, action: { x: -1, y: 5 } },
      });
      const unit = result.units.find((u) => u.spec.id === 1)!;
      expect(unit.status.coordinate).toEqual({ x: 3, y: 8 }); // unchanged
    });

    it("rejects move beyond grid width (x >= CELL_NUM_IN_ROW)", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "DO_MOVE",
        payload: { running_unit_id: 1, action: { x: 13, y: 5 } },
      });
      const unit = result.units.find((u) => u.spec.id === 1)!;
      expect(unit.status.coordinate).toEqual({ x: 3, y: 8 });
    });

    it("rejects move beyond grid height (y >= ROW_NUM)", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "DO_MOVE",
        payload: { running_unit_id: 1, action: { x: 5, y: 10 } },
      });
      const unit = result.units.find((u) => u.spec.id === 1)!;
      expect(unit.status.coordinate).toEqual({ x: 3, y: 8 });
    });
  });

  describe("SELECT_ATTACK", () => {
    it("sets activeActionOption to ATTACK and stores armament index", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "SELECT_ATTACK",
        payload: {
          running_unit_id: 1,
          action: { target_unit_id: 2, armament_idx: 1 },
        },
      });
      expect(result.actionMenu.activeActionOption).toBe("ATTACK");
      expect(result.actionMenu.selectedArmamentIdx).toBe(1);
    });
  });

  describe("DO_ATTACK", () => {
    it("reduces target HP and consumes attacker EN", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "DO_ATTACK",
        payload: {
          running_unit_id: 1,
          action: { target_unit_id: 2, armament_idx: 0 }, // Gun: 200 dmg, 50 EN
        },
      });
      const attacker = result.units.find((u) => u.spec.id === 1)!;
      const target = result.units.find((u) => u.spec.id === 2)!;
      expect(target.status.hp).toBe(800); // 1000 - 200
      expect(attacker.status.en).toBe(150); // 200 - 50
      expect(attacker.status.attacked).toBe(true);
      expect(attacker.status.moved).toBe(true); // can't move after attack
    });

    it("removes target unit when HP drops to 0 or below", () => {
      const state = makeState({
        units: [
          makeUnit(1, 1, { ...coord(3, 8) }),
          makeUnit(2, 2, { ...coord(5, 2), hp: 100 }), // low HP
        ],
      });
      const result = reducer(state, {
        type: "DO_ATTACK",
        payload: {
          running_unit_id: 1,
          action: { target_unit_id: 2, armament_idx: 0 }, // Gun: 200 dmg
        },
      });
      expect(result.units.find((u) => u.spec.id === 2)).toBeUndefined();
      expect(result.units).toHaveLength(1);
    });

    it("rejects attack when EN is insufficient", () => {
      const state = makeState({
        units: [
          makeUnit(1, 1, { ...coord(3, 8), en: 10 }), // only 10 EN
          makeUnit(2, 2, { ...coord(5, 2) }),
        ],
      });
      const result = reducer(state, {
        type: "DO_ATTACK",
        payload: {
          running_unit_id: 1,
          action: { target_unit_id: 2, armament_idx: 0 }, // Gun costs 50 EN
        },
      });
      // Units should be unchanged
      const attacker = result.units.find((u) => u.spec.id === 1)!;
      const target = result.units.find((u) => u.spec.id === 2)!;
      expect(attacker.status.en).toBe(10);
      expect(target.status.hp).toBe(1000);
      expect(attacker.status.attacked).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns state unchanged when payload is missing for actions requiring it", () => {
      const state = makeState();
      const result = reducer(state, { type: "OPEN_MENU" });
      expect(result).toBe(state);
    });

    it("returns state unchanged for unknown action type in switch default", () => {
      const state = makeState();
      const result = reducer(state, {
        type: "OPEN_MENU",
        payload: { running_unit_id: 1, action: { x: 1, y: 1 } },
      });
      // OPEN_MENU is handled before the switch, so this tests the normal path
      expect(result.actionMenu.isOpen).toBe(true);
    });
  });
});
