import { ActionOptionType, Coordinate, PayloadAttackActionType, StateActionMenuType } from "../../types";

export const INITIAL_ACTION_MENU: StateActionMenuType = {
  isOpen: false,
  targetUnitId: null,
  activeActionOption: null,
  selectedArmamentIdx: null,
  animationState: { type: "idle" },
  inspectedUnitId: null,
};

export type UIAction =
  | { type: "OPEN_MENU"; unitId: number }
  | { type: "CLOSE_MENU" }
  | { type: "SELECT_MOVE" }
  | { type: "SELECT_ATTACK"; payload: PayloadAttackActionType }
  | { type: "RESET" }
  | { type: "INSPECT_UNIT"; unitId: number }
  | { type: "ANIMATION_START_MOVE"; unitId: number; from: Coordinate; to: Coordinate }
  | { type: "ANIMATION_START_ATTACK"; targetId: number; damage: number; destroyed: boolean }
  | { type: "ANIMATION_START_TURN_CHANGE"; nextPlayerId: number }
  | { type: "ANIMATION_COMPLETE" }

const nextActionOption = (type: UIAction["type"]): ActionOptionType | null => {
  if (type === "SELECT_MOVE") return "MOVE";
  if (type === "SELECT_ATTACK") return "ATTACK";
  return null;
};

export const uiReducer = (
  state: StateActionMenuType,
  action: UIAction
): StateActionMenuType => {
  // Block all actions during animation except ANIMATION_COMPLETE
  if (state.animationState.type !== "idle" && action.type !== "ANIMATION_COMPLETE") {
    return state;
  }

  switch (action.type) {
    case "OPEN_MENU":
      return {
        ...INITIAL_ACTION_MENU,
        isOpen: true,
        targetUnitId: action.unitId,
        activeActionOption: null,
        selectedArmamentIdx: null,
        inspectedUnitId: null,
      };
    case "CLOSE_MENU":
    case "RESET":
      return {
        ...INITIAL_ACTION_MENU,
        activeActionOption: nextActionOption(action.type),
        inspectedUnitId: null,
      };
    case "INSPECT_UNIT":
      return {
        ...INITIAL_ACTION_MENU,
        inspectedUnitId: action.unitId,
      };
    case "SELECT_MOVE":
      return {
        ...state,
        activeActionOption: nextActionOption(action.type),
        selectedArmamentIdx: null,
      };
    case "SELECT_ATTACK":
      return {
        ...state,
        activeActionOption: nextActionOption(action.type),
        selectedArmamentIdx: action.payload.armament_idx,
      };
    case "ANIMATION_START_MOVE":
      return {
        ...INITIAL_ACTION_MENU,
        animationState: { type: "move", unitId: action.unitId, from: action.from, to: action.to },
      };
    case "ANIMATION_START_ATTACK":
      return {
        ...INITIAL_ACTION_MENU,
        animationState: { type: "attack", targetId: action.targetId, damage: action.damage, destroyed: action.destroyed },
      };
    case "ANIMATION_START_TURN_CHANGE":
      return {
        ...state,
        isOpen: false,
        targetUnitId: null,
        activeActionOption: null,
        selectedArmamentIdx: null,
        animationState: { type: "turn_change", nextPlayerId: action.nextPlayerId },
      };
    case "ANIMATION_COMPLETE":
      return {
        ...state,
        animationState: { type: "idle" },
      };
    default:
      return state;
  }
};
