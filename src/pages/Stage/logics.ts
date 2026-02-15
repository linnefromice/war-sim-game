import { ActionOptionType, PayloadAttackActionType, StateActionMenuType } from "../../types";

export const INITIAL_ACTION_MENU: StateActionMenuType = {
  isOpen: false,
  targetUnitId: null,
  activeActionOption: null,
  selectedArmamentIdx: null,
};

export type UIAction =
  | { type: "OPEN_MENU"; unitId: number }
  | { type: "CLOSE_MENU" }
  | { type: "SELECT_MOVE" }
  | { type: "SELECT_ATTACK"; payload: PayloadAttackActionType }
  | { type: "RESET" }

const nextActionOption = (type: UIAction["type"]): ActionOptionType | null => {
  if (type === "SELECT_MOVE") return "MOVE";
  if (type === "SELECT_ATTACK") return "ATTACK";
  return null;
};

export const uiReducer = (
  state: StateActionMenuType,
  action: UIAction
): StateActionMenuType => {
  switch (action.type) {
    case "OPEN_MENU":
      return {
        isOpen: true,
        targetUnitId: action.unitId,
        activeActionOption: null,
        selectedArmamentIdx: null,
      };
    case "CLOSE_MENU":
    case "RESET":
      return {
        ...INITIAL_ACTION_MENU,
        activeActionOption: nextActionOption(action.type),
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
    default:
      return state;
  }
};
