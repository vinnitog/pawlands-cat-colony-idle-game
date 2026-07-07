import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('manifest is valid and references existing icons', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'manifest.webmanifest'), 'utf8'));

  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '.');
  assert.ok(Array.isArray(manifest.icons));

  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(root, 'public', icon.src)), `${icon.src} should exist`);
  }
});

test('html links the web manifest with a relative path', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest" \/>/);
});

test('vite is configured for the GitHub Pages project path', () => {
  const viteConfig = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');

  assert.match(viteConfig, /base:\s*['"]\/pawlands-cat-colony-idle-game\/['"]/);
});

test('github pages workflow deploys the dist artifact from develop', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');

  assert.match(workflow, /branches:\s*\n\s*-\s*develop/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /path:\s*dist/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
});
