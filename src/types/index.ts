const ACTION_OPTIONS = ["MOVE", "ATTACK"] as const
export type ActionOptionType = typeof ACTION_OPTIONS[number]

const ORIENTATIONS = ["UP", "DOWN", "LEFT", "RIGHT"] as const
export type OrientationType = typeof ORIENTATIONS[number]

export type DispatchAction =
  | { type: "OPEN_MENU"; unitId: number }
  | { type: "CLOSE_MENU" }
  | { type: "SELECT_MOVE"; unitId: number }
  | { type: "SELECT_ATTACK"; unitId: number; attack: PayloadAttackActionType }
  | { type: "DO_MOVE"; unitId: number; move: PayloadMoveActionType }
  | { type: "DO_ATTACK"; unitId: number; attack: PayloadAttackActionType }
  | { type: "UNDO_MOVE"; unitId: number }
  | { type: "ANIMATION_COMPLETE" }
  | { type: "TURN_END" }

export type UnitCategory = "fighter" | "tank" | "soldier"

export type TerrainType = "plain" | "forest" | "mountain" | "water"

// State
export type UnitType = { spec: UnitSpecType, status: UnitStatusType, playerId: number }

export type AnimationState =
  | { type: "idle" }
  | { type: "move"; unitId: number; from: Coordinate; to: Coordinate }
  | { type: "attack"; targetId: number; damage: number; destroyed: boolean }
  | { type: "turn_change"; nextPlayerId: number }

export type StateActionMenuType = {
  isOpen: boolean
  targetUnitId: number | null
  activeActionOption: ActionOptionType | null
  selectedArmamentIdx: number | null // temp: only for SELECT_ATTACK
  animationState: AnimationState
  inspectedUnitId: number | null
  cursorPosition: Coordinate | null
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
  unit_type: UnitCategory;
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

