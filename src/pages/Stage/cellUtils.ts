import { Coordinate, TerrainType } from "../../types";

export const getTerrainClass = (terrain: TerrainType): string => {
  switch (terrain) {
    case "forest": return " cell-terrain-forest";
    case "mountain": return " cell-terrain-mountain";
    case "water": return " cell-terrain-water";
    default: return "";
  }
};

export { getReachableCells, isWithinMoveRange } from "../../game/movement";

/**
 * Attack range check using simple Manhattan distance.
 * Attacks fly over terrain, so no terrain cost is applied.
 */
export const isWithinRange = (src: Coordinate, dst: Coordinate, range: number): boolean => {
  const diffX = Math.abs(src.x - dst.x);
  const diffY = Math.abs(src.y - dst.y);
  return diffX + diffY <= range;
};
