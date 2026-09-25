# BOLD AI — workshop site

Beyond the Orthodox Learning & Design of AI. A single-page site deployed with GitHub Pages.

## Structure

The deployed page is **`index.html`**, which is **generated** — don't edit it by hand.
Edit the modular source and rebuild:

```
template.html          page shell: <head>, styles, header/nav, footer, canvas engine.
                       Contains two injection markers: <!--PANELS--> and //BACKGROUNDS
panels/                one <section> per file
  _order.json          panel order + labels; set "hidden": true to comment a panel out
  hero.html  about.html  themes.html  cfp.html
  speakers.html  schedule.html  organizers.html  sponsors.html
backgrounds/           one cursor-field animation per file (the shuffle pool)
  _order.json          order the fields are concatenated in
  swarm.js  limitcycle.js  network.js  automata.js  orbit.js  mouse.js
  lattice.js  ripple.js  comet.js  oscillators.js  crystal.js
build.js               bundler: template + panels + backgrounds -> index.html
```

## Build

```
node build.js        # or: npm run build
```

Re-run after editing any source file, then commit the regenerated `index.html`.

## Notes

- Background fields are concatenated *inside* the canvas engine's closure, so each
  `backgrounds/*.js` file may use the shared engine scope (ctx, W, H, P, colours…).
- `cfp` and `schedule` panels are currently `"hidden": true` in `panels/_order.json`
  (kept in source, commented out of the built page).
