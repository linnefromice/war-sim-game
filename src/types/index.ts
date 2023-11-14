const ACTION_OPTIONS = ["MOVE", "ATTACK"] as const
export type ActionOptionType = typeof ACTION_OPTIONS[number]

const ORIENTATIONS = ["UP", "DOWN", "LEFT", "RIGHT"] as const
export type OrientationType = typeof ORIENTATIONS[number]

const ACTIONS = ["OPEN_MENU", "CLOSE_MENU", "TURN_END", "SELECT_MOVE", "SELECT_ATTACK", "DO_MOVE", "DO_ATTACK"] as const
export type ActionType = typeof ACTIONS[number];

// State
export type UnitType = { spec: UnitSpecType, status: UnitStatusType, playerId: number }

export type StateType = {
  activePlayerId: number
  actionMenu: StateActionMenuType
  units: UnitType[]
}
export type StateActionMenuType = {
  isOpen: boolean
  targetUnitId: number | null
  activeActionOption: ActionOptionType | null
  selectedArmamentIdx: number | null // temp: only for SELECT_ATTACK
}

export type PayloadType = {
  running_unit_id?: number,
  action?: PayloadMoveActionType | PayloadAttackActionType
}
export type PayloadMoveActionType = {
  x: number,
  y: number,
}
export type PayloadAttackActionType = {
  target_unit_id: number,
  armament_idx: number,
}

// Player Model
export type Player = {
  id: number;
  name: string;
  rgb: [number, number, number];
}

// Unit Model
export type UnitSpecType = {
  id: number;
  name: string;
  // 1: fighterjet, 2: tank, 3: soldier
  unit_type: number;
  movement_range: number;
  max_hp: number;
  max_en: number;
  armaments: Armament[];
}

export type Armament = {
  name: string;
  value: number;
  range: number;
  consumed_en: number;
}

export type Coordinate = {
  x: number;
  y: number;
}

export type UnitStatusType = {
  hp: number;
  en: number;
  coordinate: Coordinate;
  previousCoordinate: Coordinate;
  initialCoordinate: Coordinate;
  moved: boolean;
  attacked: boolean;
}

