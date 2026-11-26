'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('game.html', 'utf8');
const js = fs.readFileSync('game.js', 'utf8');
const css = fs.readFileSync('game.css', 'utf8');
const dataSource = fs.readFileSync('game-data.js', 'utf8');

const sandbox = { window: {} };
vm.runInNewContext(dataSource, sandbox, { timeout: 1000 });
const questions = sandbox.window.HISTORY_GAME_QUESTIONS;

assert.ok(Array.isArray(questions), 'Question bank must be an array');
assert.ok(questions.length >= 40, `Expected at least 40 questions, found ${questions.length}`);

const ids = new Set();
for (const [index, question] of questions.entries()) {
  const label = `Question ${index + 1}`;
  assert.ok(question.id && typeof question.id === 'string', `${label}: id missing`);
  assert.ok(!ids.has(question.id), `${label}: duplicate id ${question.id}`);
  ids.add(question.id);
  for (const field of ['clue', 'hint', 'answer', 'explanation']) {
    assert.ok(typeof question[field] === 'string' && question[field].trim(), `${label}: ${field} missing`);
  }
  assert.ok(Array.isArray(question.choices), `${label}: choices must be an array`);
  assert.equal(question.choices.length, 4, `${label}: exactly four choices required`);
  assert.equal(new Set(question.choices).size, 4, `${label}: choices must be unique`);
  assert.ok(question.choices.includes(question.answer), `${label}: answer is not among choices`);
}

const requiredIds = [
  'screen-home', 'screen-play', 'screen-result', 'start-daily',
  'start-practice', 'answer-options', 'hint-button', 'next-button',
  'share-button', 'replay-button', 'home-button', 'best-score',
  'daily-score', 'streak-count'
];
for (const id of requiredIds) {
  assert.ok(html.includes(`id="${id}"`), `game.html missing required element #${id}`);
}
for (const src of ['game-data.js', 'game.js']) {
  assert.ok(html.includes(`src="${src}"`), `game.html does not load ${src}`);
}

const referencedIds = [...js.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
const missingIds = [...new Set(referencedIds.filter(id => !html.includes(`id="${id}"`)))];
assert.deepEqual(missingIds, [], 'game.js references missing HTML elements');

assert.ok(css.includes('@media (max-width: 520px)'), 'Mobile layout breakpoint missing');
assert.ok(js.includes('localStorage'), 'Local record storage missing');
assert.ok(js.includes('navigator.share'), 'Native sharing support missing');
assert.ok(js.includes('ROUND_SECONDS = 18'), '18-second timer setting missing');
assert.ok(js.includes('state.score - 20'), 'Hint penalty missing');

console.log(`PASS: ${questions.length} questions validated; page references, mobile styles and game features look consistent.`);
