# BOLD AI - workshop site

Beyond the Orthodox Learning & Design of AI. A single-page site for GitHub Pages.

## How it fits together

`index.html` is a thin shell - header, footer, canvas and the script/style links,
nothing more. At load it fetches the panels from `panels/` and drops them into
`<main>`, so **editing a panel changes the site with no build step**.

```
index.html            thin shell (header, footer, canvas); loads js/app.js
css/
  styles.css          all styles  (edit freely - no build)
panels/               one <section> per file (edit freely - no build)
  _order.json           order + labels; set "hidden": true to drop a panel
  hero.html  about.html  themes.html  cfp.html
  speakers.html  schedule.html  organizers.html  sponsors.html
backgrounds/          one cursor-field animation per file (the shuffle pool)
  _order.json           order the fields are bundled in
  swarm.js  limitcycle.js  network.js  automata.js  orbit.js  mouse.js
  lattice.js  ripple.js  comet.js  oscillators.js  crystal.js
js/
  engine.js           canvas engine + UI + panel loader (source; has //BACKGROUNDS marker)
  app.js              BUILT: engine.js with the backgrounds injected (loaded by index.html)
build.js              bundles js/engine.js + backgrounds/ -> js/app.js
```

## Editing

- **Panels** (`panels/*.html`) and **styles** (`css/styles.css`): edit and refresh.
  No build. `cfp` and `schedule` are `"hidden": true` in `panels/_order.json`;
  flip the flag to show them.
- **Background fields** (`backgrounds/*.js`) or the **engine** (`js/engine.js`):
  run `node build.js` (or `npm run build`) to regenerate `js/app.js`, then commit it.

## Previewing locally

Panels are fetched over http, so open the site through a server, not file://:

```
python3 -m http.server 8000     # then visit http://localhost:8000
```

GitHub Pages already serves over https, so the deployed site just works.
