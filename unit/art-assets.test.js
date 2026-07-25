import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

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

test('derived UI kit pieces ship with the app (divider, rail, crest)', () => {
  for (const file of ['ui_divider.png', 'ui_rail.png', 'ui_shield.png']) {
    assert.ok(existsSync(join(root, 'src/ui/art', file)), `missing src/ui/art/${file}`);
  }
});

test('audited CC0 expedition art ships with provenance and license', () => {
  const expectedAssets = {
    'items/bone-charm.png': '9a7ad73bcf071f8c8300b3d284e16b8d92ceada0e458c3081e444748b26e604a',
    'items/crimson-shield.png': '0c2d12781364d0c1930ea60b8158c291d83a6272b8c7d0a4107e44aac0064a46',
    'items/short-sword.png': 'dbc37d53962b2644b262bf8074ead0632afb699cf02cdecc40ac8d10ed40eb40',
    'items/spirit-amulet.png': '089e652b969c865614423613a4b3bfd6ba9fa22a43b508dbaaf99b3171210227',
    'items/spirit-gem.png': '0495ed911b68a6d8fa1c6771895d7505ea98317b17f373940d5d0d529fc5531f',
    'zones/eclipse-tower.png': '20569db628e771da915a5e0b019b65de846d6ae5d4bdd9db2de837fca5d95805',
    'zones/grimalkin-ruins.png': '7c51ee54301ad62ab56a0734382aa8e389553c6e83cff253a41a2694a9f911ff',
    'zones/mistwood.png': '143c2e42c032439da57bc3e4a84e21b76efec181fa742345276d43dbcbff9730',
    'zones/soul-marsh.png': 'c9ec79ce54965c2ac828a85f385e30abb9e0cd2b6ff30739e8b54a62c700d006',
    'zones/whispering-fields.png': '8a5d4ad6324099ae490354305ffa669ed83d6203ccbe075319f3d25c926022a7',
  };

  for (const [file, expectedHash] of Object.entries(expectedAssets)) {
    const path = join(root, 'public/art/superpowers', file);
    assert.ok(
      existsSync(path),
      `missing public/art/superpowers/${file}`,
    );
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
    assert.equal(hash, expectedHash, `changed audited asset public/art/superpowers/${file}`);
  }

  const source = readFileSync(join(root, 'public/art/superpowers/SOURCE.md'), 'utf8');
  assert.match(source, /sparklinlabs\/superpowers-asset-packs/);
  assert.match(source, /e8674a03ab4456802f71f848c4df79eccca23f7a/);
  assert.match(
    source,
    /`zones\/soul-marsh\.png`\s*\|\s*`backgrounds\/backgrounds\/20\.png`/,
  );
  assert.match(
    source,
    /`zones\/eclipse-tower\.png`\s*\|\s*`backgrounds\/backgrounds\/36\.png`/,
  );

  const license = readFileSync(join(root, 'public/art/superpowers/LICENSE.txt'), 'utf8');
  assert.match(license, /CC0 1\.0 Universal/);
});

test('settings screen credits Vecteezy (free license requires attribution)', () => {
  const settings = readFileSync(join(root, 'src/ui/screens/SettingsScreen.tsx'), 'utf8');
  assert.match(settings, /vecteezy\.com/i);
  assert.match(settings, /Vetores por Vecteezy/);
});
