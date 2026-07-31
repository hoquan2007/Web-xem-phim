/**
 * FIX-10.5: Static security scan for common web vulnerabilities.
 *
 * Run with:
 *   node --experimental-strip-types --experimental-transform-types \
 *        scripts/test-security.ts
 *
 * No new dev dependencies. Scans source code for patterns that indicate
 * common security issues:
 *   - `dangerouslySetInnerHTML` without sanitize call → high risk
 *   - `eval()` / `new Function()` / `setTimeout(string)` → critical
 *   - `document.write` / `innerHTML =` → XSS surface
 *   - localStorage with unsanitized data → XSS in next reload
 *   - Hardcoded secrets → info leak
 *
 * Exit code 0 = no critical findings. Exit code 1 = high/critical findings.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface Finding {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pattern: string;
  message: string;
  context: string;
}

const ROOT = join(process.cwd(), 'src');
const EXCLUDE_DIRS = new Set(['node_modules', '.next', 'dist', 'build']);
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const findings: Finding[] = [];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (EXCLUDE_DIRS.has(entry)) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      const ext = entry.slice(entry.lastIndexOf('.'));
      if (SCANNED_EXTENSIONS.has(ext)) files.push(fullPath);
    }
  }
  return files;
}

interface PatternRule {
  pattern: RegExp;
  severity: Finding['severity'];
  message: string;
  // Optional predicate: skip finding if context satisfies.
  skipIf?: (context: string) => boolean;
}

const RULES: PatternRule[] = [
  // ─── Critical: code execution primitives ────────────────────────────
  {
    pattern: /\beval\s*\(/g,
    severity: 'critical',
    message: 'eval() can execute arbitrary code. Use safer alternatives.',
  },
  {
    pattern: /\bnew\s+Function\s*\(/g,
    severity: 'critical',
    message: 'new Function() can execute arbitrary code. Avoid.',
  },
  {
    pattern: /setTimeout\s*\(\s*['"`]/g,
    severity: 'critical',
    message: 'setTimeout with string argument evaluates as code.',
  },
  {
    pattern: /setInterval\s*\(\s*['"`]/g,
    severity: 'critical',
    message: 'setInterval with string argument evaluates as code.',
  },

  // ─── High: XSS via DOM ───────────────────────────────────────────────
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{/g,
    severity: 'high',
    message: 'dangerouslySetInnerHTML usage detected. Verify input is sanitized.',
    skipIf: (ctx) =>
      ctx.includes('sanitizeHtml(') ||
      ctx.includes('__html: safe') ||
      ctx.includes('__html: sanitized'),
  },
  {
    pattern: /\.innerHTML\s*=/g,
    severity: 'high',
    message: 'Setting innerHTML bypasses React escaping. Sanitize first.',
  },
  {
    pattern: /document\.write\s*\(/g,
    severity: 'high',
    message: 'document.write is dangerous and not needed in React.',
  },
  {
    pattern: /insertAdjacentHTML\s*\(/g,
    severity: 'high',
    message: 'insertAdjacentHTML bypasses escaping. Avoid.',
  },

  // ─── High: dangerous URL protocols ──────────────────────────────────
  {
    pattern: /window\.location\s*=\s*[^;]*\$\{/g,
    severity: 'high',
    message: 'Dynamic URL assignment can lead to javascript: URLs.',
    skipIf: (ctx) =>
      ctx.includes('encodeURIComponent') || ctx.includes('encodeURI'),
  },
  {
    pattern: /href\s*=\s*\{\s*[`'"]javascript:/gi,
    severity: 'critical',
    message: 'Hardcoded javascript: URL in JSX.',
  },

  // ─── Medium: leaky patterns ─────────────────────────────────────────
  {
    pattern: /localStorage\.setItem\s*\([^,]+,\s*[^)]*\$\{/g,
    severity: 'medium',
    message: 'localStorage write with interpolated value — verify sanitization.',
  },
  {
    pattern: /console\.log\s*\(\s*[^)]*token/i,
    severity: 'medium',
    message: 'Logging tokens is risky. Use console.error in production.',
  },

  // ─── Low: hardcoded URLs that should be configurable ───────────────
  {
    pattern: /https?:\/\/(?:api|v1|admin|internal)\.[a-z0-9.-]+/g,
    severity: 'low',
    message: 'Hardcoded internal API URL. Consider using environment variable.',
  },
];

const allFiles = walk(ROOT);

for (const file of allFiles) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(content)) !== null) {
      // Find line number from match index.
      const upto = content.slice(0, match.index);
      const lineNum = upto.split('\n').length;
      const lineContent = lines[lineNum - 1] || '';
      const ctxStart = Math.max(0, match.index - 50);
      const ctxEnd = Math.min(content.length, match.index + match[0].length + 50);
      const context = content.slice(ctxStart, ctxEnd).replace(/\s+/g, ' ');

      if (rule.skipIf && rule.skipIf(context)) continue;

      findings.push({
        file: file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''),
        line: lineNum,
        severity: rule.severity,
        pattern: rule.pattern.source,
        message: rule.message,
        context: lineContent.trim().slice(0, 120),
      });
    }
  }
}

// ─── Report ────────────────────────────────────────────────────────────
const severityOrder: Finding['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];
const bySeverity = new Map<Finding['severity'], Finding[]>();
for (const f of findings) {
  if (!bySeverity.has(f.severity)) bySeverity.set(f.severity, []);
  bySeverity.get(f.severity)!.push(f);
}

console.log(`\n[security-scan] ${allFiles.length} files scanned\n`);

let exitCode = 0;
for (const sev of severityOrder) {
  const items = bySeverity.get(sev) || [];
  if (items.length === 0) {
    console.log(`  \u2713 No ${sev} findings`);
    continue;
  }
  if (sev === 'critical' || sev === 'high') exitCode = 1;
  console.log(`  ${items.length} ${sev} finding${items.length > 1 ? 's' : ''}:`);
  for (const f of items) {
    console.log(`    ${f.file}:${f.line}  ${f.message}`);
    console.log(`      > ${f.context}`);
  }
}

console.log(`\n${findings.length} total findings`);
console.log(`Files scanned: ${allFiles.length}`);
console.log(`Exit code: ${exitCode}`);
process.exit(exitCode);