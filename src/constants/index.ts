import { Armament, Coordinate, Player, UnitCategory, UnitType } from "../types";

export const ROW_NUM = 10;
export const CELL_NUM_IN_ROW = 13;

const coordinates = (coordinate: Coordinate) => ({
  coordinate,
  previousCoordinate: coordinate,
  initialCoordinate: coordinate,
});
const initialStatus = (hp: number, en: number, coordinate: Coordinate) => (
  {
    hp,
    en,
    ...coordinates(coordinate),
    moved: false,
    attacked: false,
  }
);

export const PLAYERS: Player[] = [
  {
    id: 1,
    name: "Hero",
    rgb: [0, 0, 255] // blue
  },
  {
    id: 2,
    name: "Villan",
    rgb: [255, 0, 0] // red
  },
]

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

const getAraments = (unitType: UnitCategory): Armament[] => {
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

export const INITIAL_UNITS: UnitType[] = [
  {
    spec: {
      id: 1,
      name: "VF-25F",
      unit_type: "fighter",
      movement_range: 3,
      max_hp: 1000,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(1000, 200, { x: 5, y: 2 }),
    playerId: 2,
  },
  {
    spec: {
      id: 2,
      name: "VF-25G",
      unit_type: "fighter",
      movement_range: 2,
      max_hp: 1000,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(1000, 200, { x: 7, y: 2 }),
    playerId: 2,
  },
  {
    spec: {
      id: 3,
      name: "VF-25S",
      unit_type: "fighter",
      movement_range: 4,
      max_hp: 1000,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(1000, 200, { x: 6, y: 1 }),
    playerId: 2,
  },
  {
    spec: {
      id: 4,
      name: "TANK-1",
      unit_type: "tank",
      movement_range: 2,
      max_hp: 2000,
      max_en: 400,
      armaments: getAraments("tank"),
    },
    status: initialStatus(2000, 400, { x: 3, y: 3 }),
    playerId: 2,
  },
  {
    spec: {
      id: 5,
      name: "TANK-2",
      unit_type: "tank",
      movement_range: 2,
      max_hp: 2000,
      max_en: 400,
      armaments: getAraments("tank"),
    },
    status: initialStatus(2000, 400, { x: 9, y: 3 }),
    playerId: 2,
  },
  {
    spec: {
      id: 6,
      name: "SOLDIER-1",
      unit_type: "soldier",
      movement_range: 1,
      max_hp: 200,
      max_en: 100,
      armaments: getAraments("soldier"),
    },
    status: initialStatus(200, 100, { x: 2, y: 4 }),
    playerId: 2,
  },
  {
    spec: {
      id: 7,
      name: "SOLDIER-2",
      unit_type: "soldier",
      movement_range: 1,
      max_hp: 200,
      max_en: 100,
      armaments: getAraments("soldier"),
    },
    status: initialStatus(200, 100, { x: 4, y: 4 }),
    playerId: 2,
  },
  {
    spec: {
      id: 8,
      name: "SOLDIER-3",
      unit_type: "soldier",
      movement_range: 1,
      max_hp: 200,
      max_en: 100,
      armaments: getAraments("soldier"),
    },
    status: initialStatus(200, 100, { x: 8, y: 4 }),
    playerId: 2,
  },
  {
    spec: {
      id: 9,
      name: "SOLDIER-4",
      unit_type: "soldier",
      movement_range: 1,
      max_hp: 200,
      max_en: 100,
      armaments: getAraments("soldier"),
    },
    status: initialStatus(200, 100, { x: 10, y: 4 }),
    playerId: 2,
  },
  {
    spec: {
      id: 10,
      name: "VF-171",
      unit_type: "fighter",
      movement_range: 3,
      max_hp: 800,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(800, 200, { x: 3, y: 8 }),
    playerId: 1,
  },
  {
    spec: {
      id: 11,
      name: "VF-171",
      unit_type: "fighter",
      movement_range: 2,
      max_hp: 800,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(800, 200, { x: 5, y: 8 }),
    playerId: 1,
  },
  {
    spec: {
      id: 12,
      name: "VF-171",
      unit_type: "fighter",
      movement_range: 4,
      max_hp: 800,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(800, 200, { x: 7, y: 8 }),
    playerId: 1,
  },
  {
    spec: {
      id: 13,
      name: "VF-171",
      unit_type: "fighter",
      movement_range: 4,
      max_hp: 800,
      max_en: 200,
      armaments: getAraments("fighter"),
    },
    status: initialStatus(800, 200, { x: 9, y: 8 }),
    playerId: 1,
  },
];
