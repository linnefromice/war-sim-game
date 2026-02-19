import { useContext, useEffect, useRef, useState } from "react";
import { ActionContext } from "./index";
import { useScenario } from "../../contexts/ScenarioContext";
import { GameAction } from "../../game/types";
import { UnitType } from "../../types";

const formatAction = (action: GameAction, unitNameMap: Map<number, string>): string => {
  switch (action.type) {
    case "DO_MOVE": {
      const name = unitNameMap.get(action.unitId) ?? `Unit#${action.unitId}`;
      return `${name} が (${action.payload.x},${action.payload.y}) へ移動`;
    }
    case "DO_ATTACK": {
      const name = unitNameMap.get(action.unitId) ?? `Unit#${action.unitId}`;
      const targetName = unitNameMap.get(action.payload.target_unit_id) ?? `Unit#${action.payload.target_unit_id}`;
      return `${name} が ${targetName} に攻撃`;
    }
    case "TURN_END":
      return "--- ターン終了 ---";
    case "UNDO_MOVE": {
      const name = unitNameMap.get(action.unitId) ?? `Unit#${action.unitId}`;
      return `${name} の移動を取消`;
    }
    case "LOAD_STATE":
      return "";
  }
};

export const BattleLog = () => {
  const { gameState } = useContext(ActionContext);
  const scenario = useScenario();
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLengthRef = useRef(0);

  // Build unit name map from initial units (preserved even after destruction)
  const unitNameMap = useRef(
    new Map<number, string>(scenario.units.map((u: UnitType) => [u.spec.id, u.spec.name]))
  );

  const entries = gameState.history.map((action, idx) => ({
    key: idx,
    text: formatAction(action, unitNameMap.current),
    isNew: idx >= lastLengthRef.current,
    isTurnEnd: action.type === "TURN_END",
  }));

  useEffect(() => {
    lastLengthRef.current = gameState.history.length;
  }, [gameState.history.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.history.length]);

  return (
    <div className="battle-log">
      <button className="battle-log-toggle" onClick={() => setCollapsed(c => !c)}>
        {collapsed ? "▶ ログ" : "▼ ログ"}
      </button>
      {!collapsed && (
        <div className="battle-log-entries" ref={scrollRef}>
          {entries.length === 0 ? (
            <div className="battle-log-empty">アクションなし</div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.key}
                className={`battle-log-entry ${entry.isTurnEnd ? "battle-log-entry--turn-end" : ""} ${entry.isNew ? "battle-log-entry--new" : ""}`}
              >
                {entry.text}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
