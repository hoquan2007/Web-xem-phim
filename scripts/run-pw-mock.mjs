#!/usr/bin/env node
/**
 * Tiny launcher: set PW_MOCK=1 and exec Playwright. Avoids the
 * cross-platform `KEY=val cmd` syntax headache (works on bash + PowerShell).
 *
 * Used by:
 *   npm run test:e2e:mock
 *
 * Why a launcher instead of `cross-env PW_MOCK=1 playwright test`?
 * `PW_MOCK=1` is read inside `playwright.config.ts` to decide which project
 * (and which spec files) to run. Setting it via the same process ensures
 * the config sees a consistent value across Windows + Unix.
 */
import { spawnSync } from 'node:child_process';

const env = { ...process.env, PW_MOCK: '1' };
const result = spawnSync(
  'npx',
  ['playwright', 'test', '--project=chromium-mock'],
  { stdio: 'inherit', env, shell: true },
);
process.exit(result.status ?? 1);
