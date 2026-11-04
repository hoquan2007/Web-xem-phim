// ESLint plugins using minimatch 3 call the CommonJS export directly.
// Modern consumers use named exports. Both delegate to the patched engine.
const engine = require('minimatch-engine');

function legacyExport(api) {
  const evaluate = typeof api === 'function' ? api : api.minimatch;
  const match = (path, pattern, options) => evaluate(path, pattern, options);
  Object.assign(match, api);
  // import/no-internal-modules only consumes the returned object's test().
  // Matching stays in the bounded, nonrecursive engine instead of compiling
  // a legacy regular expression. This adapter is scoped to lint consumers.
  match.makeRe = (pattern, options) => ({
    test: path => evaluate(path, pattern, options),
  });
  match.defaults = options => legacyExport(api.defaults(options));
  return match;
}

module.exports = legacyExport(engine);
// Static assignments also expose named imports to native ESM consumers.
module.exports.minimatch = engine.minimatch;
module.exports.Minimatch = engine.Minimatch;
module.exports.filter = engine.filter;
module.exports.match = engine.match;
module.exports.braceExpand = engine.braceExpand;
module.exports.GLOBSTAR = engine.GLOBSTAR;
module.exports.sep = engine.sep;
