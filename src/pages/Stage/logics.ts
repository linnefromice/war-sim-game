import { Reducer } from "react";
import { UnitType, OrientationType, StateType, ActionType, PayloadType, Player, PayloadMoveActionType, PayloadAttackActionType, ActionOptionType, StateActionMenuType } from "../../types";
import { PLAYERS } from "../../constants";

export const INITIAL_ACTION_MENU: StateActionMenuType = {
  isOpen: false,
  targetUnitId: null,
  activeActionOption: null,
  selectedArmamentIdx: null,
}

export const calculateOrientation = (
  current: { x: number, y: number },
  previous: { x: number, y: number }
): OrientationType => {
  const diffX = current.x - previous.x;
  const diffY = current.y - previous.y;
  if (Math.abs(diffY) >= Math.abs(diffX)) {
    return diffY > 0 ? "DOWN" : "UP";
  } else {
    return diffX > 0 ? "RIGHT" : "LEFT";
  }
}

// Player
export const getPlayer = (id: number, players: Player[]) => {
  const idx = getIdxInPlayer(id, players);
  return players[idx];
}

export const nextPlayer = (id: number, players: Player[]) => {
  const idx = getIdxInPlayer(id, players);
  const nextIdx = (idx + 1) % players.length;
  return players[nextIdx];
}

const getIdxInPlayer = (id: number, players: Player[]) => {
  const idx = players.findIndex((player) => player.id === id);
  if (idx === -1) throw new Error(`Player not found: ${id}`);
  return idx;
}

// Unit
export const loadUnit = (
  id: number,
  units: UnitType[]
): UnitType => {
  const filtered = units.filter((unit) => unit.spec.id === id);
  if (filtered.length === 0) throw new Error(`Unit not found: ${id}`);
  if (filtered.length > 1) throw new Error(`Duplicate unit: ${id}`);
  return filtered[0];
}

export const updateUnit = (
  updatedUnit: UnitType,
  previousUnits: UnitType[]
): UnitType[] => {
  const newUnits = previousUnits.map((previous) => {
    if (previous.spec.id === updatedUnit.spec.id) {
      return updatedUnit;
    } else {
      return previous;
    }
  });

  return newUnits;
}

export const removeUnit = (
  units: UnitType[],
  targetId: number
): UnitType[] => {
  const remains = units.filter((unit) => unit.spec.id !== targetId);
  return remains;
};

export const reducer: Reducer<
  StateType,
  {
    type: ActionType,
    payload?: PayloadType
  }
> = (state, action) => {
  const { type, payload } = action

  if (type == "CLOSE_MENU") {
    return {
      ...state,
      actionMenu: {
        ...INITIAL_ACTION_MENU,
        activeActionOption: nextActionOptionFromPayloadType(type),
      }
    }
  }

  if (type == "TURN_END") {
    // recover executed status
    const resettedUnits = state.units.map((unit) => {

      // NOTE: recover en only for the active player
      const en = unit.playerId == state.activePlayerId
        ? Math.min(unit.status.en + unit.spec.max_en * 0.1, unit.spec.max_en)
        : unit.status.en;

      return {
        ...unit,
        status: {
          ...unit.status,
          en,
          moved: false,
          attacked: false,
        }
      }
    })

    return {
      ...state,
      actionMenu: {
        ...INITIAL_ACTION_MENU,
        activeActionOption: nextActionOptionFromPayloadType(type),
      },
      activePlayerId: nextPlayer(state.activePlayerId, PLAYERS).id,
      units: resettedUnits
    }
  }

  if (payload?.running_unit_id === undefined) return state;
  const unit_in_action = loadUnit(payload.running_unit_id, state.units);

  // Check if the unit_in_action is owned by the player
  if (unit_in_action.playerId !== state.activePlayerId) return state;

  if (type === "OPEN_MENU") {
    return {
      ...state,
      actionMenu: {
        isOpen: true,
        targetUnitId: unit_in_action.spec.id,
        activeActionOption: nextActionOptionFromPayloadType(type),
        selectedArmamentIdx: null,
      }
    }
  }

  if (type === "SELECT_MOVE") {
    return {
      ...state,
      actionMenu: {
        isOpen: true,
        targetUnitId: unit_in_action.spec.id,
        activeActionOption: nextActionOptionFromPayloadType(type),
        selectedArmamentIdx: null,
      }
    }
  }

  // Check if action exists
  if (payload.action === undefined) return state;

  switch (type) {
    case "DO_MOVE": {
      const newUnits = updateUnitsByMove(state.units, unit_in_action, payload.action as PayloadMoveActionType); // NOTE: need to type guard
      return {
        ...state,
        actionMenu: {
          ...INITIAL_ACTION_MENU,
          activeActionOption: nextActionOptionFromPayloadType(type),
        },
        units: newUnits,
      }
    }
    case "SELECT_ATTACK": {
      const action = payload.action as PayloadAttackActionType;
      return {
        ...state,
        actionMenu: {
          isOpen: true,
          targetUnitId: unit_in_action.spec.id,
          activeActionOption: nextActionOptionFromPayloadType(type),
          selectedArmamentIdx: action.armament_idx,
        }
      }
    }
    case "DO_ATTACK": {
      const newUnits = updateUnitsByAttack(state.units, unit_in_action, payload.action as PayloadAttackActionType); // NOTE: need to type guard
      return {
        ...state,
        actionMenu: {
          ...INITIAL_ACTION_MENU,
          activeActionOption: nextActionOptionFromPayloadType(type),
        },
        units: newUnits,
      }
    }
    default:
      return state
  }
}

const nextActionOptionFromPayloadType = (type: ActionType): ActionOptionType | null => {
  if (type === "SELECT_MOVE") return "MOVE";
  if (type === "SELECT_ATTACK") return "ATTACK";
  return null;
}

const updateUnitsByMove = (oldUnits: UnitType[], unit_in_action: UnitType, payloadAction: PayloadMoveActionType): UnitType[] => {
  const updatedUnit = {
    ...unit_in_action,
    status: {
      ...unit_in_action.status,
      previousCoordinate: unit_in_action.status.coordinate,
      coordinate: { x: payloadAction.x, y: payloadAction.y },
      moved: true,
    }
  }
  return updateUnit(updatedUnit, oldUnits);
}

const updateUnitsByAttack = (oldUnits: UnitType[], unit_in_action: UnitType, payloadAction: PayloadAttackActionType): UnitType[] => {
  const attacked = loadUnit(payloadAction.target_unit_id, oldUnits);

  const armament = unit_in_action.spec.armaments[payloadAction.armament_idx];
  const remainHp = attacked.status.hp - armament.value;

  // update for attacked
  const newUnits = remainHp > 0
    ? (() => {
      const updatedUnit = {
        ...attacked,
        status: {
          ...attacked.status,
          hp: remainHp,
        }
      }
      return updateUnit(updatedUnit, oldUnits);
    })() : removeUnit(oldUnits, attacked.spec.id);

  // update for attacking
  const remainEn = unit_in_action.status.en - armament.consumed_en; // NOTE: need to check if en is enough / TODO: validation

  const updatedAttacking = {
    ...unit_in_action,
    status: {
      ...unit_in_action.status,
      en: remainEn,
      moved: true, // NOTE: cannot move after an attack.
      attacked: true,
    }
  }
  return updateUnit(updatedAttacking, newUnits)
}
