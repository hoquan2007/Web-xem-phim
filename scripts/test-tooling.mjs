import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ESLint } from 'eslint';
import match from '../tools/minimatch-compat/index.cjs';
const require = createRequire(import.meta.url);

async function main() {
  assert.equal(match('src/app/page.tsx', '**/*.{ts,tsx}'), true);
  assert.equal(match('src/a.js', '**/*.tsx'), false);
  assert.equal(match.defaults({ dot: true })('.hidden', '*'), true);
  assert.equal(new match.Minimatch('src/**').match('src/a.ts'), true);
  assert.equal(match.makeRe('private/**').test('private/secret'), true);
  assert.deepEqual(match.match(['a.ts', 'b.js'], '*.ts'), ['a.ts']);
  assert.equal(match.filter('*.js')('b.js'), true);
  for (const name of ['eslint', 'eslint-plugin-react', 'eslint-plugin-import', 'eslint-plugin-jsx-a11y', '@typescript-eslint/typescript-estree']) {
    const consumer = createRequire(require.resolve(name));
    const matcher = consumer('minimatch');
    assert.equal(matcher('x.ts', '*.ts'), true);
  }
  const eslint = new ESLint();
  const [result] = await eslint.lintText('export default function Broken(){return <img src="/x.png"/>}', { filePath: 'src/app/tooling-regression.tsx' });
  assert.ok(result.messages.some(message => message.ruleId === 'jsx-a11y/alt-text'));
  const configured = new ESLint({ overrideConfig: { rules: { 'import/no-internal-modules': ['error', { forbid: ['private/**'] }] } } });
  const [imports] = await configured.lintText('import value from "private/secret"; export default value;', { filePath: 'src/tooling-regression.ts' });
  assert.ok(imports.messages.some(message => message.ruleId === 'import/no-internal-modules'));
  console.log('Tooling compatibility and active ESLint rules verified');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
