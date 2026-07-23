import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'ui', 'sprites', 'manifest.json'), 'utf8'),
);

test('sprite manifest lists at least one hero', () => {
  assert.ok(manifest.heroes && typeof manifest.heroes === 'object');
  assert.ok(Object.keys(manifest.heroes).length > 0);
});

test('every animation references an existing sheet with sane metadata', () => {
  for (const [hero, anims] of Object.entries(manifest.heroes)) {
    for (const [anim, meta] of Object.entries(anims)) {
      const where = `${hero}.${anim}`;
      assert.equal(typeof meta.src, 'string', `${where} src`);
      assert.ok(
        fs.existsSync(path.join(root, 'public', meta.src)),
        `${where} -> public/${meta.src} should exist`,
      );
      for (const key of ['frameWidth', 'frameHeight', 'frames', 'fps']) {
        assert.ok(
          Number.isFinite(meta[key]) && meta[key] > 0,
          `${where} ${key} should be a positive number`,
        );
      }
    }
  }
});
