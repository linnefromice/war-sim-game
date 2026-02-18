import { useEffect, useRef, useState } from "react";
import { GameAction, GameState } from "../../game/types";
import { gameReducer, loadUnit } from "../../game/gameReducer";
import { UnitType } from "../../types";
import { tutorialScenario } from "../../scenarios/tutorial";

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
  }
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1001,
      }}
    >
      <div
        style={{
          background: "rgba(20,20,35,0.95)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          color: "white",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.2rem" }}>リプレイ</h3>
          <span style={{ color: "gray", fontSize: "0.85rem" }}>
            {currentStep >= 0
              ? `${currentStep + 1}/${history.length}`
              : `0/${history.length}`}
          </span>
        </div>
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minHeight: 200,
          }}
        >
          {history.map((action, i) => {
            const state = states[i]; // state BEFORE this action
            const activePlayer = tutorialScenario.players.find(
              (p) => p.id === state.activePlayerId
            );
            return (
              <div
                key={i}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                  backgroundColor:
                    i === currentStep
                      ? "rgba(65,105,225,0.3)"
                      : i < currentStep
                        ? "rgba(255,255,255,0.05)"
                        : "transparent",
                  borderLeft:
                    i === currentStep
                      ? "3px solid #4169E1"
                      : "3px solid transparent",
                  opacity: currentStep >= 0 && i > currentStep ? 0.4 : 1,
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    color: activePlayer
                      ? `rgb(${activePlayer.rgb[0]},${activePlayer.rgb[1]},${activePlayer.rgb[2]})`
                      : "white",
                    fontWeight: 600,
                    marginRight: 8,
                  }}
                >
                  {activePlayer?.name}
                </span>
                {formatAction(action, state.units)}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(65,105,225,0.5)",
              backgroundColor: "rgba(65,105,225,0.2)",
              color: "#93b4ff",
              cursor: isPlaying ? "not-allowed" : "pointer",
              opacity: isPlaying ? 0.5 : 1,
            }}
          >
            再生
          </button>
          <button
            onClick={() => setIsPlaying(false)}
            disabled={!isPlaying}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "white",
              cursor: !isPlaying ? "not-allowed" : "pointer",
              opacity: !isPlaying ? 0.5 : 1,
            }}
          >
            停止
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
