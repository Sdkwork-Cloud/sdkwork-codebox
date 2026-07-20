import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
for (const target of ['dist', '.runtime/dev-sites']) {
  fs.rmSync(path.join(root, target), { force: true, recursive: true });
}
