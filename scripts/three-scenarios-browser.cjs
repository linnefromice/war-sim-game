// Run with an existing Playwright installation and Chromium, see run README.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = 'docs/runs/three-scenarios';
const baseURL = process.env.SCENARIOS_URL || 'http://127.0.0.1:5173';
const names = { 'first-contact': 'はじめの射程', 'combined-arms': '混成小隊', crossroads: '森の交差点' };
const results = [];
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
  try {
    for (const [id, winner, mode] of [
      ['first-contact', 1, 'mouse'], ['first-contact', 2, 'mouse'],
      ['combined-arms', 1, 'mouse'], ['combined-arms', 2, 'mouse'],
      ['crossroads', 1, 'mouse'], ['crossroads', 2, 'mouse'],
      ['first-contact', 2, 'keyboard'], ['first-contact', 1, 'touch'], ['crossroads', 2, 'touch'],
    ]) {
      const trace = JSON.parse(fs.readFileSync(`${root}/trace-${id}-p${winner}.json`));
      const context = await browser.newContext({ viewport: mode === 'touch' ? { width: 390, height: 844 } : { width: 1366, height: 1000 }, hasTouch: mode === 'touch', isMobile: mode === 'touch', reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      let interactions = 0;
      const count = () => { if (++interactions > 120) throw new Error('Fixed 120 browser interaction budget exceeded'); };
      const press = async key => { count(); await page.keyboard.press(key); };
      const activate = async locator => {
        if (mode === 'keyboard') {
          for (let i = 0; i < 25; i++) {
            if (await locator.evaluate(el => document.activeElement === el)) { await press('Enter'); return; }
            const before = await locator.evaluate(el => !!(document.activeElement.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING));
            await press(before ? 'Shift+Tab' : 'Tab');
          }
          throw new Error(`Cannot keyboard-focus ${await locator.textContent()}`);
        }
        count();
        if (mode === 'touch') await locator.tap(); else await locator.click();
      };
      // Use CSS coordinates independent of cursor/attack wrappers.
      const cellAt = (x, y) => page.locator(`.stage .row:nth-child(${y + 1}) > :nth-child(${x + 1})`).locator('xpath=self::*[contains(concat(" ",normalize-space(@class)," ")," cell ")] | .//*[contains(concat(" ",normalize-space(@class)," ")," cell ")]').first();
      const assertPageWidth = async () => {
        const sizes = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert(sizes.scroll <= sizes.width + 1, `Document overflow: ${JSON.stringify(sizes)}`);
      };
      const idle = async () => { await page.waitForFunction(() => !document.querySelector('.animation-layer, .turn-change-overlay')); };
      await page.goto(baseURL);
      await assertPageWidth();
      if (mode === 'touch') await page.screenshot({ path: `${root}/images/menu-narrow.png`, fullPage: true });
      await activate(page.getByRole('button', { name: `「${names[id]}」を開始`, exact: true }));
      assert.equal(await page.locator('.stage .row').count(), id === 'first-contact' ? 4 : 5);
      assert.equal(await page.getByText('AI', { exact: true }).count(), 0);
      await assertPageWidth();
      let previousUnits;
      // Initial placements are reconstructed from the first accepted step's before/after move.
      // Data only plans normal inputs; no app state is written or injected.
      const initial = {
        'first-contact': [{ id: 1, x: 0, y: 3 }, { id: 2, x: 4, y: 0 }],
        'combined-arms': [{ id: 1, x: 0, y: 4 }, { id: 2, x: 1, y: 4 }, { id: 3, x: 5, y: 0 }, { id: 4, x: 4, y: 0 }],
        crossroads: [{ id: 1, x: 1, y: 4 }, { id: 2, x: 2, y: 4 }, { id: 3, x: 5, y: 0 }, { id: 4, x: 4, y: 0 }],
      }[id];
      previousUnits = initial.map(u => ({ spec: { id: u.id }, status: { coordinate: { x: u.x, y: u.y } } }));
      let currentPlayer = 1;
      let capturedControls = false;
      for (const [index, { action, state }] of trace.steps.entries()) {
        if (action.type === 'TURN_END') {
          const button = page.getByRole('button', { name: '確定', exact: true });
          assert(await button.isEnabled(), `Player ${currentPlayer} must be manually playable`);
          await activate(button);
          await idle();
          currentPlayer = state.activePlayerId;
        } else {
          const unit = previousUnits.find(u => u.spec.id === action.unitId);
          if (mode === 'keyboard') {
            // Reach the board via native Tab, then Tab selects this player's only unit.
            const board = page.locator('.board-scroll');
            for (let i = 0; i < 20 && !(await board.evaluate(el => document.activeElement === el)); i++) await press('Tab');
            assert(await board.evaluate(el => document.activeElement === el), 'Keyboard board focus');
            await press('Tab');
          } else await activate(cellAt(unit.status.coordinate.x, unit.status.coordinate.y));
          if (action.type === 'DO_MOVE') {
            await activate(page.getByRole('button', { name: '移動', exact: true }));
            if (mode === 'keyboard') {
              const cursor = unit.status.coordinate;
              for (let x = cursor.x; x < action.payload.x; x++) await press('ArrowRight');
              for (let x = cursor.x; x > action.payload.x; x--) await press('ArrowLeft');
              for (let y = cursor.y; y < action.payload.y; y++) await press('ArrowDown');
              for (let y = cursor.y; y > action.payload.y; y--) await press('ArrowUp');
              await press('Enter');
            } else await activate(cellAt(action.payload.x, action.payload.y));
          } else if (action.type === 'DO_ATTACK') {
            await activate(page.getByRole('button', { name: '攻撃', exact: true }));
            // Find the weapon in the trace's immutable surviving attacker spec.
            const attacker = state.units.find(u => u.spec.id === action.unitId);
            await activate(page.getByRole('button', { name: new RegExp(attacker.spec.armaments[action.payload.armament_idx].name) }));
            const target = previousUnits.find(u => u.spec.id === action.payload.target_unit_id);
            if (mode === 'keyboard') {
              // OPEN_MENU reset the cursor; selecting through board Tab sets own location.
              const cursor = unit.status.coordinate;
              for (let x = cursor.x; x < target.status.coordinate.x; x++) await press('ArrowRight');
              for (let x = cursor.x; x > target.status.coordinate.x; x--) await press('ArrowLeft');
              for (let y = cursor.y; y < target.status.coordinate.y; y++) await press('ArrowDown');
              for (let y = cursor.y; y > target.status.coordinate.y; y--) await press('ArrowUp');
              await press('Enter');
            } else await activate(cellAt(target.status.coordinate.x, target.status.coordinate.y));
          }
          await idle();
        }
        previousUnits = state.units;
        assert.equal(await page.locator('.battle-log-entry').count(), index + 1, 'Every input must become exactly one accepted game action');
        if (!capturedControls && action.type !== 'TURN_END' && (mode === 'touch' || (id === 'first-contact' && winner === 1))) {
          capturedControls = true;
          await assertPageWidth();
          const controls = await page.locator('.stage-controls').boundingBox();
          const board = await page.locator('.board-scroll').boundingBox();
          assert(controls.y >= board.y + board.height - 1, 'Controls must not cover the board');
          await page.screenshot({ path: `${root}/images/${id}-${mode}-playing.png`, fullPage: true });
        }
      }
      await page.getByRole('dialog', { name: '対戦結果' }).waitFor();
      await page.waitForTimeout(650); // Capture the settled result, after its CSS entrance animation.
      assert.equal(await page.getByText(`Player ${winner} Wins!`, { exact: true }).count(), 1);
      await assertPageWidth();
      await page.screenshot({ path: `${root}/images/${id}-p${winner}-${mode}-victory.png`, fullPage: true });
      if (mode === 'touch') {
        const assertModalFits = async selector => {
          const box = await page.locator(selector).boundingBox();
          const viewport = page.viewportSize();
          assert(box.x >= -1 && box.x + box.width <= viewport.width + 1, `${selector} horizontal overflow`);
          assert(box.y >= -1 && box.y + box.height <= viewport.height + 1, `${selector} vertical overflow`);
        };
        await activate(page.getByRole('button', { name: '統計', exact: true }));
        await assertModalFits('.stats-panel');
        await page.screenshot({ path: `${root}/images/${id}-touch-statistics.png`, fullPage: true });
        await activate(page.getByRole('button', { name: '統計を閉じる', exact: true }));
        await activate(page.getByRole('button', { name: 'リプレイ', exact: true }));
        await page.waitForTimeout(450);
        await assertModalFits('.replay-panel');
        await page.screenshot({ path: `${root}/images/${id}-touch-replay.png`, fullPage: true });
        await activate(page.getByRole('button', { name: '閉じる', exact: true }));
      }
      const logCount = await page.locator('.battle-log-entry').count();
      // Finished-game keyboard input must not mutate gameplay.
      await press('ArrowRight');
      assert.equal(await page.locator('.battle-log-entry').count(), logCount);
      await activate(page.getByRole('button', { name: '同じ面で再戦', exact: true }));
      assert.equal(await page.locator('.battle-log-entry').count(), 0);
      assert.equal(await page.locator('.action-buttons, .cell-cursor-wrapper').count(), 0);
      assert.equal(await page.locator('.cell-unit').count(), initial.length);
      assert.equal(await page.locator('.turn-banner-turn-number').textContent(), 'TURN 1');
      await activate(page.getByRole('button', { name: 'シナリオ選択へ', exact: true }));
      assert.equal(await page.getByRole('button', { name: /を開始$/ }).count(), 4);
      const nextId = id === 'crossroads' ? 'combined-arms' : 'crossroads';
      await activate(page.getByRole('button', { name: `「${names[nextId]}」を開始`, exact: true }));
      assert.equal(await page.locator('h1').textContent(), names[nextId]);
      assert.equal(await page.locator('.battle-log-entry').count(), 0);
      await activate(page.getByRole('button', { name: '保存', exact: true }));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('war-sim-save')));
      assert.equal(saved.version, 2);
      assert.equal(saved.scenarioId, nextId);
      assert.equal(saved.difficulty, undefined);
      assert.equal(saved.gameState.activePlayerId, 1);
      assert.equal(saved.gameState.turnNumber, 1);
      assert.deepEqual(saved.gameState.phase, { type: 'playing' });
      assert.deepEqual(saved.gameState.history, []);
      for (const unit of saved.gameState.units) {
        assert.equal(unit.status.hp, unit.spec.max_hp);
        assert.equal(unit.status.en, unit.spec.max_en);
        assert.equal(unit.status.moved, false);
        assert.equal(unit.status.attacked, false);
      }
      await activate(page.getByRole('button', { name: 'シナリオ選択へ', exact: true }));
      await activate(page.getByRole('button', { name: '保存した対戦を再開', exact: true }));
      assert.equal(await page.locator('h1').textContent(), names[nextId]);
      await assertPageWidth();
      assert.deepEqual(errors, []);
      results.push({ id, winner, mode, interactions, gameActions: trace.actionCount, result: 'PASS', errors });
      fs.writeFileSync(`${root}/browser-results.json`, JSON.stringify(results, null, 2) + '\n');
      console.log('PASS', results[results.length - 1]);
      await context.close();
    }
    const layouts = [];
    for (const width of [320, 768, 1366]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(baseURL);
      if (width === 1366) await page.screenshot({ path: `${root}/images/menu-pc.png`, fullPage: true });
      for (const name of ['Tutorial Battle', ...Object.values(names)]) {
        await page.getByRole('button', { name: `「${name}」を開始`, exact: true }).click();
        await page.locator('.unit-status-summary-item').first().click();
        await page.getByRole('button', { name: '攻撃', exact: true }).click();
        const sizes = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert(sizes.scroll <= sizes.width + 1, `Layout overflow at ${width}, ${name}`);
        const controls = await page.locator('.stage-controls').boundingBox();
        const board = await page.locator('.board-scroll').boundingBox();
        assert(controls.y >= board.y + board.height - 1, 'Action menu must not overlap board');
        if (width === 320 && name === 'Tutorial Battle') await page.screenshot({ path: `${root}/images/tutorial-minimum-width.png`, fullPage: true });
        layouts.push({ width, scenario: name, controlsBelowBoard: true, documentOverflow: false });
        await page.getByRole('button', { name: 'シナリオ選択へ', exact: true }).click();
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(`${root}/layout-results.json`, JSON.stringify(layouts, null, 2) + '\n');
    console.log('PASS layouts', layouts.length);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
