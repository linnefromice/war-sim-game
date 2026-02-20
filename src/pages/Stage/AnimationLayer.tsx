import { useContext, useEffect, useState } from "react";
import { ActionContext } from ".";
import { getPlayer, loadUnit } from "../../game/gameReducer";
import { useScenario } from "../../contexts/ScenarioContext";
import { UnitIcon } from "./UnitIcon";
import { Coordinate, UnitCategory } from "../../types";
import { CELL_SIZE, CELL_BORDER, CELL_INTERVAL, GRID_OFFSET } from "./layoutConstants";
import { playerColor } from "../../constants";

export const MOVE_DURATION = 300;
export const ATTACK_DURATION = 600;
export const TURN_CHANGE_DURATION = 1200;

const cellPosition = (coord: Coordinate) => ({
  left: GRID_OFFSET + coord.x * CELL_INTERVAL,
  top: GRID_OFFSET + coord.y * CELL_INTERVAL,
});

const MoveAnimation = ({ unitType, from, to }: { unitType: UnitCategory; from: Coordinate; to: Coordinate }) => {
  const [position, setPosition] = useState(from);

  useEffect(() => {
    // Trigger transition on next frame so browser paints the initial position first
    const id = requestAnimationFrame(() => {
      setPosition(to);
    });
    return () => cancelAnimationFrame(id);
  }, [to]);

  const pos = cellPosition(position);
  const cellVisualSize = CELL_SIZE + 2 * CELL_BORDER;

  return (
    <div
      className="move-animation-marker"
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: cellVisualSize,
        height: cellVisualSize,
        transition: `left ${MOVE_DURATION}ms ease-in-out, top ${MOVE_DURATION}ms ease-in-out`,
      }}
    >
      <UnitIcon unitType={unitType} className="" />
    </div>
  );
};

const AttackAnimation = ({ coord, damage }: { coord: Coordinate; damage: number }) => {
  const pos = cellPosition(coord);
  const cellVisualSize = CELL_SIZE + 2 * CELL_BORDER;

  return (
    <>
      <div
        className="attack-flash attack-animation-marker"
        style={{
          position: "absolute",
          left: pos.left,
          top: pos.top,
          width: cellVisualSize,
          height: cellVisualSize,
        }}
      />
      <div
        className="damage-float damage-float-text"
        style={{
          position: "absolute",
          left: pos.left + cellVisualSize / 2,
          top: pos.top,
        }}
      >
        {`-${damage}`}
      </div>
    </>
  );
};

const TurnChangeAnimation = ({ nextPlayerId }: { nextPlayerId: number }) => {
  const scenario = useScenario();
  const player = getPlayer(nextPlayerId, scenario.players);
  return (
    <div className="turn-change-overlay">
      <div className="turn-change-banner" style={{
        color: playerColor(player.rgb),
      }}>
        <div className="turn-change-label">TURN</div>
        <div className="turn-change-name">{player.name}</div>
      </div>
    </div>
  );
};

export const AnimationLayer = () => {
  const { uiState, dispatch, gameState } = useContext(ActionContext);
  const { animationState } = uiState;

  useEffect(() => {
    if (animationState.type === "idle") return;

    const duration = animationState.type === "move" ? MOVE_DURATION
      : animationState.type === "attack" ? ATTACK_DURATION
      : TURN_CHANGE_DURATION;
    const reducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const actualDuration = reducedMotion ? 0 : duration;

    const timer = setTimeout(() => {
      dispatch({ type: "ANIMATION_COMPLETE" });
    }, actualDuration);

    return () => clearTimeout(timer);
  }, [animationState, dispatch]);

  if (animationState.type === "idle") return null;

  if (animationState.type === "move") {
    const unit = loadUnit(animationState.unitId, gameState.units);
    return (
      <div className="animation-layer">
        <MoveAnimation unitType={unit.spec.unit_type} from={animationState.from} to={animationState.to} />
      </div>
    );
  }

  if (animationState.type === "attack") {
    const target = loadUnit(animationState.targetId, gameState.units);
    return (
      <div className="animation-layer">
        <AttackAnimation coord={target.status.coordinate} damage={animationState.damage} />
      </div>
    );
  }

  if (animationState.type === "turn_change") {
    return (
      <div className="animation-layer">
        <TurnChangeAnimation nextPlayerId={animationState.nextPlayerId} />
      </div>
    );
  }

  return null;
};
