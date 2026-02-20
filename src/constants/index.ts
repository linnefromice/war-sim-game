import { Armament, UnitCategory } from "../types";

export const AI_PLAYER_ID = 2;

export const playerColor = (rgb: [number, number, number], alpha?: number): string => {
  if (alpha !== undefined) return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
};

const FIGHTER_ARMAMENTS: Armament[] = [
  {
    name: "Machine gun",
    value: 200,
    range: 2,
    consumed_en: 50,
  },
  {
    name: "Missile",
    value: 400,
    range: 3,
    consumed_en: 100,
  }
]
const ARMY_TANK_ARMAMENTS: Armament[] = [
  {
    name: "Machine gun",
    value: 200,
    range: 2,
    consumed_en: 75,
  },
  {
    name: "Cannon",
    value: 500,
    range: 4,
    consumed_en: 150,
  }
]
const BATTLE_SOLDIER_ARMAMENTS: Armament[] = [
  {
    name: "Assault rifle",
    value: 100,
    range: 2,
    consumed_en: 10,
  },
  {
    name: "Grenade launcher",
    value: 300,
    range: 2,
    consumed_en: 20,
  },
  {
    name: "Suicide drone",
    value: 500,
    range: 3,
    consumed_en: 75,
  },
]

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export const UNIT_ABILITIES: Record<UnitCategory, { name: string; description: string }> = {
  fighter: { name: "強襲", description: "移動後の攻撃でダメージ+20%" },
  tank: { name: "装甲陣地", description: "隣接味方ユニットの防御+10%" },
  soldier: { name: "迷彩", description: "森林地形での防御+20%" },
};

export const getAraments = (unitType: UnitCategory): Armament[] => {
  switch (unitType) {
    case "fighter":
      return FIGHTER_ARMAMENTS
    case "tank":
      return ARMY_TANK_ARMAMENTS
    case "soldier":
      return BATTLE_SOLDIER_ARMAMENTS
    default:
      return assertNever(unitType);
  }
}
