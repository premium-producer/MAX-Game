import fs from 'node:fs';
import path from 'node:path';

// Keep generated fixtures separate from runtime state, builds and task archives.
export function makeTestDirectory(prefix) {
  if (!/^[a-z0-9-]+$/.test(prefix)) throw new Error('Invalid test directory prefix');
  const root = path.resolve(import.meta.dirname, '../workspace/tests');
  fs.mkdirSync(root, {recursive: true});
  return fs.mkdtempSync(path.join(root, prefix + '-test-'));
}
