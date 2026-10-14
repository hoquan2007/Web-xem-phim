// Regression checks for the implemented fixes; original audit evidence is
// preserved in docs/audit-2026-10-14/regression-results.json.
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const result = spawnSync(process.execPath, ['--import', './scripts/_register-test-loader.mjs', '--experimental-strip-types', '--experimental-transform-types', 'scripts/test-api.ts'], { encoding: 'utf8' });
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
await mkdir('docs/audit-2026-10-14', { recursive: true });
await writeFile('docs/audit-2026-10-14/regression-after.json', JSON.stringify({ generatedAt: new Date().toISOString(), exitCode: result.status, stdout: result.stdout, stderr: result.stderr }, null, 2) + '\n');
process.exit(result.status ?? 1);
