#!/usr/bin/env node
/*
 * build.js — assembles js/app.js from js/engine.js + backgrounds/*.js.
 *
 * The panels do NOT need building: index.html fetches panels/ at runtime, so
 * editing a panel (panels/*.html) or the styles (css/styles.css) shows up on a
 * plain refresh. Re-run this ONLY after editing js/engine.js or a background
 * field in backgrounds/, then commit the regenerated js/app.js.
 *
 *   Run:  node build.js      (or: npm run build)
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const engine = rd('js/engine.js');
const order  = JSON.parse(rd('backgrounds/_order.json'));

// Background fields are concatenated into the engine's closure at the //BACKGROUNDS
// marker, so each backgrounds/*.js may use the shared engine scope (ctx, W, H, P...).
const bg = order.map(n => rd(`backgrounds/${n}.js`).replace(/\n+$/, '')).join('\n\n');

const out = engine.replace('  //BACKGROUNDS', () => bg);
fs.writeFileSync(path.join(ROOT, 'js/app.js'), out);
console.log(`built js/app.js (${out.length} bytes) - ${order.length} backgrounds`);
