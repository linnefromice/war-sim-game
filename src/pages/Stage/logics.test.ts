import { describe, it, expect } from "vitest";
import { INITIAL_ACTION_MENU, uiReducer } from "./logics";
import { StateActionMenuType } from "../../types";

// Helper: create a state with idle animation (default for most tests)
const withIdle = (overrides: Partial<StateActionMenuType>): StateActionMenuType => ({
  ...INITIAL_ACTION_MENU,
  ...overrides,
});

// ── UI Reducer Tests ──

describe("uiReducer", () => {
  describe("OPEN_MENU", () => {
    it("opens the menu for a unit", () => {
      const result = uiReducer(INITIAL_ACTION_MENU, {
        type: "OPEN_MENU",
        unitId: 1,
      });
      expect(result.isOpen).toBe(true);
      expect(result.targetUnitId).toBe(1);
      expect(result.activeActionOption).toBeNull();
      expect(result.selectedArmamentIdx).toBeNull();
      expect(result.animationState).toEqual({ type: "idle" });
    });
  });

  describe("CLOSE_MENU", () => {
    it("closes the menu and resets all fields", () => {
      const openState = withIdle({
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: "MOVE",
      });
      const result = uiReducer(openState, { type: "CLOSE_MENU" });
      expect(result.isOpen).toBe(false);
      expect(result.activeActionOption).toBeNull();
      expect(result.targetUnitId).toBeNull();
      expect(result.animationState).toEqual({ type: "idle" });
    });
  });

  describe("SELECT_MOVE", () => {
    it("sets activeActionOption to MOVE", () => {
      const openState = withIdle({
        isOpen: true,
        targetUnitId: 1,
      });
      const result = uiReducer(openState, { type: "SELECT_MOVE" });
      expect(result.activeActionOption).toBe("MOVE");
      expect(result.isOpen).toBe(true);
      expect(result.targetUnitId).toBe(1);
      expect(result.selectedArmamentIdx).toBeNull();
    });
  });

  describe("SELECT_ATTACK", () => {
    it("sets activeActionOption to ATTACK and stores armament index", () => {
      const openState = withIdle({
        isOpen: true,
        targetUnitId: 1,
      });
      const result = uiReducer(openState, {
        type: "SELECT_ATTACK",
        payload: { target_unit_id: 2, armament_idx: 1 },
      });
      expect(result.activeActionOption).toBe("ATTACK");
      expect(result.selectedArmamentIdx).toBe(1);
      expect(result.isOpen).toBe(true);
      expect(result.targetUnitId).toBe(1);
    });
  });

  describe("RESET", () => {
    it("resets to initial state (used after game actions)", () => {
      const openState = withIdle({
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: "ATTACK",
        selectedArmamentIdx: 0,
      });
      const result = uiReducer(openState, { type: "RESET" });
      expect(result.isOpen).toBe(false);
      expect(result.targetUnitId).toBeNull();
      expect(result.activeActionOption).toBeNull();
      expect(result.selectedArmamentIdx).toBeNull();
      expect(result.animationState).toEqual({ type: "idle" });
    });
  });

  // ── Animation State Tests ──

  describe("ANIMATION_START_MOVE", () => {
    it("sets animationState to move and resets menu", () => {
      const openState = withIdle({
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: "MOVE",
      });
      const result = uiReducer(openState, {
        type: "ANIMATION_START_MOVE",
        unitId: 1,
        from: { x: 3, y: 8 },
        to: { x: 3, y: 5 },
      });
      expect(result.animationState).toEqual({
        type: "move",
        unitId: 1,
        from: { x: 3, y: 8 },
        to: { x: 3, y: 5 },
      });
      expect(result.isOpen).toBe(false);
      expect(result.targetUnitId).toBeNull();
    });
  });

  describe("ANIMATION_START_ATTACK", () => {
    it("sets animationState to attack and resets menu", () => {
      const openState = withIdle({
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: "ATTACK",
        selectedArmamentIdx: 0,
      });
      const result = uiReducer(openState, {
        type: "ANIMATION_START_ATTACK",
        targetId: 2,
        damage: 200,
        destroyed: false,
      });
      expect(result.animationState).toEqual({
        type: "attack",
        targetId: 2,
        damage: 200,
        destroyed: false,
      });
      expect(result.isOpen).toBe(false);
    });
  });

  describe("ANIMATION_COMPLETE", () => {
    it("resets animationState to idle", () => {
      const animatingState: StateActionMenuType = {
        ...INITIAL_ACTION_MENU,
        animationState: { type: "move", unitId: 1, from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
      };
      const result = uiReducer(animatingState, { type: "ANIMATION_COMPLETE" });
      expect(result.animationState).toEqual({ type: "idle" });
    });
  });

  describe("animation blocking", () => {
    it("ignores non-ANIMATION_COMPLETE actions during animation", () => {
      const animatingState: StateActionMenuType = {
        ...INITIAL_ACTION_MENU,
        animationState: { type: "move", unitId: 1, from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
      };

      // OPEN_MENU should be ignored
      const result1 = uiReducer(animatingState, { type: "OPEN_MENU", unitId: 2 });
      expect(result1).toBe(animatingState);

      // CLOSE_MENU should be ignored
      const result2 = uiReducer(animatingState, { type: "CLOSE_MENU" });
      expect(result2).toBe(animatingState);

      // SELECT_MOVE should be ignored
      const result3 = uiReducer(animatingState, { type: "SELECT_MOVE" });
      expect(result3).toBe(animatingState);

      // RESET should be ignored
      const result4 = uiReducer(animatingState, { type: "RESET" });
      expect(result4).toBe(animatingState);
    });

    it("allows ANIMATION_COMPLETE during animation", () => {
      const animatingState: StateActionMenuType = {
        ...INITIAL_ACTION_MENU,
        animationState: { type: "attack", targetId: 2, damage: 200, destroyed: false },
      };
      const result = uiReducer(animatingState, { type: "ANIMATION_COMPLETE" });
      expect(result.animationState).toEqual({ type: "idle" });
    });
  });
});
