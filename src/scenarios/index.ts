import { getAraments } from "../constants";
import { Coordinate, TerrainType, UnitCategory, UnitType } from "../types";
import { Scenario } from "../types/scenario";
import { tutorialScenario } from "./tutorial";

const makeUnit = (id: number, playerId: number, category: UnitCategory, coordinate: Coordinate): UnitType => {
  const stats = {
    soldier: { max_hp: 200, max_en: 100, movement_range: 1 },
    fighter: { max_hp: 1000, max_en: 200, movement_range: 3 },
    tank: { max_hp: 2000, max_en: 400, movement_range: 2 },
  }[category];
  return {
    spec: { id, name: `P${playerId}-${category}`, unit_type: category, ...stats, armaments: getAraments(category) },
    status: { hp: stats.max_hp, en: stats.max_en, coordinate, previousCoordinate: { ...coordinate }, initialCoordinate: { ...coordinate }, moved: false, attacked: false },
    playerId,
  };
};

const terrain = (rows: number, cols: number): TerrainType[][] =>
  Array.from({ length: rows }, () => Array<TerrainType>(cols).fill("plain"));
const players: Scenario["players"] = [
  { id: 1, name: "Player 1", rgb: [80, 170, 255] },
  { id: 2, name: "Player 2", rgb: [255, 110, 110] },
];
const crossroadsTerrain = terrain(5, 7);
for (const [x, y] of [[2, 1], [4, 3], [3, 2]]) crossroadsTerrain[y][x] = "forest";
for (const x of [0, 6]) crossroadsTerrain[2][x] = "mountain";

export const shortScenarios: Scenario[] = [
  {
    id: "first-contact", name: "はじめの射程",
    description: "歩兵1対1。1マスずつ近づき、武器の射程とENを確かめよう。",
    gridSize: { rows: 4, cols: 5 }, players, terrain: terrain(4, 5),
    units: [makeUnit(1, 1, "soldier", { x: 0, y: 3 }), makeUnit(2, 2, "soldier", { x: 4, y: 0 })],
  },
  {
    id: "combined-arms", name: "混成小隊",
    description: "戦闘機と歩兵が各1機。移動後の強襲と、武器ごとの射程を使い分けよう。",
    gridSize: { rows: 5, cols: 6 }, players, terrain: terrain(5, 6),
    units: [makeUnit(1, 1, "fighter", { x: 0, y: 4 }), makeUnit(2, 1, "soldier", { x: 1, y: 4 }), makeUnit(3, 2, "fighter", { x: 5, y: 0 }), makeUnit(4, 2, "soldier", { x: 4, y: 0 })],
  },
  {
    id: "crossroads", name: "森の交差点",
    description: "戦車と歩兵が各1機。森林の防御、移動コスト、隣接する戦車の支援を読もう。",
    gridSize: { rows: 5, cols: 7 }, players, terrain: crossroadsTerrain,
    units: [makeUnit(1, 1, "tank", { x: 1, y: 4 }), makeUnit(2, 1, "soldier", { x: 2, y: 4 }), makeUnit(3, 2, "tank", { x: 5, y: 0 }), makeUnit(4, 2, "soldier", { x: 4, y: 0 })],
  },
];

export const scenarios = [tutorialScenario, ...shortScenarios];
export const findScenario = (id: string): Scenario | undefined => scenarios.find(s => s.id === id);
