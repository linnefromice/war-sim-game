import { UnitType, PayloadMoveActionType, PayloadAttackActionType } from "../types";

export type GamePhase =
  | { type: "playing" }
  | { type: "finished"; winner: number }

export type GameState = {
  activePlayerId: number;
  units: UnitType[];
  phase: GamePhase;
}

export type GameAction =
  | { type: "DO_MOVE"; unitId: number; payload: PayloadMoveActionType }
  | { type: "DO_ATTACK"; unitId: number; payload: PayloadAttackActionType }
  | { type: "TURN_END" }
