import { useContext, useEffect, useState } from "react";
import { ActionContext } from ".";
import { loadUnit } from "../../game/gameReducer";
import { UnitIcon } from "./UnitIcon";
import { Coordinate, UnitCategory } from "../../types";

// Cell layout constants (must match Stage.scss)
const CELL_SIZE = 64;
const CELL_BORDER = 1;
const CELL_MARGIN = 1;
const STAGE_MARGIN = 4;
const CELL_INTERVAL = CELL_SIZE + 2 * CELL_BORDER + 2 * CELL_MARGIN; // 68px
const GRID_OFFSET = STAGE_MARGIN + CELL_MARGIN; // 5px

export const MOVE_DURATION = 300;
export const ATTACK_DURATION = 600;

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
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: cellVisualSize,
        height: cellVisualSize,
        transition: `left ${MOVE_DURATION}ms ease-in-out, top ${MOVE_DURATION}ms ease-in-out`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        zIndex: 10,
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
        className="attack-flash"
        style={{
          position: "absolute",
          left: pos.left,
          top: pos.top,
          width: cellVisualSize,
          height: cellVisualSize,
          borderRadius: 8,
          backgroundColor: "rgba(255, 0, 0, 0.6)",
          zIndex: 10,
        }}
      />
      <div
        className="damage-float"
        style={{
          position: "absolute",
          left: pos.left + cellVisualSize / 2,
          top: pos.top,
          color: "red",
          fontWeight: "bold",
          fontSize: "1.25rem",
          zIndex: 11,
          pointerEvents: "none",
        }}
      >
        {`-${damage}`}
      </div>
    </>
  );
};

export const AnimationLayer = () => {
  const { uiState, dispatch, gameState } = useContext(ActionContext);
  const { animationState } = uiState;

  useEffect(() => {
    if (animationState.type === "idle") return;

    const duration = animationState.type === "move" ? MOVE_DURATION : ATTACK_DURATION;
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
      <div className="animation-layer" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <MoveAnimation unitType={unit.spec.unit_type} from={animationState.from} to={animationState.to} />
      </div>
    );
  }

  if (animationState.type === "attack") {
    const target = loadUnit(animationState.targetId, gameState.units);
    return (
      <div className="animation-layer" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <AttackAnimation coord={target.status.coordinate} damage={animationState.damage} />
      </div>
    );
  }

  return null;
};
