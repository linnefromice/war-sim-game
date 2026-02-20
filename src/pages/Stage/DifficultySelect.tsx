import { AIDifficulty } from "../../game/ai";
import { hasSavedGame } from "../../game/saveLoad";
import "./DifficultySelect.scss";

const DIFFICULTIES: { key: AIDifficulty; label: string; description: string }[] = [
  { key: "easy", label: "初級", description: "最寄りの敵に向かい、最大ダメージの武器で攻撃します。" },
  { key: "normal", label: "中級", description: "撃破可能な敵を優先し、負傷した敵を狙います。" },
  { key: "hard", label: "上級", description: "集中砲火・地形活用・撤退判断を行います。" },
];

export const DifficultySelect = ({ onSelect, onLoad }: { onSelect: (d: AIDifficulty) => void; onLoad?: () => void }) => {
  const savedExists = hasSavedGame();

  return (
    <div className="difficulty-select">
      <h2 className="difficulty-select-title">AI Difficulty</h2>
      <p className="difficulty-select-subtitle">対戦相手のAIレベルを選択してください</p>
      <div className="difficulty-select-cards">
        {DIFFICULTIES.map(({ key, label, description }) => (
          <button
            key={key}
            className={`difficulty-select-card difficulty-select-card--${key}`}
            onClick={() => onSelect(key)}
          >
            <span className="difficulty-select-card-label">{label}</span>
            <span className="difficulty-select-card-key">{key.toUpperCase()}</span>
            <span className="difficulty-select-card-desc">{description}</span>
          </button>
        ))}
      </div>
      {savedExists && onLoad && (
        <button className="difficulty-select-load-btn" onClick={onLoad}>
          セーブデータをロード
        </button>
      )}
    </div>
  );
};
