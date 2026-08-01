#!/usr/bin/env node
/**
 * Tiny launcher: set PW_DISABLE_KKPHIM=1 and exec Playwright. Avoids the
 * cross-platform `KEY=val cmd` syntax headache (works on bash + PowerShell).
 *
 * Used by:
 *   npm run test:e2e:disable-flag
 */
import { spawnSync } from 'node:child_process';

const env = { ...process.env, PW_DISABLE_KKPHIM: '1' };
const result = spawnSync(
  'npx',
  ['playwright', 'test', '--project=chromium-disable-kkphim'],
  { stdio: 'inherit', env, shell: true },
);
process.exit(result.status ?? 1);