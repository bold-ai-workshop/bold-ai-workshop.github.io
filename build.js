#!/usr/bin/env node
/*
 * build.js — bundles the modular source into a single deployable index.html.
 *
 *   Sources:
 *     template.html      page shell (head, styles, header, footer, engine JS)
 *                        with two markers:  <!--PANELS-->  and  //BACKGROUNDS
 *     panels/<name>.html one <section> per file (order + labels in panels/_order.json)
 *     backgrounds/<name>.js  one cursor-field per file (order in backgrounds/_order.json)
 *
 *   Run:  node build.js       ->  writes index.html
 *
 * GitHub Pages serves index.html directly; re-run this after editing any source file.
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const template   = rd('template.html');
const panelOrder = JSON.parse(rd('panels/_order.json'));
const bgOrder    = JSON.parse(rd('backgrounds/_order.json'));

// Panels — in document order; hidden ones are wrapped in an HTML comment so they
// stay in the source but don't render. Flip "hidden" in panels/_order.json to toggle.
const panelsBlock = panelOrder.map(({ file, label, hidden }) => {
  const body = rd(`panels/${file}.html`).replace(/\n+$/, '');
  return hidden
    ? `  <!-- ${label} (temporarily hidden)\n${body}\n  -->`
    : `  <!-- ${label} -->\n${body}`;
}).join('\n\n');

// Background fields — concatenated inside the canvas engine's closure, so each file
// may use the shared engine scope (ctx, W, H, P, colours, …). Order must precede MODES.
const bgBlock = bgOrder
  .map(name => rd(`backgrounds/${name}.js`).replace(/\n+$/, ''))
  .join('\n\n');

// Function replacements avoid `$`-pattern interpretation in the injected code.
const out = template
  .replace('  <!--PANELS-->', () => panelsBlock)
  .replace('  //BACKGROUNDS', () => bgBlock);

fs.writeFileSync(path.join(ROOT, 'index.html'), out);
console.log(`built index.html (${out.length} bytes) — ${panelOrder.length} panels, ${bgOrder.length} backgrounds`);
