import { describe, it, expect } from "vitest";
import { INITIAL_ACTION_MENU, uiReducer } from "./logics";

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
    });
  });

  describe("CLOSE_MENU", () => {
    it("closes the menu and resets all fields", () => {
      const openState = {
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: "MOVE" as const,
        selectedArmamentIdx: null,
      };
      const result = uiReducer(openState, { type: "CLOSE_MENU" });
      expect(result.isOpen).toBe(false);
      expect(result.activeActionOption).toBeNull();
      expect(result.targetUnitId).toBeNull();
    });
  });

  describe("SELECT_MOVE", () => {
    it("sets activeActionOption to MOVE", () => {
      const openState = {
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: null,
        selectedArmamentIdx: null,
      };
      const result = uiReducer(openState, { type: "SELECT_MOVE" });
      expect(result.activeActionOption).toBe("MOVE");
      expect(result.isOpen).toBe(true);
      expect(result.targetUnitId).toBe(1);
      expect(result.selectedArmamentIdx).toBeNull();
    });
  });

  describe("SELECT_ATTACK", () => {
    it("sets activeActionOption to ATTACK and stores armament index", () => {
      const openState = {
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: null,
        selectedArmamentIdx: null,
      };
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
      const openState = {
        isOpen: true,
        targetUnitId: 1,
        activeActionOption: "ATTACK" as const,
        selectedArmamentIdx: 0,
      };
      const result = uiReducer(openState, { type: "RESET" });
      expect(result.isOpen).toBe(false);
      expect(result.targetUnitId).toBeNull();
      expect(result.activeActionOption).toBeNull();
      expect(result.selectedArmamentIdx).toBeNull();
    });
  });
});
