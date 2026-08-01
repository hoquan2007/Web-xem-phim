/**
 * Bootstrapper that registers the custom resolver hook for the
 * sandbox test runner.
 *
 * Use:
 *   node --import ./scripts/_register-test-loader.mjs \
 *        --experimental-strip-types \
 *        --experimental-transform-types \
 *        scripts/test-api.ts
 *
 * The resolver itself lives in `_test-loader.mjs` so the same hook
 * can be reused (or unit-tested) without re-registering it.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';

const here = pathResolve(fileURLToPath(import.meta.url), '..');
const loaderUrl = pathToFileURL(pathResolve(here, '_test-loader.mjs')).href;
register(loaderUrl);