import { GameState } from "./types";
import { AIDifficulty } from "./ai";

const SAVE_KEY = "war-sim-save";

type SaveData = {
  version: 1;
  gameState: GameState;
  difficulty: AIDifficulty;
  savedAt: string;
};

export const saveGame = (gameState: GameState, difficulty: AIDifficulty): void => {
  const data: SaveData = {
    version: 1,
    gameState,
    difficulty,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
};

export const loadGame = (): { gameState: GameState; difficulty: AIDifficulty } | null => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const data: SaveData = JSON.parse(raw);
    if (data.version !== 1) return null;
    return { gameState: data.gameState, difficulty: data.difficulty };
  } catch {
    return null;
  }
};

export const hasSavedGame = (): boolean => {
  return localStorage.getItem(SAVE_KEY) !== null;
};

export const deleteSave = (): void => {
  localStorage.removeItem(SAVE_KEY);
};
