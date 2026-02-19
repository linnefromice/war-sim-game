import { UnitType, Armament, OrientationType, Player, PayloadMoveActionType, PayloadAttackActionType, TerrainType } from "../types";
import { tutorialScenario } from "../scenarios/tutorial";
import { GameState, GameAction } from "./types";
import { manhattanDistance } from "./utils";

// --- Terrain helpers ---

export const getTerrainDefenseReduction = (terrain: TerrainType): number => {
  switch (terrain) {
    case "plain": return 0;
    case "forest": return 0.2;
    case "mountain": return 0.4;
    case "water": return 0;
  }
};

// --- Damage Calculation (unified) ---

const MAX_DEFENSE_REDUCTION = 0.9;

export const calculateDamage = (
  attacker: UnitType,
  defender: UnitType,
  armament: Armament,
  defenderTerrain: TerrainType,
  allUnits: UnitType[],
): { damage: number; modifiers: string[] } => {
  const modifiers: string[] = [];
  let attackMultiplier = 1;
  let defenseReduction = getTerrainDefenseReduction(defenderTerrain);

  // Fighter ability: "強襲" — +20% attack when moved
  if (attacker.spec.unit_type === "fighter" && attacker.status.moved) {
    attackMultiplier += 0.2;
    modifiers.push("+20% 強襲");
  }

  // Tank ability: "装甲陣地" — +10% defense for defender if adjacent friendly tank exists
  const hasAdjacentFriendlyTank = allUnits.some(
    (u) =>
      u.spec.id !== defender.spec.id &&
      u.playerId === defender.playerId &&
      u.spec.unit_type === "tank" &&
      manhattanDistance(u.status.coordinate, defender.status.coordinate) === 1,
  );
  if (hasAdjacentFriendlyTank) {
    defenseReduction += 0.1;
    modifiers.push("+10% 装甲陣地");
  }

  // Soldier ability: "迷彩" — +20% defense in forest terrain
  if (defender.spec.unit_type === "soldier" && defenderTerrain === "forest") {
    defenseReduction += 0.2;
    modifiers.push("+20% 迷彩");
  }

  // Cap defense at MAX_DEFENSE_REDUCTION
  defenseReduction = Math.min(defenseReduction, MAX_DEFENSE_REDUCTION);

  const damage = Math.floor(armament.value * attackMultiplier * (1 - defenseReduction));
  return { damage, modifiers };
};

// --- Type Guards ---

