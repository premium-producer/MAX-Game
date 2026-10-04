import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const sharedGroups = ['contracts', 'core', 'content', 'application', 'migration', 'development', 'adapters', 'client-runtime'];
async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, {withFileTypes:true}).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink forbidden: ${entry.name}`);
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(filename));
    else if (/\.(mjs|js)$/.test(entry.name)) files.push(filename);
  }
  return files;
}

/** Scoped to the new shared architecture. Historical renderers keep their old saves. */
export async function checkSharedBoundaries(sourceRoot = source) {
  const violations = [], files = [];
  for (const group of sharedGroups) files.push(...await walk(path.join(sourceRoot, group)));
  for (const filename of files) {
    const relative = path.relative(sourceRoot, filename).replaceAll('\\', '/');
    const group = relative.split('/')[0], text = await fs.readFile(filename, 'utf8');
    const imports = [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])([^'"]+)\1/g)].map(match => match[2]);
    const fail = message => violations.push({file:relative, message});
    if (['core', 'contracts', 'content'].includes(group)) {
      for (const dependency of imports) {
        const resolved = dependency.startsWith('.') ? path.relative(sourceRoot, path.resolve(path.dirname(filename), dependency)).replaceAll('\\', '/') : dependency;
        if (!['core/', 'contracts/', 'content/'].some(prefix => resolved.startsWith(prefix))) fail(`Pure layer imports forbidden dependency: ${dependency}`);
      }
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/(['"])(?:\\.|(?!\1)[^\\])*\1/g, '');
      if (/\b(?:window|document|localStorage|sessionStorage|requestAnimationFrame|setTimeout|setInterval|fetch|Date)\b/.test(code)) fail('Pure layer contains browser/network/clock access');
    }
    if (group === 'adapters') {
      for (const dependency of imports) if (/core\/|persistence|migration|node:/.test(dependency)) fail(`Adapter bypasses SessionPort: ${dependency}`);
      if (/\b(?:localStorage|sessionStorage|dispatchGameCommand|dispatchMissionCommand)\b|\.(?:completed|answers|receipts)\s*=/.test(text)) fail('Adapter owns progress/storage directly');
    }
  }
  return {ok:violations.length === 0, checked:files.length, violations};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkSharedBoundaries();
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
