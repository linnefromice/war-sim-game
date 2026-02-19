import { UnitType, Coordinate, PayloadMoveActionType, PayloadAttackActionType } from "../types";
import { tutorialScenario } from "../scenarios/tutorial";
import { getReachableCells } from "../pages/Stage/cellUtils";
import { calculateDamage } from "./gameReducer";
import { manhattanDistance } from "./utils";

export type AIDifficulty = "easy" | "normal" | "hard";

export type AIAction =
  | { type: "move"; unitId: number; payload: PayloadMoveActionType }
  | { type: "attack"; unitId: number; payload: PayloadAttackActionType }
  | { type: "turn_end" };

export const computeAIActions = (units: UnitType[], aiPlayerId: number, difficulty: AIDifficulty = "easy"): AIAction[] => {
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

  // Hard: Track how many AI units have targeted each enemy (focus fire)
  const targetAttackCount = new Map<number, number>();

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

    // Hard: Retreat logic — if HP < 30%, move AWAY from nearest enemy
    const shouldRetreat = difficulty === "hard" && aiUnit.status.hp < aiUnit.spec.max_hp * 0.3;

    // Step 1: Try to move (if not already moved)
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

        let bestCell: Coordinate | null = null;
        let bestDist = shouldRetreat ? -Infinity : manhattanDistance(currentCoord, nearestEnemyCoord);
        let bestTerrainScore = 0;

        for (const cellKey of reachable) {
          const [cx, cy] = cellKey.split(",").map(Number);
          if (
            occupiedCells.has(cellKey) &&
            cellKey !== `${currentCoord.x},${currentCoord.y}`
          ) {
            continue;
          }

          const dist = manhattanDistance({ x: cx, y: cy }, nearestEnemyCoord);

          if (shouldRetreat) {
            // Move AWAY from nearest enemy (maximize distance)
            if (dist > bestDist) {
              bestDist = dist;
              bestCell = { x: cx, y: cy };
            }
          } else {
            // Hard: prefer terrain (forest/mountain) when equidistant
            const terrainScore = difficulty === "hard" ? getTerrainMovementScore(cx, cy) : 0;

            if (dist < bestDist || (dist === bestDist && terrainScore > bestTerrainScore)) {
              bestDist = dist;
              bestTerrainScore = terrainScore;
              bestCell = { x: cx, y: cy };
            }
          }
        }

        if (bestCell) {
          actions.push({
            type: "move",
            unitId: aiUnit.spec.id,
            payload: { x: bestCell.x, y: bestCell.y },
          });
          occupiedCells.delete(`${currentCoord.x},${currentCoord.y}`);
          occupiedCells.add(`${bestCell.x},${bestCell.y}`);
          simulatedPositions.set(aiUnit.spec.id, bestCell);
          currentCoord = bestCell;
        }
      }
    }

    // Step 2: Try to attack (if not already attacked)
    if (!hasAttacked) {
      let bestAttack: { targetId: number; armamentIdx: number; damage: number; score: number } | null = null;

      for (const enemyId of aliveEnemyIds) {
        const enemyCoord = simulatedPositions.get(enemyId)!;
        const dist = manhattanDistance(currentCoord, enemyCoord);

        for (let armIdx = 0; armIdx < aiUnit.spec.armaments.length; armIdx++) {
          const weapon = aiUnit.spec.armaments[armIdx];
          if (dist > weapon.range) continue;
          if (weapon.consumed_en > aiUnit.status.en) continue;

          const targetTerrain =
            tutorialScenario.terrain[enemyCoord.y][enemyCoord.x];
          const enemy = units.find(u => u.spec.id === enemyId)!;
          const simulatedAttacker = hasMoved ? aiUnit : { ...aiUnit, status: { ...aiUnit.status, moved: true } };
          const { damage: actualDamage } = calculateDamage(simulatedAttacker, enemy, weapon, targetTerrain, units);

          // Score the attack based on difficulty
          const enemyCurrentHp = simulatedHp.get(enemyId) ?? enemy.status.hp;
          const score = scoreAttack(difficulty, actualDamage, enemyCurrentHp, enemy.spec.max_hp, enemyId, targetAttackCount);

          if (!bestAttack || score > bestAttack.score) {
            bestAttack = {
              targetId: enemyId,
              armamentIdx: armIdx,
              damage: actualDamage,
              score,
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

        // Track target for focus fire
        targetAttackCount.set(bestAttack.targetId, (targetAttackCount.get(bestAttack.targetId) ?? 0) + 1);

        const currentHp = simulatedHp.get(bestAttack.targetId)!;
        const newHp = currentHp - bestAttack.damage;
        simulatedHp.set(bestAttack.targetId, newHp);
        if (newHp <= 0) {
          destroyedUnits.add(bestAttack.targetId);
          const destroyedCoord = simulatedPositions.get(bestAttack.targetId)!;
          occupiedCells.delete(`${destroyedCoord.x},${destroyedCoord.y}`);
        }
      }
    }
  }

  actions.push({ type: "turn_end" });
  return actions;
};

const getTerrainMovementScore = (x: number, y: number): number => {
  const terrain = tutorialScenario.terrain[y]?.[x];
  if (terrain === "forest") return 2;
  if (terrain === "mountain") return 3;
  return 0;
};

const scoreAttack = (
  difficulty: AIDifficulty,
  damage: number,
  enemyCurrentHp: number,
  enemyMaxHp: number,
  enemyId: number,
  targetAttackCount: Map<number, number>,
): number => {
  if (difficulty === "easy") {
    // Easy: just maximize raw damage
    return damage;
  }

  // Normal & Hard: prioritize killable targets
  const canKill = enemyCurrentHp <= damage;
  let score = damage;

  if (canKill) {
    score += 10000; // Huge bonus for kills
  } else {
    // Prefer wounded enemies (lower HP ratio = higher priority)
    const hpRatio = enemyCurrentHp / enemyMaxHp;
    score += (1 - hpRatio) * 1000;
  }

  if (difficulty === "hard") {
    // Focus fire: bonus for attacking targets others have already attacked
    const attackCount = targetAttackCount.get(enemyId) ?? 0;
    score += attackCount * 500;
  }

  return score;
};