export const isPayloadMoveAction = (payload: unknown): payload is PayloadMoveActionType => {
  if (typeof payload !== 'object' || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return 'x' in obj && 'y' in obj && typeof obj.x === 'number' && typeof obj.y === 'number';
};

export const isPayloadAttackAction = (payload: unknown): payload is PayloadAttackActionType => {
  if (typeof payload !== 'object' || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return 'target_unit_id' in obj && 'armament_idx' in obj &&
         typeof obj.target_unit_id === 'number' && typeof obj.armament_idx === 'number';
};

// --- Helper functions (shared with UI) ---

export const calculateOrientation = (
  current: { x: number; y: number },
  previous: { x: number; y: number }
): OrientationType => {
  const diffX = current.x - previous.x;
  const diffY = current.y - previous.y;
  if (Math.abs(diffY) >= Math.abs(diffX)) {
    return diffY > 0 ? "DOWN" : "UP";
  } else {
    return diffX > 0 ? "RIGHT" : "LEFT";
  }
};

export const getPlayer = (id: number, players: Player[]) => {
  const idx = getIdxInPlayer(id, players);
  return players[idx];
};

export const nextPlayer = (id: number, players: Player[]) => {
  const idx = getIdxInPlayer(id, players);
  const nextIdx = (idx + 1) % players.length;
  return players[nextIdx];
};

const getIdxInPlayer = (id: number, players: Player[]) => {
  const idx = players.findIndex((player) => player.id === id);
  if (idx === -1) throw new Error(`Player not found: ${id}`);
  return idx;
};

export const loadUnit = (id: number, units: UnitType[]): UnitType => {
  const filtered = units.filter((unit) => unit.spec.id === id);
  if (filtered.length === 0) throw new Error(`Unit not found: ${id}`);
  if (filtered.length > 1) throw new Error(`Duplicate unit: ${id}`);
  return filtered[0];
};

export const updateUnit = (
  updatedUnit: UnitType,
  previousUnits: UnitType[]
): UnitType[] => {
  return previousUnits.map((previous) =>
    previous.spec.id === updatedUnit.spec.id ? updatedUnit : previous
  );
};

export const removeUnit = (units: UnitType[], targetId: number): UnitType[] => {
  return units.filter((unit) => unit.spec.id !== targetId);
};

// --- Internal helpers ---

const updateUnitsByMove = (
  oldUnits: UnitType[],
  unitInAction: UnitType,
  payloadAction: PayloadMoveActionType
): UnitType[] => {
  const { x, y } = payloadAction;
  if (x < 0 || x >= tutorialScenario.gridSize.cols || y < 0 || y >= tutorialScenario.gridSize.rows) return oldUnits;

  // Block movement to water terrain
  const terrain = tutorialScenario.terrain[y][x];
  if (terrain === "water") return oldUnits;

  const updatedUnit = {
    ...unitInAction,
    status: {
      ...unitInAction.status,
      previousCoordinate: unitInAction.status.coordinate,
      coordinate: { x, y },
      moved: true,
    },
  };
  return updateUnit(updatedUnit, oldUnits);
};

const updateUnitsByAttack = (
  oldUnits: UnitType[],
  unitInAction: UnitType,
  payloadAction: PayloadAttackActionType
): UnitType[] => {
  const armament = unitInAction.spec.armaments[payloadAction.armament_idx];
  if (armament.consumed_en > unitInAction.status.en) return oldUnits;

  const attacked = loadUnit(payloadAction.target_unit_id, oldUnits);
  const targetTerrain = tutorialScenario.terrain[attacked.status.coordinate.y][attacked.status.coordinate.x];
  const { damage: actualDamage } = calculateDamage(unitInAction, attacked, armament, targetTerrain, oldUnits);
  const remainHp = attacked.status.hp - actualDamage;

  const newUnits =
    remainHp > 0
      ? updateUnit(
          {
            ...attacked,
            status: { ...attacked.status, hp: remainHp },
          },
          oldUnits
        )
      : removeUnit(oldUnits, attacked.spec.id);

  const remainEn = unitInAction.status.en - armament.consumed_en;
  const updatedAttacking = {
    ...unitInAction,
    status: {
      ...unitInAction.status,
      en: remainEn,
      attacked: true,
    },
  };
  return updateUnit(updatedAttacking, newUnits);
};

// --- Game Reducer (no React dependency) ---

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (state.phase.type === "finished") return state;

  switch (action.type) {
    case "DO_MOVE": {
      const unitInAction = loadUnit(action.unitId, state.units);
      if (unitInAction.playerId !== state.activePlayerId) return state;
      const newUnits = updateUnitsByMove(state.units, unitInAction, action.payload);
      return { ...state, units: newUnits, history: [...state.history, action] };
    }

    case "DO_ATTACK": {
      const unitInAction = loadUnit(action.unitId, state.units);
      if (unitInAction.playerId !== state.activePlayerId) return state;
      const newUnits = updateUnitsByAttack(state.units, unitInAction, action.payload);
      return { ...state, units: newUnits, history: [...state.history, action] };
    }

    case "UNDO_MOVE": {
      const unit = loadUnit(action.unitId, state.units);
      if (unit.playerId !== state.activePlayerId) return state;
      if (!unit.status.moved) return state;
      if (unit.status.attacked) return state;
      const updatedUnit = {
        ...unit,
        status: {
          ...unit.status,
          coordinate: unit.status.initialCoordinate,
          previousCoordinate: unit.status.initialCoordinate,
          moved: false,
        },
      };
      return { ...state, units: updateUnit(updatedUnit, state.units), history: [...state.history, action] };
    }

    case "TURN_END": {
      const resettedUnits = state.units.map((unit) => {
        const en =
          unit.playerId === state.activePlayerId
            ? Math.min(unit.status.en + unit.spec.max_en * 0.1, unit.spec.max_en)
            : unit.status.en;

        return {
          ...unit,
          status: {
            ...unit.status,
            en,
            moved: false,
            attacked: false,
          },
        };
      });

      const nextPlayerId = nextPlayer(state.activePlayerId, tutorialScenario.players).id;
      const nextPlayerUnits = resettedUnits.filter((u) => u.playerId === nextPlayerId);

      if (nextPlayerUnits.length === 0) {
        return {
          ...state,
          phase: { type: "finished", winner: state.activePlayerId },
          units: resettedUnits,
          history: [...state.history, action],
        };
      }

      const newTurnNumber = nextPlayerId === tutorialScenario.players[0].id
        ? state.turnNumber + 1
        : state.turnNumber;

      return {
        ...state,
        activePlayerId: nextPlayerId,
        units: resettedUnits,
        history: [...state.history, action],
        turnNumber: newTurnNumber,
      };
    }

    default:
      return state;
  }
};
