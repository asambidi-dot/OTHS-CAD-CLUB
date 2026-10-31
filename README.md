# OTHS CAD Club website

The website for the OTHS CAD Club: a home page plus a privacy policy and terms and conditions,
built with React, Vite and plain CSS.

## Run it

```bash
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## Design

A black stage lit from above, with a slow starfield and floating geometric shapes in the hero,
pill-shaped controls and one accent colour (the club's mint).
Type is Instrument Sans throughout, self-hosted through Fontsource, so nothing loads from a font
CDN. The site sets no cookies and makes no requests to other sites.

Six components come from [React Bits](https://reactbits.dev) and live in
`src/components/reactbits/`, unmodified apart from dropping the Next.js-only `'use client'` line
(Galaxy has one more change, noted below):

| Component | Where it's used |
| --- | --- |
| `PillNav` | The floating navigation. Its dot follows the section in view; it folds into a menu on phones. |
| `LightRays` | The light falling over the hero, and rising behind the Join panel. |
| `Carousel` | The meeting photos. Its arrow icons come from Hugeicons (`@hugeicons/react`). |
| `Galaxy` | The white starfield behind the hero's light. It ignores the pointer and has no click warp or intro. |
| `BorderGlow` | The "What we do" cards: the edge nearest the pointer glows mint while you hover a card. |
| `DitherVeil` | The floating shapes in the hero: each is a mint dither of a rendered shape, with the full-colour render showing under the pointer. Uses `ogl`. |

The colours these components ship with are swapped for the site's own: BorderGlow's purple, pink
and blue border becomes mint, the Carousel's purple-tinted panels become neutral grey, and
DitherVeil draws mint-white dots on black instead of its default ink and paper.

Galaxy's cleanup no longer calls `loseContext()` on unmount. React's development Strict Mode
unmounts and remounts every component once, and the remount was left with a dead WebGL context
that drew a solid white hero. Its shaders and buffers are still deleted on unmount.

## Where to change things

| What | File |
| --- | --- |
| Discord invite and Instagram link (used everywhere) | `CLUB_LINKS` in `src/components/ClubSocialLinks.jsx` |
| All home page copy: facts, activities, process, FAQ | `src/data/club.js` |
| Meeting photos, their descriptions, and the three shown in the carousel | `meetingPhotos` and `featuredPhotos` in `src/data/club.js` |
| Navigation items (also the section order) | `navLinks` in `src/data/club.js` |
| Privacy policy and terms text, and their "Last updated" dates | `src/data/legal.js` |
| Colours, spacing and type | the tokens at the top of `src/styles.css` |
| Club logo | `src/components/ClubLogo.jsx` and `public/favicon.svg` |

If the logo changes, also replace `public/favicon-32.png` (32 × 32) and
`public/apple-touch-icon.png` (180 × 180), which are PNG copies of `favicon.svg` for browsers
and phones that don't use SVG icons.

Joining the club happens on Discord, and meeting times, rooms and announcements are posted
there, so every "Join" button opens the Discord invite. The site doesn't list meeting dates.

The privacy policy and terms are plain-language starting points written for this site. Have the
club advisor or school review them, and update the date in `src/data/legal.js` whenever the
text changes.

## Meeting photos

The photos live in `public/photos/`. Each one is saved as WebP at two widths, `<name>-640.webp`
and `<name>-1280.webp` (the photo's full width if it is narrower than 1280 pixels), with camera
metadata removed. The carousel shows the three listed in `featuredPhotos`; the "See all"
button, or a click on the middle photo, opens every photo in `meetingPhotos`.

To add a photo:

1. Blur any names or student ID numbers that can be read in it.
2. Save the two WebP sizes in `public/photos/`.
3. Add it to `meetingPhotos` with its full width, height and a short description (`alt`) of
   what is happening in it.

Only post photos of members who are happy to appear on the site. The privacy policy promises
that readable names and ID numbers are blurred, and that a photo comes down if someone in it asks.

## Hero shapes

The six shapes in `public/shapes/` (torus, cube, cone, puck, gem, pyramid) are Blender renders
on a pure black background, 800 pixels square. DitherVeil reads black as its ink, and the shapes
are screen-blended onto the hero, so the black disappears. To swap a shape, keep the same file
name and use a square image of one object on pure black. Desktops show all six, tablets four and
phones three; which ones appear where is set in `src/components/HeroShapes.jsx` and the
`.hero-shape-*` rules in `src/styles.css`.

## Project structure

```
index.html                   home page
privacy/index.html           privacy policy page
terms/index.html             terms and conditions page
public/                      favicon.svg, favicon-32.png, apple-touch-icon.png
public/photos/               meeting photos, two WebP sizes each
public/shapes/               the floating hero shapes, rendered on pure black
src/
  main.jsx                   entry for the home page
  legal.jsx                  entry for the privacy and terms pages
  App.jsx                    home page layout, in section order
  styles.css                 design tokens, layout and responsive rules
  data/club.js               all home page content
  data/legal.js              privacy policy and terms text
  hooks/                     useActiveSection (nav highlight), useMediaQuery
  components/
    Navigation.jsx           PillNav with the club mark
    Hero.jsx                 headline, starfield, light rays and the Discord button
    HeroShapes.jsx           the floating DitherVeil shapes around the headline
    About.jsx                short intro plus three facts
    Activities.jsx           "What we do" bento grid of BorderGlow cards
    Process.jsx              the four steps of designing a part
    Photos.jsx               meeting photos: carousel and full gallery
    Faq.jsx                  questions and answers
    Join.jsx                 closing panel with Discord and Instagram
    Footer.jsx               links, including the privacy policy and terms
    LegalPage.jsx            layout for the privacy and terms pages
    reactbits/               PillNav, LightRays, Carousel, Galaxy, BorderGlow and DitherVeil
    ClubLogo.jsx, ClubSocialLinks.jsx, Icons.jsx
```

`vite.config.js` lists all three HTML pages, so `npm run build` outputs `dist/index.html`,
`dist/privacy/index.html` and `dist/terms/index.html`.

## Accessibility and motion

- Semantic landmarks, a skip link, and visible focus rings on every control.
- Section links land below the floating nav (`scroll-padding-top`), including links from the
  privacy and terms pages back to a section of the home page.
- FAQ answers use native `<details>`, so they open with Enter or Space and screen readers
  announce them as expandable.
- Every photo has a written description. The carousel works with the arrow keys, and the full
  set opens in a native `<dialog>`: Escape closes it and focus goes back to where it was.
- No content fades or slides in on scroll. Two effects follow the pointer: the edge glow on the
  "What we do" cards and the colour reveal on the hero shapes. The starfield and light rays
  ignore it. Under `prefers-reduced-motion`, the light rays, stars and floating shapes hold
  still, the carousel jumps between photos instead of sliding, and transitions are instant.

## Deploy

The site is published to GitHub Pages by `.github/workflows/deploy.yml`: every push to `main`
builds it and deploys `dist/`. The workflow sets the base path to `/<repository-name>/`
automatically, so the site works at `https://<user>.github.io/<repository-name>/`.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`npm run build` alone outputs a static site in `dist/` that any static host can serve
(the club's Vercel project included).
