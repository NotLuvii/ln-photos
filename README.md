# LN Photos

Portfolio website for [@ln._photos](https://www.instagram.com/ln._photos/), automotive photography in New Brunswick, Canada.

Live site: https://notluvii.github.io/ln-photos/

## What's in this repository

- `index.html`: home page. It opens with a full-screen photograph that pulls back into a frame as you scroll, then the MX-5 lighting chapter, selected work, a short gallery, services and booking, about, and the inquiry section.
- `work/index.html`: all projects, with category filters.
- `work/<project>/index.html`: one page per project.
- `assets/site.css`: the whole visual system. Colour, type and spacing tokens are at the top.
- `assets/site.js`: interactions, with no dependencies. It covers the header and mobile menu, the hero's scroll effect, lighting tabs, archive filters, copy button, section reveals and the photo viewer.
- `assets/wordmark.svg`: the LN Photos wordmark (Archivo Extended, converted to outlines).
- `img/`: photographs in web sizes (`-sm`, `-lg`, and `-xl` when the original is large enough). Files named `<post>-NN-MM` join two carousel frames that form one panorama.
- `ASSET_MAP.md`: which photograph is used where on the home page, with its source and pixel sizes.

The site is static HTML, CSS and JavaScript, served by GitHub Pages from the `main` branch under `/ln-photos/`. Every path is relative, so it does not touch the site at the domain root. Interface text uses each device's system font. When JavaScript is unavailable, the hero stays a still full-screen photograph, the lighting chapter shows all three photographs and the viewer links open the full-size files. The hero also stays still when the device asks for reduced motion.

All photographs © LN Photos.
