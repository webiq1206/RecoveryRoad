/**
 * One-off: replace @/path and broken from '/path' imports with relative paths from each file.
 * Run from repo root: node scripts/rewrite-alias-imports.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.expo',
  'dist',
  '.expo-build-test',
  '.git',
]);

function walkTsFiles(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      walkTsFiles(p, out);
    } else if (/\.(tsx|ts)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

function toImportSpecifier(fromFile, targetPathNoExt) {
  const dir = path.dirname(fromFile);
  let rel = path.relative(dir, targetPathNoExt);
  rel = rel.split(path.sep).join('/');
  if (!rel || rel === '') return '.';
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function rewriteFile(absFile) {
  let content = fs.readFileSync(absFile, 'utf8');
  const before = content;

  // 1) @/foo/bar -> relative
  const aliasRe = /@\/([a-zA-Z0-9_./@-]+)/g;
  const seen = new Map();
  let m;
  while ((m = aliasRe.exec(before)) !== null) {
    const full = m[0];
    const sub = m[1];
    if (!seen.has(full)) {
      const target = path.join(ROOT, sub);
      seen.set(full, toImportSpecifier(absFile, target));
    }
  }
  for (const [from, to] of seen) {
    content = content.split(from).join(to);
  }

  // 2) from '/components/...' etc. (filesystem-root mistake)
  content = content.replace(
    /(from\s+)(['"])\/(components|constants|providers|hooks|utils|lib|core|features|stores|types)(\/[^'"]*)?\2/g,
    (_, prefix, q, rootSeg, rest) => {
      const relPath = `${rootSeg}${rest || ''}`;
      const target = path.join(ROOT, relPath);
      const spec = toImportSpecifier(absFile, target);
      return `${prefix}${q}${spec}${q}`;
    },
  );

  if (content !== before) {
    fs.writeFileSync(absFile, content);
    return 1;
  }
  return 0;
}

function main() {
  const files = walkTsFiles(ROOT);
  let n = 0;
  for (const f of files) {
    n += rewriteFile(f);
  }
  console.log(`Updated ${n} files (of ${files.length} scanned).`);
}

main();
