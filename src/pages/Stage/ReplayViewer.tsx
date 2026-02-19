import { useEffect, useRef, useState } from "react";
import "./ReplayViewer.scss";
import { GameAction, GameState } from "../../game/types";
import { gameReducer, loadUnit } from "../../game/gameReducer";
import { UnitType } from "../../types";
import { useScenario } from "../../contexts/ScenarioContext";

const formatAction = (action: GameAction, units: UnitType[]): string => {
  switch (action.type) {
    case "DO_MOVE": {
      const unit = loadUnit(action.unitId, units);
      return `${unit.spec.name} が (${action.payload.x},${action.payload.y}) に移動`;
    }
    case "DO_ATTACK": {
      const unit = loadUnit(action.unitId, units);
      const target = loadUnit(action.payload.target_unit_id, units);
      const weapon = unit.spec.armaments[action.payload.armament_idx];
      return `${unit.spec.name} が ${target.spec.name} に ${weapon.name} で攻撃`;
    }
    case "TURN_END":
      return "ターン終了";
    case "UNDO_MOVE": {
      const unit = loadUnit(action.unitId, units);
      return `${unit.spec.name} の移動を取消`;
    }
    case "LOAD_STATE":
      return "";
  }
};

const getItemClassName = (index: number, currentStep: number): string => {
  const base = "replay-item";
  if (index === currentStep) return `${base} ${base}--active`;
  if (currentStep >= 0 && index < currentStep) return `${base} ${base}--past`;
  if (currentStep >= 0 && index > currentStep) return `${base} ${base}--future`;
  return base;
};

export const ReplayViewer = ({
  history,
  initialUnits,
  onClose,
}: {
  history: GameAction[];
  initialUnits: UnitType[];
  onClose: () => void;
}) => {
  const scenario = useScenario();
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Build state snapshots for formatting
  const states: GameState[] = [];
  let currentState: GameState = {
    activePlayerId: 1,
    units: initialUnits,
    phase: { type: "playing" },
    history: [],
    turnNumber: 1,
  };
  states.push(currentState);
  for (const action of history) {
    currentState = gameReducer(currentState, action);
    states.push(currentState);
  }

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= history.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, history.length]);

  useEffect(() => {
    // Auto-scroll
    if (listRef.current && currentStep >= 0) {
      const el = listRef.current.children[currentStep] as HTMLElement;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStep]);

  const handlePlay = () => {
    if (currentStep >= history.length - 1) setCurrentStep(-1);
    setIsPlaying(true);
    if (currentStep < 0) setCurrentStep(0);
  };

  return (
    <div className="replay-overlay">
      <div className="replay-panel">
        <div className="replay-header">
          <h3 className="replay-header-title">リプレイ</h3>
          <span className="replay-header-counter">
            {currentStep >= 0
              ? `${currentStep + 1}/${history.length}`
              : `0/${history.length}`}
          </span>
        </div>
        <div ref={listRef} className="replay-list">
          {history.map((action, i) => {
            const state = states[i]; // state BEFORE this action
            const activePlayer = scenario.players.find(
              (p) => p.id === state.activePlayerId
            );
            return (
              <div key={i} className={getItemClassName(i, currentStep)}>
                <span
                  className="replay-item-player"
                  style={{
                    color: activePlayer
                      ? `rgb(${activePlayer.rgb[0]},${activePlayer.rgb[1]},${activePlayer.rgb[2]})`
                      : undefined,
                  }}
                >
                  {activePlayer?.name}
                </span>
                {formatAction(action, state.units)}
              </div>
            );
          })}
        </div>
        <div className="replay-controls">
          <button
            className="replay-btn replay-btn--play"
            onClick={handlePlay}
            disabled={isPlaying}
          >
            再生
          </button>
          <button
            className="replay-btn replay-btn--stop"
            onClick={() => setIsPlaying(false)}
            disabled={!isPlaying}
          >
            停止
          </button>
          <button
            className="replay-btn replay-btn--close"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
