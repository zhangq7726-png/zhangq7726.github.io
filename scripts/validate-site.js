'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');

const pages = ['index.html', 'personality.html', 'game.html', 'privacy.html'];
const content = Object.fromEntries(pages.map((file) => [file, fs.readFileSync(file, 'utf8')]));

assert.match(content['index.html'], /脑洞星球/);
assert.match(content['index.html'], /href="game\.html"/);
assert.match(content['index.html'], /href="personality\.html"/);
assert.match(content['index.html'], /href="privacy\.html"/);
assert.match(content['personality.html'], /id="start"/);
assert.match(content['personality.html'], /src="questions\.js"/);
assert.match(content['personality.html'], /src="profiles\.js"/);
assert.match(content['personality.html'], /src="app\.js"/);
assert.match(content['game.html'], /src="game-data\.js"/);
assert.match(content['game.html'], /src="game\.js"/);

for (const [file, html] of Object.entries(content)) {
  assert.match(html, /href="favicon\.svg"/, `${file}: favicon missing`);
  assert.match(html, /脑洞星球/, `${file}: brand name missing`);
  assert.doesNotMatch(html, /灵魂人物志/, `${file}: obsolete brand name remains`);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|#|mailto:|data:|blob:)/i.test(ref)) continue;
    const localPath = ref.split(/[?#]/)[0];
    assert.ok(fs.existsSync(localPath), `${file}: local reference not found: ${ref}`);
  }
}

assert.ok(fs.existsSync('portal.css'), 'Portal stylesheet missing');
assert.ok(fs.existsSync('styles.css'), 'Personality-test stylesheet missing');
assert.ok(fs.existsSync('game.css'), 'Game stylesheet missing');
console.log(`PASS: ${pages.length} pages, brand consistency and local references validated.`);
