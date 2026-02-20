import { Coordinate, TerrainType } from "../../types";
import { tutorialScenario } from "../../scenarios/tutorial";

export const getTerrainClass = (terrain: TerrainType): string => {
  switch (terrain) {
    case "forest": return " cell-terrain-forest";
    case "mountain": return " cell-terrain-mountain";
    case "water": return " cell-terrain-water";
    default: return "";
  }
};

const getTerrainMovementCost = (terrain: TerrainType): number => {
  switch (terrain) {
    case "plain": return 1;
    case "forest": return 2;
    case "mountain": return 3;
    case "water": return Infinity;
  }
};

/**
 * BFS-based reachable cell computation accounting for terrain movement costs.
 * Returns a set of "x,y" strings representing cells reachable from `from` within `range`.
 * The starting cell is excluded from the result.
 */
export const getReachableCells = (from: Coordinate, range: number): Set<string> => {
  const reachable = new Set<string>();
  const visited = new Map<string, number>(); // key -> min cost to reach
  const queue: Array<{ coord: Coordinate; cost: number }> = [{ coord: from, cost: 0 }];
  visited.set(`${from.x},${from.y}`, 0);

  const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

  while (queue.length > 0) {
    const { coord, cost } = queue.shift()!;

    if (cost > 0) reachable.add(`${coord.x},${coord.y}`);

    for (const { dx, dy } of directions) {
      const nx = coord.x + dx;
      const ny = coord.y + dy;
      if (nx < 0 || nx >= tutorialScenario.gridSize.cols || ny < 0 || ny >= tutorialScenario.gridSize.rows) continue;

      const terrainCost = getTerrainMovementCost(tutorialScenario.terrain[ny][nx]);
      const newCost = cost + terrainCost;
      const nKey = `${nx},${ny}`;

      if (newCost <= range && (!visited.has(nKey) || visited.get(nKey)! > newCost)) {
        visited.set(nKey, newCost);
        queue.push({ coord: { x: nx, y: ny }, cost: newCost });
      }
    }
  }
  return reachable;
};

/**
 * Movement range check using BFS with terrain costs.
 * Accounts for forests (cost 2), mountains (cost 3), and water (impassable).
 */
export const isWithinMoveRange = (from: Coordinate, to: Coordinate, range: number): boolean => {
  const reachable = getReachableCells(from, range);
  return reachable.has(`${to.x},${to.y}`);
};

/**
 * Attack range check using simple Manhattan distance.
 * Attacks fly over terrain, so no terrain cost is applied.
 */
export const isWithinRange = (src: Coordinate, dst: Coordinate, range: number): boolean => {
  const diffX = Math.abs(src.x - dst.x);
  const diffY = Math.abs(src.y - dst.y);
  return diffX + diffY <= range;
};
