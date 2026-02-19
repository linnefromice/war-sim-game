import { Coordinate } from "../types";

export const manhattanDistance = (a: Coordinate, b: Coordinate): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
