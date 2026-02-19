import { UnitType, UnitCategory, PayloadAttackActionType } from "../types";
import { Scenario } from "../types/scenario";
import { GameAction } from "./types";
import { calculateDamage } from "./gameReducer";

export type UnitStatEntry = {
  name: string;
  unitType: UnitCategory;
  playerId: number;
  damageDealt: number;
  kills: number;
  damageTaken: number;
  alive: boolean;
};

export type PlayerStatEntry = {
  playerId: number;
  totalDamage: number;
  totalKills: number;
  unitsLost: number;
  unitsRemaining: number;
};

export type BattleStatistics = {
  turnCount: number;
  perUnit: Map<number, UnitStatEntry>;
  mvpUnitId: number | null;
  perPlayer: PlayerStatEntry[];
};

export const computeStatistics = (
  history: GameAction[],
  initialUnits: UnitType[],
  scenario: Scenario,
): BattleStatistics => {
  // Initialize per-unit tracking with deep-cloned shadow state
  const perUnit = new Map<number, UnitStatEntry>();
  const shadowUnits = new Map<number, UnitType>();

  for (const unit of initialUnits) {
    perUnit.set(unit.spec.id, {
      name: unit.spec.name,
      unitType: unit.spec.unit_type,
      playerId: unit.playerId,
      damageDealt: 0,
      kills: 0,
      damageTaken: 0,
      alive: true,
    });
    shadowUnits.set(unit.spec.id, {
      ...unit,
      status: { ...unit.status },
    });
  }

  let turnCount = 1;

  for (const action of history) {
    if (action.type === "TURN_END") {
      // Reset moved/attacked for all units on turn end
      for (const [id, su] of shadowUnits) {
        shadowUnits.set(id, {
          ...su,
          status: { ...su.status, moved: false, attacked: false },
        });
      }
      // Increment turn count every 2 TURN_ENDs (both players ended)
      // Actually turnCount tracks total game turns (each player's turn = separate)
      turnCount++;
      continue;
    }

    if (action.type === "DO_MOVE") {
      const su = shadowUnits.get(action.unitId);
      if (su) {
        shadowUnits.set(action.unitId, {
          ...su,
          status: {
            ...su.status,
            coordinate: { x: action.payload.x, y: action.payload.y },
            moved: true,
          },
        });
      }
      continue;
    }

    if (action.type === "DO_ATTACK") {
      const payload = action.payload as PayloadAttackActionType;
      const attacker = shadowUnits.get(action.unitId);
      const defender = shadowUnits.get(payload.target_unit_id);
      if (!attacker || !defender) continue;

      const attackerEntry = perUnit.get(action.unitId);
      const defenderEntry = perUnit.get(payload.target_unit_id);
      if (!attackerEntry || !defenderEntry) continue;

      const armament = attacker.spec.armaments[payload.armament_idx];
      const defCoord = defender.status.coordinate;
      const terrain = scenario.terrain[defCoord.y][defCoord.x];
      const allShadow = Array.from(shadowUnits.values());
      const { damage } = calculateDamage(attacker, defender, armament, terrain, allShadow);

      // Update stats
      attackerEntry.damageDealt += damage;
      defenderEntry.damageTaken += damage;

      // Update shadow HP
      const newHp = defender.status.hp - damage;
      shadowUnits.set(payload.target_unit_id, {
        ...defender,
        status: { ...defender.status, hp: newHp },
      });

      // Check for kill
      if (newHp <= 0) {
        attackerEntry.kills += 1;
        defenderEntry.alive = false;
        shadowUnits.delete(payload.target_unit_id);
      }

      // Mark attacker as attacked
      shadowUnits.set(action.unitId, {
        ...attacker,
        status: { ...attacker.status, attacked: true },
      });
    }
  }

  // Compute per-player stats
  const playerMap = new Map<number, PlayerStatEntry>();
  for (const player of scenario.players) {
    playerMap.set(player.id, {
      playerId: player.id,
      totalDamage: 0,
      totalKills: 0,
      unitsLost: 0,
      unitsRemaining: 0,
    });
  }

  for (const [, entry] of perUnit) {
    const ps = playerMap.get(entry.playerId);
    if (!ps) continue;
    ps.totalDamage += entry.damageDealt;
    ps.totalKills += entry.kills;
    if (!entry.alive) ps.unitsLost += 1;
    else ps.unitsRemaining += 1;
  }

  // MVP: unit with most damageDealt
  let mvpUnitId: number | null = null;
  let mvpDamage = 0;
  for (const [unitId, entry] of perUnit) {
    if (entry.damageDealt > mvpDamage) {
      mvpDamage = entry.damageDealt;
      mvpUnitId = unitId;
    }
  }

  // Convert turnCount: each pair of TURN_ENDs = 1 game turn
  const gameTurns = Math.ceil(turnCount / 2);

  return {
    turnCount: gameTurns,
    perUnit,
    mvpUnitId,
    perPlayer: Array.from(playerMap.values()),
  };
};
