import React from "react";
import { TerrainType } from "../../types";
import { useScenario } from "../../contexts/ScenarioContext";

const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: "平地",
  forest: "森林",
  mountain: "山岳",
  water: "水域",
};

const TERRAIN_DEFENSE: Record<TerrainType, string> = {
  plain: "0%",
  forest: "20%",
  mountain: "40%",
  water: "0%",
};

const TERRAIN_MOVE_COST: Record<TerrainType, string> = {
  plain: "1",
  forest: "2",
  mountain: "3",
  water: "\u221E",
};

export const TerrainTooltip = React.memo(({ x, y }: { x: number; y: number }) => {
  const scenario = useScenario();
  const terrain = scenario.terrain[y][x];

  return (
    <div className="terrain-tooltip">
      <div className="terrain-tooltip-name">{TERRAIN_LABELS[terrain]}</div>
      <div className="terrain-tooltip-stats">
        <span>DEF {TERRAIN_DEFENSE[terrain]}</span>
        <span>MOVE {TERRAIN_MOVE_COST[terrain]}</span>
      </div>
    </div>
  );
});

TerrainTooltip.displayName = "TerrainTooltip";
