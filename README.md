# LN Photos

Portfolio website for [@ln._photos](https://www.instagram.com/ln._photos/), automotive photography in New Brunswick, Canada.

Live site: https://notluvii.github.io/ln-photos/

## How the site is laid out

Each kind of work has its own page, styled after a different Apple product page:

| Page | Modelled on | What carries over |
|---|---|---|
| Home (`index.html`) | apple.com | Full-width tiles 12px apart, then a two-column grid of smaller tiles, a media carousel, then services, booking, about and contact |
| Car features (`work/features/`) | AirPods | Light page, a highlights gallery, "take a closer look" cards, and one colour chapter per car with a big centred headline |
| Events & shows (`work/events/`) | iPhone Pro | Black page, a chrome wordmark over a looping video, an immersive photo, keylined numbers and an "at a glance" grid |
| Editorial (`work/editorial/`) | iPad Pro | Black page, gradient headlines, posters side by side at one height, and one section per series |

Every project page follows the style of its category. Category and project pages have a product bar under the main bar that stays pinned while you scroll, with the booking button in it.

## What's in this repository

- `index.html`: home page.
- `work/index.html`: all projects, with category filters.
- `work/features/`, `work/events/`, `work/editorial/`: the three category pages.
- `work/<project>/index.html`: one page per project.
- `assets/site.css`: the whole visual system. Colour, type and spacing tokens are at the top, with a light theme and two dark ones (`t-iphone`, `t-ipad`). Breakpoints at 734, 1068 and 1440px, content 87.5% wide up to 1260px, section padding of 160, 128 and 96px, and a stepped type ramp where each size has its own line height and letter spacing.
- `assets/site.js`: interactions, with no dependencies: the mobile menu, staggered entrances, galleries with play/pause and dots, side-scrolling rows, media that opens to full width, the booking steps, lighting tabs, the events video, archive filters, the copy button and the photo viewer.
- `assets/wordmark.svg`, `assets/wordmark-dark.svg`: the LN Photos wordmark for dark and light pages (Archivo Extended, converted to outlines).
- `img/`: photographs in web sizes (`-sm`, `-lg`, and `-xl` when the original is large enough). Files named `<post>-NN-MM` join two carousel frames that form one panorama.
- `media/`: the short show-floor clip on the events page (muted, no audio track).
- `ASSET_MAP.md`: which photograph is used where, with its source and pixel sizes.

The site is static HTML, CSS and JavaScript, served by GitHub Pages from the `main` branch under `/ln-photos/`. Every path is relative, so it does not touch the site at the domain root. Interface text uses each device's system font. Where a slot changes shape on phones, it uses a second photograph of the same car rather than a tighter crop, so whole cars stay in frame. Posters are always shown whole.

When JavaScript is unavailable, everything is shown at once: galleries scroll by hand, the lighting chapter shows all three photographs, the video has its own controls and the viewer links open the full-size files. With reduced motion, nothing moves on its own, the video does not autoplay and entrances are fades only.

All photographs © LN Photos.
