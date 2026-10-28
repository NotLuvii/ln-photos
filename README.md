# LN Photos

Portfolio website for [@ln._photos](https://www.instagram.com/ln._photos/), automotive photography in New Brunswick, Canada.

Live site: https://notluvii.github.io/ln-photos/

## What's in this repository

- `index.html`: home page. A hero photograph with the introduction below it, a selected-work gallery, the MX-5 lighting chapter, selected work, a short gallery, services, how booking works, about, the inquiry section and a site index.
- `work/index.html`: all projects, with category filters.
- `work/<project>/index.html`: one page per project.
- `assets/site.css`: the whole visual system. Colour, type and spacing tokens are at the top. The layout follows the system on Apple's product pages: breakpoints at 734, 1068 and 1440px, content 87.5% wide up to 1260px, section padding of 160, 128 and 96px, and a stepped type ramp where each size has its own line height and letter spacing.
- `assets/site.js`: interactions, with no dependencies. It covers the header and mobile menu, the hero's scroll effect, staggered entrances, the selected-work gallery, media that opens to full width, the booking steps, lighting tabs, archive filters, copy button, section reveals and the photo viewer.
- `assets/wordmark.svg`: the LN Photos wordmark (Archivo Extended, converted to outlines).
- `img/`: photographs in web sizes (`-sm`, `-lg`, and `-xl` when the original is large enough). Files named `<post>-NN-MM` join two carousel frames that form one panorama.
- `ASSET_MAP.md`: which photograph is used where on the home page, with its source and pixel sizes.

The site is static HTML, CSS and JavaScript, served by GitHub Pages from the `main` branch under `/ln-photos/`. Every path is relative, so it does not touch the site at the domain root. Interface text uses each device's system font. Where a slot changes shape on phones, it uses a second photograph of the same car rather than a tighter crop, so whole cars stay in frame. When JavaScript is unavailable, everything is shown at once: the hero stays still, the gallery scrolls by hand, the lighting chapter shows all three photographs and the viewer links open the full-size files. With reduced motion, nothing moves on its own and entrances are fades only.

All photographs © LN Photos.
