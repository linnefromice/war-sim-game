import { Player, UnitType } from "./index";

export type Scenario = {
  id: string;
  name: string;
  gridSize: { rows: number; cols: number };
  players: Player[];
  units: UnitType[];
};
