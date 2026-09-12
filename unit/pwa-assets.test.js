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

function pngMetadata(file) {
  const data = fs.readFileSync(path.join(root, file));
  assert.ok(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
    bytes: data.length,
  };
}

test('PWA and Play Store icons have the required opaque raster sizes', () => {
  const icon192 = pngMetadata('public/icons/catvolution-192.png');
  const icon512 = pngMetadata('public/icons/catvolution-512.png');
  const maskable = pngMetadata('public/icons/catvolution-maskable-512.png');
  const storeIcon = pngMetadata('store-assets/play-store-icon-512.png');

  assert.deepEqual([icon192.width, icon192.height], [192, 192]);
  for (const icon of [icon512, maskable, storeIcon]) {
    assert.deepEqual([icon.width, icon.height], [512, 512]);
    assert.equal(icon.colorType, 2);
    assert.ok(icon.bytes <= 1024 * 1024);
  }
});

test('Play Store feature graphic and optimized in-game hero are prepared', () => {
  const feature = pngMetadata('store-assets/feature-graphic-1024x500.png');
  const hero = fs.statSync(path.join(root, 'public', 'art', 'catvolution-hero.jpg'));
  const overview = fs.readFileSync(path.join(root, 'src', 'ui', 'screens', 'OverviewScreen.tsx'), 'utf8');

  assert.deepEqual([feature.width, feature.height], [1024, 500]);
  assert.equal(feature.colorType, 2);
  assert.ok(hero.size < 300_000, 'hero should stay lightweight enough for the app shell');
  assert.match(overview, /import\.meta\.env\.BASE_URL\}art\/catvolution-hero\.jpg/);
});

test('service worker is versioned, scopes assets to the app, and is registered only in production', () => {
  const worker = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main.tsx'), 'utf8');

  assert.match(worker, /CACHE_PREFIX = 'catvolution-shell-'/);
  assert.match(worker, /CACHE_NAME = `\$\{CACHE_PREFIX\}v7`/);
  assert.match(worker, /key\.startsWith\(CACHE_PREFIX\)/);
  assert.match(worker, /self\.registration\.scope/);
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /caches\.match\(APP_ROOT\)/);
  assert.match(main, /'serviceWorker' in navigator && import\.meta\.env\.PROD/);
  assert.match(main, /import\.meta\.env\.BASE_URL/);
});

test('html links the web manifest with a relative path', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest" \/>/);
});

test('vite is configured for the GitHub Pages project path', () => {
  const viteConfig = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');

  assert.match(viteConfig, /base:\s*['"]\/pawlands-cat-colony-idle-game\/['"]/);
});

test('github pages workflow deploys the dist artifact from main', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');

  assert.match(workflow, /branches:\s*\n\s*-\s*main/);
  assert.match(workflow, /run:\s*npm install/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /path:\s*dist/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
});
