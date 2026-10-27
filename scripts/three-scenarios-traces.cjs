// Uses the project's existing locked esbuild dependency; no downloads.
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'three-scenarios-traces-'));
try {
  const output = path.join(temp, 'witness.cjs');
  buildSync({ stdin: { contents: 'export { shortScenarios } from "./src/scenarios"; export { victoryWitness } from "./src/test/scenarioWitness";', resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'cjs', outfile: output });
  const { shortScenarios, victoryWitness } = require(output);
  for (const scenario of shortScenarios) for (const winner of [1, 2]) {
    const trace = victoryWitness(scenario, winner);
    fs.writeFileSync(`docs/runs/three-scenarios/trace-${scenario.id}-p${winner}.json`, JSON.stringify(trace, null, 2) + '\n');
    console.log(`${scenario.id} P${winner}: ${trace.actionCount} actions, ${trace.halfTurns} half-turns`);
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
