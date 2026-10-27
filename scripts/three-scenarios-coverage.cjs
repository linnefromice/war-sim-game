// Reuse an already installed matching Vitest + coverage-v8 pair. Never install packages.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const project = process.cwd();
const toolRoot = process.env.SCENARIOS_VITEST_ROOT || path.join(project, 'node_modules');
const runner = path.join(toolRoot, 'vitest');
const provider = path.join(toolRoot, '@vitest/coverage-v8');
const runnerVersion = JSON.parse(fs.readFileSync(path.join(runner, 'package.json'))).version;
const providerVersion = JSON.parse(fs.readFileSync(path.join(provider, 'package.json'))).version;
if (runnerVersion !== providerVersion) throw new Error('Existing Vitest/coverage versions must match');
const link = path.join(project, 'node_modules/@vitest/coverage-v8');
let createdLink = false;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'three-scenarios-coverage-'));
try {
  if (!fs.existsSync(link)) { fs.symlinkSync(provider, link, 'dir'); createdLink = true; }
  if (fs.realpathSync(link) !== fs.realpathSync(provider)) throw new Error('Refusing to replace an existing coverage package');
  const setup = path.join(temp, 'setup.mts');
  fs.writeFileSync(setup, `import { expect } from ${JSON.stringify(path.join(runner, 'dist/index.js'))};\nimport * as matchers from ${JSON.stringify(path.join(project, 'node_modules/@testing-library/jest-dom/dist/matchers.mjs'))};\nexpect.extend(matchers);\n`);
  const config = path.join(temp, 'config.mts');
  fs.writeFileSync(config, `import config from ${JSON.stringify(path.join(project, 'vite.config.ts'))};
export default {
  ...config, root: ${JSON.stringify(project)},
  resolve: { alias: { vitest: ${JSON.stringify(path.join(runner, 'dist/index.js'))} } },
  test: { ...config.test, setupFiles: [${JSON.stringify(setup)}], coverage: {
    enabled: true, provider: "v8", include: ["src/**/*.{ts,tsx}"],
    exclude: ["**/*.test.*", "src/test/**", "src/vite-env.d.ts"],
    reportsDirectory: ${JSON.stringify(path.join(project, 'docs/runs/three-scenarios/coverage'))},
    reporter: ["text", "json-summary"], thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }
  } }
};\n`);
  console.log(`Existing coverage tool: Vitest ${runnerVersion}, coverage-v8 ${providerVersion}. Project release checks run separately with yarn.`);
  const result = spawnSync(process.execPath, [path.join(runner, 'vitest.mjs'), 'run', '--config', config], { cwd: project, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status === null ? 1 : result.status;
} finally {
  if (createdLink) fs.unlinkSync(link);
  fs.rmSync(temp, { recursive: true, force: true });
}
