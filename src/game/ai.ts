import { UnitType, Coordinate, PayloadMoveActionType, PayloadAttackActionType } from "../types";
import { tutorialScenario } from "../scenarios/tutorial";
import { getReachableCells } from "../pages/Stage/cellUtils";
import { getTerrainDefenseReduction } from "./gameReducer";

export type AIAction =
  | { type: "move"; unitId: number; payload: PayloadMoveActionType }
  | { type: "attack"; unitId: number; payload: PayloadAttackActionType }
  | { type: "turn_end" };

const manhattanDistance = (a: Coordinate, b: Coordinate): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export const computeAIActions = (units: UnitType[], aiPlayerId: number): AIAction[] => {
  const actions: AIAction[] = [];
  const aiUnits = units
    .filter(u => u.playerId === aiPlayerId)
    .sort((a, b) => a.spec.id - b.spec.id);

  // Track positions as we plan (to avoid moving two units to same cell)
  const occupiedCells = new Set(
    units.map(u => `${u.status.coordinate.x},${u.status.coordinate.y}`)
  );

  // Track simulated unit state changes (HP reductions from planned attacks, position changes)
  const simulatedPositions = new Map<number, Coordinate>(
    units.map(u => [u.spec.id, { ...u.status.coordinate }])
  );
  const simulatedHp = new Map<number, number>(
    units.map(u => [u.spec.id, u.status.hp])
  );
  const destroyedUnits = new Set<number>();

  for (const aiUnit of aiUnits) {
    // Skip if no alive enemies remain
    const aliveEnemyIds = units
      .filter(u => u.playerId !== aiPlayerId)
      .map(u => u.spec.id)
      .filter(id => !destroyedUnits.has(id));
    if (aliveEnemyIds.length === 0) break;

    let currentCoord = simulatedPositions.get(aiUnit.spec.id)!;
    const hasMoved = aiUnit.status.moved;
    const hasAttacked = aiUnit.status.attacked;

    // Step 1: Try to move closer to nearest enemy (if not already moved)
    if (!hasMoved) {
      // Find nearest alive enemy
      let nearestEnemyCoord: Coordinate | null = null;
      let nearestDist = Infinity;

      for (const enemyId of aliveEnemyIds) {
        const enemyCoord = simulatedPositions.get(enemyId)!;
        const dist = manhattanDistance(currentCoord, enemyCoord);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemyCoord = enemyCoord;
        }
      }

      if (nearestEnemyCoord) {
        const reachable = getReachableCells(currentCoord, aiUnit.spec.movement_range);

        // Find the reachable cell closest to the nearest enemy (that's not occupied by another unit)
        let bestCell: Coordinate | null = null;
        let bestDist = manhattanDistance(currentCoord, nearestEnemyCoord);

        for (const cellKey of reachable) {
          const [cx, cy] = cellKey.split(",").map(Number);
          // Skip cells occupied by any unit (except the current unit's own cell)
          if (
            occupiedCells.has(cellKey) &&
            cellKey !== `${currentCoord.x},${currentCoord.y}`
          ) {
            continue;
          }

          const dist = manhattanDistance({ x: cx, y: cy }, nearestEnemyCoord);
          if (dist < bestDist) {
            bestDist = dist;
            bestCell = { x: cx, y: cy };
          }
        }

        if (bestCell) {
          actions.push({
            type: "move",
            unitId: aiUnit.spec.id,
            payload: { x: bestCell.x, y: bestCell.y },
          });
          // Update tracking
          occupiedCells.delete(`${currentCoord.x},${currentCoord.y}`);
          occupiedCells.add(`${bestCell.x},${bestCell.y}`);
          simulatedPositions.set(aiUnit.spec.id, bestCell);
          currentCoord = bestCell;
        }
      }
    }

    // Step 2: Try to attack (if not already attacked)
    if (!hasAttacked) {
      // Find best weapon + target combination
      let bestAttack: { targetId: number; armamentIdx: number; damage: number } | null = null;

      for (const enemyId of aliveEnemyIds) {
        const enemyCoord = simulatedPositions.get(enemyId)!;
        const dist = manhattanDistance(currentCoord, enemyCoord);

        for (let armIdx = 0; armIdx < aiUnit.spec.armaments.length; armIdx++) {
          const weapon = aiUnit.spec.armaments[armIdx];
          if (dist > weapon.range) continue;
          if (weapon.consumed_en > aiUnit.status.en) continue;

          // Calculate actual damage with terrain defense
          const targetTerrain =
            tutorialScenario.terrain[enemyCoord.y][enemyCoord.x];
          const defenseReduction = getTerrainDefenseReduction(targetTerrain);
          const actualDamage = Math.floor(weapon.value * (1 - defenseReduction));

          if (!bestAttack || actualDamage > bestAttack.damage) {
            bestAttack = {
              targetId: enemyId,
              armamentIdx: armIdx,
              damage: actualDamage,
            };
          }
        }
      }

      if (bestAttack) {
        actions.push({
          type: "attack",
          unitId: aiUnit.spec.id,
          payload: {
            target_unit_id: bestAttack.targetId,
            armament_idx: bestAttack.armamentIdx,
          },
        });

        // Update simulated HP
        const currentHp = simulatedHp.get(bestAttack.targetId)!;
        const newHp = currentHp - bestAttack.damage;
        simulatedHp.set(bestAttack.targetId, newHp);
        if (newHp <= 0) {
          destroyedUnits.add(bestAttack.targetId);
          // Also free up the occupied cell
          const destroyedCoord = simulatedPositions.get(bestAttack.targetId)!;
          occupiedCells.delete(`${destroyedCoord.x},${destroyedCoord.y}`);
        }
      }
    }
  }

  actions.push({ type: "turn_end" });
  return actions;
};
