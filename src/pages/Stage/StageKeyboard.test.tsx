import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Stage } from "./index";
import { shortScenarios } from "../../scenarios";
import { ATTACK_DURATION, MOVE_DURATION, TURN_CHANGE_DURATION } from "./AnimationLayer";

vi.mock("./UnitIcon", () => ({ UnitIcon: () => <span /> }));
describe("hotseat keyboard action boundaries", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());
  it("keeps native focus navigation, rejects illegal targets, permits Player 2 and undo", async () => {
    const user = userEvent.setup();
    const scenario = structuredClone(shortScenarios[0]);
    scenario.units[1].status.coordinate = { x: 2, y: 2 };
    scenario.units[1].status.previousCoordinate = { x: 2, y: 2 };
    scenario.units[1].status.initialCoordinate = { x: 2, y: 2 };
    const { container } = render(<Stage scenario={scenario} />);
    const board = container.querySelector<HTMLElement>(".board-scroll")!;
    const key = (key: string, shiftKey = false) => fireEvent.keyDown(board, { key, shiftKey });
    const logCount = () => container.querySelectorAll(".battle-log-entry").length;
    key("Tab", true);
    expect(container.querySelector(".action-buttons")).toBeNull();
    key("Tab");
    expect(screen.getByRole("button", { name: "移動" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "移動" }));
    key("ArrowUp"); key("Enter");
    // Animation guard ignores a second input.
    key("ArrowRight");
    await act(() => vi.advanceTimersByTime(MOVE_DURATION));
    expect(logCount()).toBe(1);
    await user.click(screen.getByRole("button", { name: "戻す" }));
    expect(logCount()).toBe(2);
    key("ArrowRight"); key("ArrowDown"); key("ArrowLeft"); key("ArrowUp");
    key("Escape");
    expect(container.querySelector(".cell-cursor-wrapper")).toBeNull();
    key("Tab");
    await user.click(screen.getByRole("button", { name: "移動" }));
    key("ArrowRight"); key("ArrowRight"); key("ArrowRight"); key("Enter");
    expect(logCount()).toBe(2); // range violation
    key("Escape"); key("Tab");
    await user.click(screen.getByRole("button", { name: "攻撃" }));
    await user.click(screen.getByRole("button", { name: /Assault rifle/ }));
    key("Enter");
    expect(logCount()).toBe(2); // own cell
    key("ArrowRight"); key("ArrowRight"); key("ArrowUp"); key("Enter");
    expect(logCount()).toBe(2); // out of rifle range
    key("Escape");
    key("Enter"); // no cursor ends turn
    await act(() => vi.advanceTimersByTime(TURN_CHANGE_DURATION));
    expect(container.querySelector(".turn-banner-center-name")).toHaveTextContent("Player 2");
    key("Tab");
    await user.click(screen.getByRole("button", { name: "攻撃" }));
    await user.click(screen.getByRole("button", { name: /Suicide drone/ }));
    key("ArrowLeft"); key("ArrowLeft"); key("ArrowDown"); key("Enter");
    await act(() => vi.advanceTimersByTime(ATTACK_DURATION));
    expect(container.querySelectorAll(".cell-unit, .cell-active-unit")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "確定" }));
    await act(() => vi.advanceTimersByTime(TURN_CHANGE_DURATION));
    expect(screen.getByText("Player 2 Wins!")).toBeInTheDocument();
    key("Enter"); key("Tab");
    expect(screen.getByText("Player 2 Wins!")).toBeInTheDocument();
  });
});

it("keeps allied units visible in attack mode and only permits enemy targets", async () => {
  const user = userEvent.setup();
  const { container } = render(<Stage scenario={shortScenarios[1]} />);
  const rows = container.querySelectorAll(".stage .row");
  await user.click(rows[4].children[0]);
  await user.click(screen.getByRole("button", { name: "攻撃" }));
  await user.click(screen.getByRole("button", { name: /Machine gun/ }));
  expect(container.querySelectorAll(".cell-unit, .cell-active-unit")).toHaveLength(4);
  const ally = rows[4].children[1];
  await user.click(ally);
  expect(container.querySelectorAll(".battle-log-entry")).toHaveLength(0);
  expect(container.querySelectorAll(".cell-unit, .cell-active-unit")).toHaveLength(4);
});
