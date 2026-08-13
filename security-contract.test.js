'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const auth = fs.readFileSync('assets/auth.js', 'utf8');
const cfg = fs.readFileSync('assets/cfg.js', 'utf8');
const piano = fs.readFileSync('assets/piano.js', 'utf8');
const app = fs.readFileSync('assets/app.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.doesNotMatch(auth, /ADMIN_(?:USERNAME|EMAIL|PASSWORD)/);
assert.doesNotMatch(auth, /ensureAdmin\(\).*users\[/s);
assert.match(auth, /ITERATIONS = 210000/);
assert.match(auth, /length < 8/);
assert.doesNotMatch(cfg, /IG_TOKEN|GHP|secret/i);
assert.match(cfg, /externalWritesEnabled: false/);
assert.match(piano, /visibilitychange/);
assert.match(piano, /pagehide/);
assert.match(piano, /stopMic\(\)/);
assert.match(app, /imagegen:mic-stopped/);
assert.match(index, /Foreground Sound Listener/);
assert.doesNotMatch(index, /∞/);

console.log('secure Image Studio contract: ok');
