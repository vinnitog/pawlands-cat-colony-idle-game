import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

test('derived vecteezy art ships with the app', () => {
  const expected = [
    'cat_mascot.png',
    'cat_knight_1.png',
    'cat_viking_1.png',
    'cat_king_1.png',
  ];
  for (const file of expected) {
    assert.ok(existsSync(join(root, 'public/art', file)), `missing public/art/${file}`);
  }
});

test('settings screen credits Vecteezy (free license requires attribution)', () => {
  const settings = readFileSync(join(root, 'src/ui/screens/SettingsScreen.tsx'), 'utf8');
  assert.match(settings, /vecteezy\.com/i);
  assert.match(settings, /Vetores por Vecteezy/);
});
