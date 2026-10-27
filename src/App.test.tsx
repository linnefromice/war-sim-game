import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { scenarios } from "./scenarios";
import { victoryWitness } from "./test/scenarioWitness";
import { createInitialGameState } from "./game/gameReducer";
import { loadGame } from "./game/saveLoad";
import { ATTACK_DURATION, MOVE_DURATION, TURN_CHANGE_DURATION } from "./pages/Stage/AnimationLayer";

vi.mock("./pages/Stage/UnitIcon", () => ({ UnitIcon: () => <span /> }));

describe("hotseat application lifecycle", () => {
  beforeEach(() => { Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() }); localStorage.clear(); vi.useFakeTimers({ shouldAdvanceTime: true }); });
  afterEach(() => vi.useRealTimers());
  it.each([1, 2])("plays to Player %i victory, restarts cleanly and switches maps", async winner => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    expect(screen.getAllByRole("button", { name: /を開始/ })).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "「はじめの射程」を開始" }));
    const scenario = scenarios[1];
    let previous = createInitialGameState(scenario);
    const cell = (x: number, y: number) => {
      const wrapper = container.querySelectorAll(".stage .row")[y].children[x];
      return wrapper.matches(".cell") ? wrapper : wrapper.querySelector(".cell")!;
    };
    for (const { action, state } of victoryWitness(scenario, winner).steps) {
      if (action.type === "TURN_END") {
        expect(screen.getByRole("button", { name: "確定" })).toBeEnabled();
        await user.click(screen.getByRole("button", { name: "確定" }));
        await act(() => vi.advanceTimersByTime(TURN_CHANGE_DURATION));
      } else if (action.type === "DO_MOVE" || action.type === "DO_ATTACK") {
        const unit = previous.units.find(u => u.spec.id === action.unitId)!;
        await user.click(cell(unit.status.coordinate.x, unit.status.coordinate.y));
        if (action.type === "DO_MOVE") {
          await user.click(screen.getByRole("button", { name: "移動" }));
          await user.click(cell(action.payload.x, action.payload.y));
          await act(() => vi.advanceTimersByTime(MOVE_DURATION));
        } else {
          await user.click(screen.getByRole("button", { name: "攻撃" }));
          const name = unit.spec.armaments[action.payload.armament_idx].name;
          await user.click(screen.getByRole("button", { name: new RegExp(name) }));
          const target = previous.units.find(u => u.spec.id === action.payload.target_unit_id)!;
          await user.click(cell(target.status.coordinate.x, target.status.coordinate.y));
          await act(() => vi.advanceTimersByTime(ATTACK_DURATION));
        }
      }
      previous = state;
    }
    expect(screen.getByText(`Player ${winner} Wins!`)).toBeInTheDocument();
    const before = container.querySelectorAll(".battle-log-entry").length;
    await user.keyboard("{Enter}{ArrowDown}{Tab}");
    expect(container.querySelectorAll(".battle-log-entry")).toHaveLength(before);
    await user.click(screen.getByRole("button", { name: "統計" }));
    expect(screen.getByText("Battle Statistics")).toBeInTheDocument();
    expect(container.querySelectorAll(".stats-panel-player")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "統計を閉じる" }));
    expect(screen.queryByText("Battle Statistics")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "リプレイ" }));
    expect(container.querySelectorAll(".replay-item")).toHaveLength(before);
    await user.click(screen.getByRole("button", { name: "再生" }));
    await act(() => vi.advanceTimersByTime(1000));
    await user.click(screen.getByRole("button", { name: "停止" }));
    await user.click(screen.getByRole("button", { name: "再生" }));
    for (let i = 0; i < before; i++) await act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector(".replay-header-counter")).toHaveTextContent(`${before}/${before}`);
    await user.click(screen.getByRole("button", { name: "再生" }));
    await user.click(screen.getByRole("button", { name: "閉じる" }));
    await user.click(screen.getByRole("button", { name: "同じ面で再戦" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector(".action-buttons")).not.toBeInTheDocument();
    expect(container.querySelector(".cell-cursor-wrapper")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(loadGame()?.gameState).toEqual(createInitialGameState(scenario));
    await user.click(screen.getByRole("button", { name: "シナリオ選択へ" }));
    await user.click(screen.getByRole("button", { name: "「混成小隊」を開始" }));
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(loadGame()?.gameState).toEqual(createInitialGameState(scenarios[2]));
    expect(loadGame()?.scenarioId).toBe("combined-arms");
    expect(loadGame()?.difficulty).toBeUndefined();
    expect(screen.queryByText("AI")).not.toBeInTheDocument();
  });

  it("reports unreadable saves without losing the scenario menu", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "保存した対戦を再開" }));
    expect(screen.getByRole("alert")).toHaveTextContent("再開できるセーブがありません");
    expect(screen.getAllByRole("button", { name: /を開始/ })).toHaveLength(4);
  });
});

it("resumes a saved hotseat turn and clears it when starting tutorial", async () => {
  const { saveGame } = await import("./game/saveLoad");
  const { gameReducer } = await import("./game/gameReducer");
  const scenario = scenarios[1];
  let state = gameReducer(createInitialGameState(scenario), { type: "DO_MOVE", unitId: 1, payload: { x: 0, y: 2 } }, scenario);
  state = gameReducer(state, { type: "TURN_END" }, scenario);
  saveGame(state, undefined, scenario.id);
  const user = userEvent.setup();
  const { container } = render(<App />);
  await user.click(screen.getByRole("button", { name: "保存した対戦を再開" }));
  expect(container.querySelector(".turn-banner-center-name")).toHaveTextContent("Player 2");
  expect(container.querySelectorAll(".battle-log-entry")).toHaveLength(2);
  expect(screen.queryByText("AI")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "シナリオ選択へ" }));
  await user.click(screen.getByRole("button", { name: "「Tutorial Battle」を開始" }));
  expect(container.querySelectorAll(".stage .row")).toHaveLength(10);
  expect(container.querySelectorAll(".battle-log-entry")).toHaveLength(0);
});

it("loads v1 tutorial saves in their existing CPU mode", async () => {
  const gameState = createInitialGameState(scenarios[0]);
  localStorage.setItem("war-sim-save", JSON.stringify({ version: 1, gameState, difficulty: "normal" }));
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "保存した対戦を再開" }));
  expect(screen.getByText(/既存セーブのCPU対戦/)).toBeInTheDocument();
  expect(screen.queryByText("AI Difficulty")).not.toBeInTheDocument();
});

it("keeps the match playable and reports unavailable save storage", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "「はじめの射程」を開始" }));
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  try {
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByRole("alert")).toHaveTextContent("保存できませんでした");
    expect(screen.getByRole("button", { name: "確定" })).toBeEnabled();
  } finally { spy.mockRestore(); }
});
