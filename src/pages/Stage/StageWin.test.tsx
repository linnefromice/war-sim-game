import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ATTACK_DURATION } from "./AnimationLayer";

// Mock UnitIcon to avoid SVG import issues
vi.mock("./UnitIcon", () => ({
  UnitIcon: ({ unitType, className }: { unitType: string; className: string }) => (
    <div data-testid={`unit-icon-${unitType}`} className={className} />
  ),
}));

// Mock tutorialScenario with minimal 3x3 grid
// All data must be inline (vi.mock is hoisted, cannot reference outer variables)
vi.mock("../../scenarios/tutorial", () => {
  const fighterArmaments = [
    { name: "Machine gun", value: 200, range: 2, consumed_en: 50 },
    { name: "Missile", value: 400, range: 3, consumed_en: 100 },
  ];
  const soldierArmaments = [
    { name: "Assault rifle", value: 100, range: 2, consumed_en: 10 },
    { name: "Grenade launcher", value: 300, range: 2, consumed_en: 20 },
    { name: "Suicide drone", value: 500, range: 3, consumed_en: 75 },
  ];

  return {
    tutorialScenario: {
      id: "test-minimal",
      name: "Test Battle",
      gridSize: { rows: 3, cols: 3 },
      players: [
        { id: 1, name: "Hero", rgb: [0, 0, 255] },
        { id: 2, name: "Villan", rgb: [255, 0, 0] },
      ],
      units: [
        {
          spec: {
            id: 101,
            name: "P1-Fighter",
            unit_type: "fighter",
            movement_range: 3,
            max_hp: 800,
            max_en: 200,
            armaments: fighterArmaments,
          },
          status: {
            hp: 800,
            en: 200,
            coordinate: { x: 1, y: 2 },
            previousCoordinate: { x: 1, y: 2 },
            initialCoordinate: { x: 1, y: 2 },
            moved: false,
            attacked: false,
          },
          playerId: 1,
        },
        {
          spec: {
            id: 102,
            name: "P2-Soldier",
            unit_type: "soldier",
            movement_range: 1,
            max_hp: 100,
            max_en: 100,
            armaments: soldierArmaments,
          },
          status: {
            hp: 100,
            en: 100,
            coordinate: { x: 1, y: 1 },
            previousCoordinate: { x: 1, y: 1 },
            initialCoordinate: { x: 1, y: 1 },
            moved: false,
            attacked: false,
          },
          playerId: 2,
        },
      ],
    },
  };
});

// Test 5: Win detection → result screen
describe("Stage win detection", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows victory screen when all enemy units are eliminated", async () => {
    const { Stage } = await import("./index");
    const { render } = await import("@testing-library/react");

    const { container } = render(<Stage />);

    // Verify minimal grid: 3 rows, 3 cols
    const stage = container.querySelector(".stage")!;
    const rows = stage.querySelectorAll(".row");
    expect(rows.length).toBe(3);

    // Find the P1 unit cell (at row 2, col 1)
    const row2 = rows[2];
    const p1UnitCells = row2.querySelectorAll('.cell-unit, .cell-active-unit');
    expect(p1UnitCells.length).toBe(1);

    // Click P1 unit to open menu
    await user.click(p1UnitCells[0]);
    expect(screen.getByText("攻撃")).toBeInTheDocument();

    // Click 攻撃 to open weapon submenu
    await user.click(screen.getByText("攻撃"));

    // Select Missile (400 dmg, range 3) — enemy at distance 1, well within range
    await user.click(screen.getByText("Missile"));

    // Attack range should be shown
    const attackRangeCells = container.querySelectorAll(".cell-attack-range");
    expect(attackRangeCells.length).toBeGreaterThan(0);

    // Find the enemy unit cell and click to attack
    const row1 = rows[1];
    const enemyUnitCells = row1.querySelectorAll('.cell-unit, .cell-active-unit');
    expect(enemyUnitCells.length).toBe(1);
    await user.click(enemyUnitCells[0]);

    // Complete attack animation
    await act(() => {
      vi.advanceTimersByTime(ATTACK_DURATION);
    });

    // Enemy eliminated (100 HP - 400 Missile dmg = dead)
    // Open menu again on P1 unit to end turn
    const p1UnitCellsAfter = container.querySelectorAll('.cell-unit, .cell-active-unit');
    expect(p1UnitCellsAfter.length).toBe(1); // only P1 unit remains
    await user.click(p1UnitCellsAfter[0]);

    // Click 確定 to end turn → triggers win detection (no P2 units left)
    await user.click(screen.getByText("確定"));

    // Victory screen should show
    expect(screen.getByText("Player 1 Wins!")).toBeInTheDocument();
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText("Restart")).toBeInTheDocument();
  });
});
