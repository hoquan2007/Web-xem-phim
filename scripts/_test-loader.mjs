/**
 * Custom ESM resolver for the sandbox test runner.
 *
 * `node --experimental-strip-types` does NOT understand:
 *   - the `@/...` path alias declared in tsconfig.json (Next.js-specific)
 *   - extensionless relative imports (`./providers`, `../api`)
 *
 * This loader hooks the resolve step so the offline API tests can
 * import the same way the Next.js app does, without having to fork
 * the production code into a separate "test" tree.
 *
 * It is loaded via:
 *   node --import ./scripts/_test-loader.mjs \
 *        --experimental-strip-types \
 *        --experimental-transform-types \
 *        scripts/test-api.ts
 *
 * @see https://nodejs.org/api/module.html#customization-hooks
 */
import { pathToFileURL } from 'node:url';
import { resolve as pathResolve } from 'node:path';

const projectRoot = pathResolve(process.cwd(), 'src');

const KNOWN_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'];

export async function resolve(specifier, context, nextResolve) {
  // 1) Map `@/foo/bar` → `<projectRoot>/foo/bar`.
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2);
    for (const ext of KNOWN_EXTENSIONS) {
      try {
        return await nextResolve(pathToFileURL(pathResolve(projectRoot, rel + ext)).href, context);
      } catch {
        // try next extension
      }
    }
  }

  // 2) Append `.ts` to extensionless relative imports so the source
  //    code can stay portable for both Next.js and the sandbox runner.
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !KNOWN_EXTENSIONS.some((ext) => specifier.endsWith(ext)) &&
    !specifier.endsWith('/')
  ) {
    const explicit = await nextResolve(specifier, context).catch(() => null);
    if (explicit && explicit.format !== 'unknown') {
      return explicit;
    }
    return nextResolve(specifier + '.ts', context);
  }

  return nextResolve(specifier, context);
}