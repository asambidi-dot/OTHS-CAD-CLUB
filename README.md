# OTHS CAD Club website

A single-page site for the OTHS CAD Club, built with React, Vite and plain CSS.
The hero is a real 3D model (a cutaway planetary gearbox) built in Blender and shown with
React Three Fiber; the smaller illustrations are drawn in code as isometric SVG.

## Run it

```bash
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## 3D models (Blender → glTF)

Every model is generated procedurally in Blender, so it can be rebuilt or changed by editing a
script. The website only loads the exported files; it never needs Blender.

| File | What it is |
| --- | --- |
| `scripts/create_gearbox.py` | Builds the hero gearbox, checks the gear mesh, exports the GLB, bakes the studio HDR, renders the poster, saves the `.blend` |
| `scripts/create_project_models.py` | Builds the practice-project parts, exports their GLBs and renders gallery thumbnails |
| `scripts/cadkit.py` | Shared helpers (lathe, booleans, materials, export) used by both scripts |
| `assets/blender/oths-gearbox.blend` | Editable Blender scene for the hero (parts, materials, camera, softbox studio) |
| `public/models/oths-gearbox.glb` | Hero model: 59 named components with mechanism and explode data |
| `public/images/oths-gearbox-poster.webp` | Poster rendered from the viewer's opening camera |
| `public/env/studio-softbox.hdr` | The poster's softbox studio baked to an HDR, so the live model reflects the same lights |
| `public/models/projects/*.glb`, `public/images/projects/*.webp` | Project models and thumbnails |
| `src/data/gearboxSpec.js` | Hero configuration: asset paths, which controls to show, performance targets |

Rebuild from the project root (Blender 4.2+, tested with 5.2.3):

```bash
blender --background --factory-startup --python scripts/create_gearbox.py
blender --background --factory-startup --python scripts/create_project_models.py
```

`create_gearbox.py -- --no-render` skips the HDR and poster; `-- --views <folder>` also renders
front, back, side, top, underside and exploded inspection views.

### The gearbox

Module 1.5, 20° pressure angle: an 18-tooth sun, three 27-tooth planets and a fixed 72-tooth
ring (ring = sun + 2 × planet; (sun + ring) / 3 = 30, so three equally spaced planets mesh).
The input shaft drives the sun and the carrier drives the output, for a 5 : 1 reduction. The
script derives each planet's and the ring's tooth phase from the sun and fails the build if any
mesh interferes at twelve positions of the running mechanism, or if a shaft, bearing, spigot or
screw doesn't fit its hole.

Conventions shared with the viewer:

- Units are metres; Blender is Z-up and the exporter writes glTF Y-up. The gearbox axis is glTF Z.
- Rotating nodes carry `drive` (`input`, `carrier` or `planet`, plus an optional `drive_factor`
  for the bearing ball sets). The viewer turns them from the tooth counts on the `Gearbox` root
  node, so the motion follows the gear relationships rather than per-part speeds.
- Separating nodes carry `explode_axis` (glTF axes, parent space), `explode_distance` (metres) and
  `explode_order` (0 leaves first and returns last).
- `ViewCamera` stores the framing target and fill. The viewer refits the same vertices with the
  same algorithm, so the live model opens exactly where the poster was taken.

The viewer (`src/components/viewer/`) is React Three Fiber + drei, code-split so three.js only
loads after the page. It renders on demand (only while something moves), stops the mechanism's
render loop when the model is scrolled off screen, caps the pixel ratio at 1.5, and keeps the
poster if WebGL is unavailable or the model fails to load.

## Where to change things

| What | File |
| --- | --- |
| Discord invite and Instagram link (used everywhere) | `src/components/ClubSocialLinks.jsx` → `CLUB_LINKS` |
| Meeting recaps and photos | `src/data/meetings.js` |
| Activity cards, process steps, practice projects | `src/data/club.js` |
| Club logo | `src/components/ClubLogo.jsx` (header/footer) and `public/favicon.svg` |

Joining the club happens on Discord, and meeting times, rooms and announcements are posted
there, so every "Join the club" button opens the Discord invite. The site doesn't list
meeting dates.

## Log a meeting

1. Put the photos in `public/meetings/<date>/`, for example `public/meetings/2026-10-21/01.jpg`.
   Resize them to about 1600px on the long side first so the page stays fast.
2. Add an entry to `src/data/meetings.js`:

```js
{
  date: "2026-10-21",
  title: "Sketch workspace basics",
  type: "Lesson",
  summary: "One or two sentences about what the club did.",
  photos: [{ src: "meetings/2026-10-21/01.jpg", alt: "What the photo shows" }],
  links: [{ label: "Slides", href: "https://..." }],
},
```

Only `date` and `title` are required. Entries are sorted newest first; the three most recent
show by default with a "Show all" button, and photos open in a full-screen viewer.
Only post photos that everyone in them is comfortable sharing.

## Practice projects

The gallery shows **practice project concepts**, labeled as such on every card and dialog.
To add real member projects, edit the `projects` array in `src/data/club.js` and point each one at
a model and thumbnail (or a photo of the real part).

## Project structure

```
src/
  App.jsx                    page layout
  styles.css                 design tokens, layout and responsive rules
  cad.css                    shared drawing styles for the CAD artwork
  data/club.js               site content
  data/meetings.js           meeting log entries
  hooks/useActiveSection.js  highlights the current section in the nav
  lib/iso.js                 tiny isometric renderer (extrude, loft, shading, edges)
  components/
    ClubLogo.jsx             the club mark
    ClubSocialLinks.jsx      Discord/Instagram links and buttons
    IconFrame.jsx, Icons.jsx shared icon frame and 24-unit icons
    Navigation.jsx           compact floating header with mobile menu
    Hero.jsx                 headline + interactive 3D gearbox (CADHero3D)
    CADHero3D.jsx            lazy-loads the hero viewer, poster as placeholder
    viewer/                  ModelViewer (toolbar, keyboard, touch mode) and ViewerScene (three.js)
    Activities.jsx           glowing divider + four white cards
    About.jsx                CAD explainer + Imagine → Sketch → Model → Refine viewer
    Projects.jsx             filterable gallery + detail dialog
    MeetingLog.jsx           meeting recaps + photo viewer
    Join.jsx                 Discord-first community panel
    Footer.jsx
    cad/                     SVG illustrations (activity cards, process viewer)
```

## Accessibility and motion

- Semantic landmarks, a skip link, and visible focus rings on every control.
- Section links land below the fixed header (`scroll-padding-top`).
- The process viewer is a keyboard tablist (arrow keys, Home, End).
- Project details and meeting photos open in native `<dialog>`s: Escape or a backdrop click
  closes them, and ← / → step through items.
- The 3D viewer never moves on its own. Run, explode, wireframe, reset, rotate and zoom are real
  buttons; when the model has focus, arrow keys rotate, `+`/`−` zoom, Space runs or pauses the
  mechanism, `E` explodes, `W` toggles wireframe and `R` resets. On touch screens, page scrolling
  wins until you tap **Interact**.
- Exploding pauses the mechanism; it only runs again when the visitor asks.
- Under `prefers-reduced-motion`, transitions switch instantly and **Run** becomes **Step**,
  which turns the input shaft a quarter turn per press instead of animating.

## Deploy

The site is published to GitHub Pages by `.github/workflows/deploy.yml`: every push to `main`
builds it and deploys `dist/`. The workflow sets the base path to `/<repository-name>/`
automatically, so the site works at `https://<user>.github.io/<repository-name>/`.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`npm run build` alone outputs a static site in `dist/` that any static host can serve. For a host
that puts it in a subfolder, build with `npm run build -- --base=/that-folder/`.
