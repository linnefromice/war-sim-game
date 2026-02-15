import { Armament, UnitCategory } from "../types";

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

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

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
