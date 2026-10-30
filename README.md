# LN Photos

Portfolio website for [@ln._photos](https://www.instagram.com/ln._photos/), automotive photography in New Brunswick, Canada.

Live site: https://notluvii.github.io/ln-photos/

## How the site is laid out

The whole site is dark. Each kind of work has its own page, styled after a different Apple product page:

| Page | Modelled on | What carries over |
|---|---|---|
| Home (`index.html`) | apple.com | Three full-width tiles, then four smaller tiles with one button each, a media carousel, then services, booking, about and contact |
| Car features (`work/features/`) | AirPods | A highlights gallery, "take a closer look" cards, and one colour chapter per car with a big centred headline |
| Events & shows (`work/events/`) | iPhone Pro | Black page, a chrome wordmark over a looping video, an immersive photo, keylined numbers and an "at a glance" grid |
| Editorial (`work/editorial/`) | iPad Pro | Black page, gradient headlines, posters side by side at one height, and one section per series |
| Over the years (`over-the-years/`) | iPad Pro | The whole Instagram history, oldest first: one chapter per year with a big gradient year, a strip of photos and that year's projects, plus the same shot edited in 2023 and again in 2025 |

Every project page follows the style of its category. Category and project pages have a product bar under the main bar that stays pinned while you scroll, with the booking button in it.

## What's in this repository

- `index.html`: home page.
- `work/index.html`: all projects, with category filters.
- `work/features/`, `work/events/`, `work/editorial/`: the three category pages.
- `over-the-years/index.html`: the year-by-year page.
- `work/<project>/index.html`: one page per project.
- `assets/site.css`: the whole visual system. Colour, type and spacing tokens are at the top, with a dark theme for each kind of page (`t-home`, `t-airpods`, `t-iphone`, `t-ipad`); the light theme is still defined but no page uses it. Breakpoints at 734, 1068 and 1440px, content 87.5% wide up to 1260px, section padding of 160, 128 and 96px, and a stepped type ramp where each size has its own line height and letter spacing.
- `assets/site.js`: interactions, with no dependencies: the mobile menu, staggered entrances, galleries with play/pause and dots, side-scrolling rows, media that opens to full width, the booking steps, lighting tabs, the events video, archive filters, the copy button and the photo viewer.
- `assets/wordmark.svg`, `assets/wordmark-dark.svg`: the LN Photos wordmark for dark and light pages (Archivo Extended, converted to outlines).
- `img/`: photographs in web sizes (`-sm`, `-lg`, and `-xl` when the original is large enough). Files named `<post>-NN` are frame NN of an Instagram post; `<post>-NN-MM` join two carousel frames that form one panorama.
- `media/`: the short show-floor clip on the events page (muted, no audio track).
- `ASSET_MAP.md`: which photograph is used where, with its source and pixel sizes.

The site is static HTML, CSS and JavaScript, served by GitHub Pages from the `main` branch under `/ln-photos/`. Every path is relative, so it does not touch the site at the domain root. Interface text uses each device's system font. Where a slot changes shape on phones, it uses a second photograph of the same car rather than a tighter crop, so whole cars stay in frame. Home tiles keep a narrow range of shapes as the window changes, and each photograph is positioned so the whole car stays in frame, centred under the text, across that range. Posters are always shown whole.

When JavaScript is unavailable, everything is shown at once: galleries scroll by hand, the lighting chapter shows all three photographs, the video has its own controls and the viewer links open the full-size files. With reduced motion, nothing moves on its own, the video does not autoplay and entrances are fades only.

All photographs © LN Photos.
