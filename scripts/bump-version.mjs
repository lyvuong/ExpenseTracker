#!/usr/bin/env node
// Bumps the minor version (1.4.0 -> 1.5.0) in package.json and package-lock.json,
// matching the Statements app. Run by .githooks/pre-commit so every commit
// carries a new version; also available as `npm run bump:minor`.
//
// Inside the hook, the staged copy is rewritten too (so the commit gets the new
// version) while any unrelated, unstaged edits to these files stay out of it.
//
// Set SKIP_VERSION_BUMP=1 to commit without bumping.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

if (process.env.SKIP_VERSION_BUMP === '1') process.exit(0);

const inHook = process.argv.includes('--staged');

const git = (args, input) =>
  execFileSync('git', args, { encoding: 'utf8', input, stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'inherit'] });

const bumpMinor = version => {
  const [major = 1, minor = 0] = String(version).split('.').map(Number);
  return `${Number.isNaN(major) ? 1 : major}.${Number.isNaN(minor) ? 1 : minor + 1}.0`;
};

// package.json: replace the top-level "version" value in place to keep formatting.
const setPackageVersion = (text, version) =>
  text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);

// package-lock.json: the root and packages[""] entries both carry the version.
const setLockVersion = (text, version) => {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lock = JSON.parse(text);
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  return JSON.stringify(lock, null, 2).replace(/\n/g, eol) + eol;
};

const isStaged = file => {
  try { git(['cat-file', '-e', `:${file}`]); return true; } catch { return false; }
};

const writeStaged = (file, text) => {
  const sha = git(['hash-object', '-w', '--stdin'], text).trim();
  git(['update-index', '--cacheinfo', `100644,${sha},${file}`]);
};

const current = JSON.parse(
  inHook ? git(['show', ':package.json']) : readFileSync('package.json', 'utf8')
).version || '1.0.0';
const next = bumpMinor(current);

const files = [
  ['package.json', setPackageVersion],
  ['package-lock.json', setLockVersion]
];

for (const [file, setVersion] of files) {
  if (inHook && isStaged(file)) writeStaged(file, setVersion(git(['show', `:${file}`]), next));
  if (existsSync(file)) writeFileSync(file, setVersion(readFileSync(file, 'utf8'), next));
}

console.log(`[version] ${current} -> ${next}`);
