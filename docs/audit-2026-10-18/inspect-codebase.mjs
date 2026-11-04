import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';

const root = process.cwd();
const normalize = p => path.relative(root, p).replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const source = walk(path.join(root,'src'));
const scripts = walk(path.join(root,'scripts'));
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const {options} = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const graph = new Map();
const importedPackages = new Map();
for (const file of [...source,...scripts].filter(p=>/\.(?:[cm]?[jt]sx?|css)$/.test(p))) {
  const text = fs.readFileSync(file,'utf8');
  const specs=[];
  if(file.endsWith('.css')) {
    for(const m of text.matchAll(/@import\s+["']([^"']+)["']/g)) specs.push(m[1]);
  } else {
    const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
    const visit=node=>{
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)) specs.push(node.moduleSpecifier.text);
      if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||(ts.isIdentifier(node.expression)&&node.expression.text==='require'))&&node.arguments.length&&ts.isStringLiteral(node.arguments[0])) specs.push(node.arguments[0].text);
      ts.forEachChild(node,visit);
    };
    visit(ast);
  }
  const edges=[];
  for(const spec of specs) {
    let resolved=ts.resolveModuleName(spec,file,options,ts.sys).resolvedModule?.resolvedFileName;
    if(!resolved&&spec.startsWith('.')) {
      const local=path.resolve(path.dirname(file),spec);
      if(fs.existsSync(local)&&fs.statSync(local).isFile())resolved=local;
    }
    if(resolved&&!resolved.includes('node_modules'))edges.push(path.resolve(resolved));
    if(!spec.startsWith('.')&&!spec.startsWith('@/')&&!spec.startsWith('node:')){
      const pkg=spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];
      if(!importedPackages.has(pkg))importedPackages.set(pkg,[]);
      importedPackages.get(pkg).push(normalize(file));
    }
  }
  graph.set(file,edges);
}
const entries=source.filter(p=>/src[\\/]app[\\/].*[\\/](?:page|layout|loading|error|not-found|default|template|route|global-error|icon|apple-icon|opengraph-image|twitter-image|robots|sitemap|manifest)\.[jt]sx?$/.test(p)||/src[\\/]app[\\/](?:page|layout|loading|error|not-found|global-error|icon|robots|sitemap|manifest)\.[jt]sx?$/.test(p)||/src[\\/]proxy\.ts$/.test(p));
const reachable=new Set();
const mark=file=>{if(reachable.has(file))return;reachable.add(file);for(const edge of graph.get(file)||[])mark(edge);};
entries.forEach(mark);
const unreachable=source.filter(p=>/\.[jt]sx?$/.test(p)&&!reachable.has(p)).map(p=>({file:normalize(p),bytes:fs.statSync(p).size,importedBy:[...graph].filter(([,edges])=>edges.includes(p)).map(([file])=>normalize(file))}));
const publicFiles=walk(path.join(root,'public'));
const runtimeText=source.filter(p=>/\.(?:[jt]sx?|json|css)$/.test(p)).map(p=>fs.readFileSync(p,'utf8')).join('\n');
const unreferencedPublic=publicFiles.filter(p=>!runtimeText.includes(normalize(p).replace(/^public/,''))&&!runtimeText.includes(path.basename(p))).map(p=>({file:normalize(p),bytes:fs.statSync(p).size}));
const duplicateGroups=new Map();
for(const file of publicFiles){const h=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(!duplicateGroups.has(h))duplicateGroups.set(h,[]);duplicateGroups.get(h).push(normalize(file));}
const declared=JSON.parse(fs.readFileSync('package.json','utf8'));
const result={
  note:'Conservative static import graph including Next.js convention entry points, type imports and literal dynamic imports. Public-asset candidates require manual validation for generated URLs. No files deleted.',
  counts:{sourceFiles:source.length,entryPoints:entries.length,reachable:reachable.size,unreachableModules:unreachable.length},
  unreachable,
  unreferencedPublic,
  duplicatePublic:[...duplicateGroups.values()].filter(files=>files.length>1),
  packageImports:Object.fromEntries([...importedPackages].sort(([a],[b])=>a.localeCompare(b))),
  directRuntimeDependenciesWithoutImports:Object.keys(declared.dependencies).filter(p=>!importedPackages.has(p)),
  importedButNotDirect:[...importedPackages].filter(([p])=>!declared.dependencies[p]&&!declared.devDependencies[p]&&!['fs','path','url','crypto','perf_hooks','child_process'].includes(p)).map(([name,files])=>({name,files})),
  largestPublic:publicFiles.map(p=>({file:normalize(p),bytes:fs.statSync(p).size})).sort((a,b)=>b.bytes-a.bytes).slice(0,20),
};
fs.writeFileSync(process.argv[2] || 'docs/audit-2026-10-18/code-inventory.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({counts:result.counts,unreachable,unreferencedPublic:unreferencedPublic.filter(p=>!p.file.includes('/sites/')),duplicatePublic:result.duplicatePublic,unusedDependencies:result.directRuntimeDependenciesWithoutImports,importedButNotDirect:result.importedButNotDirect},null,2));
