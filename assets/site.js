/* LN Photos, v4 interactions. No dependencies.
   Each module is isolated so one failure can't take the others down. Motion is transform/opacity only and
   always respects prefers-reduced-motion. Layouts that depend on this file fall back to static versions
   (html.no-js) if it doesn't start within 3s. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, body = d.body;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return reduceMQ.matches; };
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  function run(name, fn) { try { fn(); } catch (err) { if (window.console) console.warn('[LN] ' + name + ' failed', err); } }
  /* if this file arrived after the 3s fallback switched the page to its static layout, keep that layout */
  var staticMode = html.classList.contains('no-js');

  /* iOS only shows :active press states when a touch listener exists */
  d.addEventListener('touchstart', function () {}, { passive: true });

  /* ---------- header: hairline once content scrolls underneath; mobile menu ---------- */
  run('header', function () {
    var header = $('.site-header'); if (!header) return;
    var ticking = false;
    var onScroll = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { header.classList.toggle('is-scrolled', window.scrollY > 4); ticking = false; });
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    var btn = $('.menu-btn', header), links = $('#nav-links'); if (!btn || !links) return;
    var setMenu = function (open, returnFocus) {
      header.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (!open && returnFocus) btn.focus();
    };
    btn.addEventListener('click', function () { setMenu(!header.classList.contains('nav-open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('nav-open')) setMenu(false, true); });
    d.addEventListener('pointerdown', function (e) { if (header.classList.contains('nav-open') && !header.contains(e.target)) setMenu(false); });
    var wide = window.matchMedia('(min-width: 760px)');
    var onWide = function () { if (wide.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  });

  /* ---------- lighting tabs (WAI-ARIA tabs, automatic activation, crossfade) ---------- */
  run('tabs', function () {
    if (staticMode) return;
    $$('[data-tabs]').forEach(function (root) {
      var tabs = $$('[role="tab"]', root);
      var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
      var seg = $('.seg', root), thumb = $('.seg-thumb', root), cap = $('.lighting-caption', root);
      var cur = Math.max(0, tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }));
      var leaveTimer = null, capTimer = null;

      var placeThumb = function (instant) {
        if (!thumb) return;
        var t = tabs[cur];
        if (instant) thumb.style.transition = 'none';
        thumb.style.width = t.offsetWidth + 'px';
        thumb.style.height = t.offsetHeight + 'px';
        thumb.style.transform = 'translate(' + t.offsetLeft + 'px,' + t.offsetTop + 'px)';
        if (instant) { void thumb.offsetWidth; thumb.style.transition = ''; }
      };
      var setCaption = function (p) {
        if (!cap) return;
        var apply = function () {
          $('.lp-label', cap).textContent = p.getAttribute('data-label');
          $('.lc-text', cap).textContent = p.getAttribute('data-caption');
          cap.classList.remove('is-swapping');
        };
        clearTimeout(capTimer);
        if (reduced()) { apply(); return; }
        cap.classList.add('is-swapping'); capTimer = setTimeout(apply, 160);
      };
      var select = function (i, focus) {
        if (i === cur) { if (focus) tabs[i].focus(); return; }
        var prev = panels[cur], next = panels[i];
        tabs.forEach(function (t, j) { var on = j === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
        clearTimeout(leaveTimer);
        panels.forEach(function (p) { p.classList.remove('is-leaving'); });
        prev.classList.remove('is-active'); prev.classList.add('is-leaving'); prev.inert = true;
        next.classList.add('is-active'); next.inert = false;
        leaveTimer = setTimeout(function () { prev.classList.remove('is-leaving'); }, 460);
        cur = i; placeThumb(false); setCaption(next);
        if (focus) tabs[i].focus();
      };
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i); });
        t.addEventListener('keydown', function (e) {
          var n = tabs.length, j = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (cur + 1) % n;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (cur - 1 + n) % n;
          else if (e.key === 'Home') j = 0;
          else if (e.key === 'End') j = n - 1;
          if (j !== null) { e.preventDefault(); select(j, true); }
        });
      });
      panels.forEach(function (p, j) { if (j !== cur) p.inert = true; });

      /* horizontal swipe on the photograph changes the light; a tap still opens the viewer */
      var stage = $('.lighting-stage', root), sx = null, sy = null, swiped = false;
      stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; swiped = false; });
      stage.addEventListener('pointerup', function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
        if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = true; select((cur + (dx < 0 ? 1 : -1) + tabs.length) % tabs.length); }
      });
      stage.addEventListener('pointercancel', function () { sx = null; });
      stage.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false; } }, true);

      /* load all three photographs before the section is reached, so switching is instant */
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          if (es.some(function (x) { return x.isIntersecting; })) { $$('img', stage).forEach(function (im) { im.loading = 'eager'; }); io.disconnect(); }
        }, { rootMargin: '800px 0px' });
        io.observe(stage);
      }
      if (seg) seg.classList.add('is-ready');
      placeThumb(true);
      if ('ResizeObserver' in window) new ResizeObserver(function () { placeThumb(true); }).observe(seg);
      else window.addEventListener('resize', function () { placeThumb(true); });
    });
  });

  /* ---------- archive filters ---------- */
  run('filters', function () {
    var bar = $('.filters'); if (!bar) return;
    var cards = $$('.agrid .acard'), live = $('#filter-status');
    var apply = function (f, btn, announce) {
      $$('button', bar).forEach(function (x) { x.setAttribute('aria-pressed', String(x === btn)); });
      var n = 0;
      cards.forEach(function (c) { var show = f === 'all' || c.getAttribute('data-cat') === f; c.classList.toggle('is-hidden', !show); if (show) n++; });
      if (live && announce !== false) live.textContent = 'Showing ' + n + (n === 1 ? ' project' : ' projects');
    };
    $$('button', bar).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'); apply(f, b);
        if (history.replaceState) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      });
    });
    var fromHash = function () {
      var h = (location.hash || '').slice(1), btn = h && $('button[data-filter="' + h + '"]', bar);
      if (btn) apply(h, btn);
    };
    fromHash(); window.addEventListener('hashchange', fromHash);
  });

  /* ---------- copy the Instagram handle ---------- */
  run('copy', function () {
    $$('[data-copy]').forEach(function (btn) {
      var status = d.getElementById(btn.getAttribute('data-status') || ''), timer = null;
      var report = function (label, message, ok) {
        btn.textContent = label; btn.classList.toggle('is-done', !!ok);
        if (status) status.textContent = message;
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-done'); if (status) status.textContent = ''; }, 2600);
      };
      var fallback = function () {
        var el = btn.previousElementSibling, ok = false;
        if (el) { var r = d.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
        try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
        if (ok) report('Copied', 'Copied @ln._photos to the clipboard.', true);
        else report('Copy', 'Copying isn’t available here. The handle is selected: press Ctrl+C, or Command+C on a Mac.', false);
      };
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(function () { report('Copied', 'Copied @ln._photos to the clipboard.', true); }, fallback);
        } else fallback();
      });
    });
  });

  /* ---------- hero: scrolling pulls the full-screen photograph back into a rounded frame ----------
     Scroll-linked, so the scroll itself is the timing (linear). Only transform and opacity change per frame,
     set straight on each element. CSS decides whether it runs: the pin is only sticky when motion is allowed,
     the window is tall enough and container units exist. */
  run('hero', function () {
    var hero = $('.hero'), pin = hero && $('.hero-pin', hero); if (!pin) return;
    var fig = $('.hero-fig', pin), frame = $('.hero-frame', pin), intro = $('.hero-intro', pin), scrim = $('.hero-scrim', pin), cap = $('.hero-cap', pin);
    if (!fig || !frame || !intro || !scrim || !cap) return;
    var portraitMQ = window.matchMedia('(orientation: portrait)');
    var listen = function (mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); };
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

    /* the viewer opens the frame that is on screen */
    var attrs = function (p) {
      return { href: frame.getAttribute(p + 'href'), w: frame.getAttribute(p + 'w'), h: frame.getAttribute(p + 'h'), alt: frame.getAttribute(p + 'alt') };
    };
    var land = attrs('data-'), port = attrs('data-p-'); land.href = frame.getAttribute('href');
    function syncView() {
      var v = portraitMQ.matches && port.href ? port : land;
      frame.setAttribute('href', v.href); frame.setAttribute('data-w', v.w); frame.setAttribute('data-h', v.h);
      frame.setAttribute('data-alt', v.alt); frame.setAttribute('aria-label', 'View larger: ' + v.alt);
    }

    var on = false, start = 0, travel = 1, s1 = 1, dx1 = 0, dy1 = 0, radius = 28, capFrom = 0.8, last = -1, ticking = false, pending = false;
    function clear() {
      [frame, intro, scrim, cap].forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; el.style.visibility = ''; });
      frame.style.borderRadius = ''; cap.style.top = '';
    }
    function update() {
      ticking = false; if (!on) return;
      var q = clamp((window.scrollY - start) / travel);
      if (q === last) return; last = q;
      var s = 1 + (s1 - 1) * q, t = clamp(q / 0.4);
      frame.style.transform = 'translate3d(' + (dx1 * q).toFixed(2) + 'px,' + (dy1 * q).toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
      frame.style.borderRadius = (radius * q / s).toFixed(2) + 'px';   /* reads as the card radius once scaled */
      intro.style.opacity = (1 - t).toFixed(3);
      intro.style.transform = t ? 'scale(' + (1 + 0.06 * t).toFixed(4) + ')' : '';
      intro.style.visibility = t >= 1 ? 'hidden' : '';
      scrim.style.opacity = (1 - clamp(q / 0.6)).toFixed(3);
      cap.style.opacity = clamp((q - capFrom) / (1 - capFrom)).toFixed(3);
    }
    function measure() {
      pending = false;
      hero.classList.remove('is-static'); pin.style.top = '';
      on = !staticMode && getComputedStyle(pin).position === 'sticky';
      /* pin just below the header, even when large text makes the header taller */
      var head = $('.site-header'), top = head ? head.offsetHeight : 0;
      if (on && top) pin.style.top = top + 'px';
      /* very large text can make the introduction taller than the screen: then it stays a still hero */
      if (on && pin.offsetHeight > window.innerHeight - top + 2) { hero.classList.add('is-static'); pin.style.top = ''; on = false; }
      hero.classList.toggle('is-scroll-linked', on);
      last = -1;
      if (!on) { clear(); return; }
      /* the card the photo settles into: as large as fits with its caption, never wider than the site */
      var W = fig.clientWidth, H = fig.clientHeight, fw0 = frame.offsetWidth, fh0 = frame.offsetHeight, ar = fw0 / fh0;
      var gut = parseFloat(getComputedStyle(cap).paddingLeft) || 20, capH = cap.offsetHeight, gap = 14, pad = Math.max(gut, 24);
      var fw1 = Math.min(W - 2 * gut, 1680, (H - 2 * pad - gap - capH) * ar), fh1 = fw1 / ar;
      var x1 = (W - fw1) / 2, y1 = Math.max(pad, (H - fh1 - gap - capH) / 2);
      s1 = fw1 / fw0; dx1 = x1 - frame.offsetLeft; dy1 = y1 - frame.offsetTop;
      cap.style.top = Math.round(y1 + fh1 + gap) + 'px';
      /* the caption only fades in once the photo's bottom edge has moved clear of it (the edge moves linearly) */
      var b0 = frame.offsetTop + fh0, b1 = y1 + fh1;
      capFrom = b0 - b1 > 1 ? Math.min(0.94, clamp((b0 - b1 - gap + 4) / (b0 - b1))) : 0.8;
      radius = parseFloat(getComputedStyle(html).getPropertyValue('--r-lg')) || 28;
      start = hero.getBoundingClientRect().top + window.scrollY - top;
      travel = Math.max(1, hero.offsetHeight - pin.offsetHeight);
      update();
    }
    var remeasure = function () { if (!pending) { pending = true; requestAnimationFrame(measure); } };

    syncView(); measure();
    window.addEventListener('scroll', function () { if (on && !ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    listen(portraitMQ, function () { syncView(); remeasure(); });
    listen(reduceMQ, remeasure);
    /* keyboard: a control that is faded out is brought back into view before it takes focus */
    intro.addEventListener('focusin', function () { if (on && last > 0.2) window.scrollTo(0, start); });
    cap.addEventListener('focusin', function () { if (on && last < 1) window.scrollTo(0, start + travel); });
  });

  /* ---------- gentle entrance for section introductions ---------- */
  run('reveal', function () {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    window.addEventListener('beforeprint', function () { els.forEach(function (el) { el.classList.add('is-in'); }); });
  });

  /* ---------- photo viewer ---------- */
  run('viewer', function () {
    var triggers = $$('[data-lightbox]'); if (!triggers.length) return;
    var ICON = {
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
      next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
      chev: '<svg class="i-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5L8 6l-3.5 3.5"/></svg>'
    };
    var lb, img, title, count, link, status, prevBtn, nextBtn, closeBtn, stage;
    var list = [], idx = 0, label = 'photographs', opener = null, token = 0, loadTimer = null, inerted = [], anim = null, closing = false;

    function build() {
      lb = d.createElement('div');
      lb.className = 'lb'; lb.hidden = true;
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-labelledby', 'lb-title');
      lb.innerHTML =
        '<div class="lb-bar"><p class="lb-title" id="lb-title"></p>' +
        '<button type="button" class="lb-btn lb-close">' + ICON.close + '<span>Close</span></button></div>' +
        '<div class="lb-stage"><img class="lb-img" alt="" draggable="false"><div class="lb-status" role="status" aria-live="polite"></div></div>' +
        '<div class="lb-foot"><div class="lb-info"><p class="lb-count" aria-live="polite"></p><p class="lb-link"></p></div>' +
        '<div class="lb-nav"><button type="button" class="lb-btn lb-prev" aria-label="Previous photograph">' + ICON.prev + '</button>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Next photograph">' + ICON.next + '</button></div></div>';
      body.appendChild(lb);
      img = $('.lb-img', lb); title = $('.lb-title', lb); count = $('.lb-count', lb); link = $('.lb-link', lb);
      status = $('.lb-status', lb); prevBtn = $('.lb-prev', lb); nextBtn = $('.lb-next', lb); closeBtn = $('.lb-close', lb); stage = $('.lb-stage', lb);
      closeBtn.addEventListener('click', close);
      prevBtn.addEventListener('click', function () { go(idx - 1, -1); });
      nextBtn.addEventListener('click', function () { go(idx + 1, 1); });
      stage.addEventListener('click', function (e) { if (e.target === stage) close(); });
      /* swipe: left/right to move through the set, down to close */
      var sx = null, sy = null, st = 0;
      stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; st = Date.now(); });
      stage.addEventListener('pointerup', function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        else if (dy > 96 && Math.abs(dy) > Math.abs(dx) * 1.5 && Date.now() - st < 700) close();
      });
      stage.addEventListener('pointercancel', function () { sx = null; });
      window.addEventListener('resize', function () { if (!lb.hidden) fit(); });
    }

    /* the size the photograph will occupy: fits the stage, never above the large file's own size */
    function fit() {
      var a = list[idx]; if (!a) return;
      var w = +a.getAttribute('data-w') || 3, h = +a.getAttribute('data-h') || 2;
      var cs = getComputedStyle(stage);
      var bw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), bh = stage.clientHeight;
      var maxW = Math.min(w, 2000), s = Math.min(bw / w, bh / h, maxW / w);
      img.style.width = Math.round(w * s) + 'px'; img.style.height = Math.round(h * s) + 'px';
    }
    function thumbOf(a) {
      /* use the already-loaded thumbnail as a placeholder only if it has the same proportions as the large file
         (a phone may be showing a different frame inside <picture>) */
      var t = a.querySelector('img'); if (!t || !t.naturalWidth) return '';
      var w = +a.getAttribute('data-w') || 0, h = +a.getAttribute('data-h') || 0;
      if (w && h && Math.abs((t.naturalWidth / t.naturalHeight) / (w / h) - 1) > 0.03) return '';
      return t.currentSrc || t.src || '';
    }

    function setInert(on) {
      if (on) {
        inerted = Array.prototype.filter.call(body.children, function (el) { return el !== lb && el.tagName !== 'SCRIPT' && !el.inert; });
        inerted.forEach(function (el) { el.inert = true; });
      } else { inerted.forEach(function (el) { el.inert = false; }); inerted = []; }
    }

    function load(a, dir) {
      var my = ++token, src = a.getAttribute('href');
      clearTimeout(loadTimer); status.innerHTML = '';
      img.alt = a.getAttribute('data-alt') || '';
      var ph = thumbOf(a);
      img.classList.toggle('is-hidden', !ph);
      if (ph) img.src = ph;
      fit();
      if (dir && !reduced() && img.animate) img.animate([{ opacity: .35, transform: 'translateX(' + (dir * 18) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE });
      loadTimer = setTimeout(function () { if (my === token) status.innerHTML = '<span class="lb-spinner" aria-hidden="true"></span><span>Loading the photograph…</span>'; }, 320);
      var big = new Image();
      big.onload = function () { if (my !== token) return; clearTimeout(loadTimer); status.innerHTML = ''; img.src = src; img.classList.remove('is-hidden'); };
      big.onerror = function () {
        if (my !== token) return; clearTimeout(loadTimer);
        status.innerHTML = '<span>This photograph couldn’t be loaded.</span><span>Check your connection, then try the next one or close the viewer.</span>';
        if (!ph) img.classList.add('is-hidden');
      };
      big.src = src;
    }

    function describe() {
      var a = list[idx], n = list.length;
      title.textContent = a.getAttribute('data-title') || '';
      var dt = a.getAttribute('data-date');
      if (dt && title.textContent.indexOf(dt) === -1) { var sp = d.createElement('span'); sp.textContent = dt; title.appendChild(sp); }
      count.textContent = n > 1 ? (idx + 1) + ' of ' + n + ' ' + label : '';
      var proj = a.getAttribute('data-project');
      link.innerHTML = proj ? '<a href="' + proj + '">View the project' + ICON.chev + '</a>' : '';
      var multi = n > 1; prevBtn.hidden = !multi; nextBtn.hidden = !multi;
      if (multi) [idx + 1, idx - 1].forEach(function (j) { var p = new Image(); p.src = list[(j + n) % n].getAttribute('href'); });
    }

    function go(i, dir) { if (!list.length) return; idx = (i + list.length) % list.length; describe(); load(list[idx], dir); }

    function rectOf(a) { var t = a && a.querySelector('img'); if (!t) return null; var r = t.getBoundingClientRect(); return (r.width && r.bottom > 0 && r.top < innerHeight) ? r : null; }
    function zoom(from, forward) {
      /* animate between the source thumbnail and the viewer, so the photograph appears to grow from where it was */
      var to = img.getBoundingClientRect();
      if (!from || !to.width || reduced() || !img.animate) return null;
      var s = Math.max(from.width / to.width, from.height / to.height);
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2), dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      var a = { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: .6 }, b = { transform: 'none', opacity: 1 };
      return img.animate(forward ? [a, b] : [b, a], { duration: forward ? 440 : 300, easing: forward ? EASE : 'cubic-bezier(.4,0,.6,1)', fill: 'both' });
    }

    function open(group, a) {
      if (!lb) build();
      if (anim) { anim.cancel(); anim = null; }
      closing = false;
      list = $$('[data-lightbox="' + group + '"]').filter(function (x) { return x.offsetParent !== null || x === a; });
      label = a.getAttribute('data-lb-label') || 'photographs';
      idx = Math.max(0, list.indexOf(a)); opener = a;
      lb.hidden = false; html.classList.add('noscroll'); setInert(true);
      describe(); load(a, 0);
      void lb.offsetWidth; lb.classList.add('is-open');
      anim = zoom(rectOf(a), true);
      if (anim) anim.onfinish = function () { anim.cancel(); anim = null; };
      closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!lb || lb.hidden || closing) return;
      closing = true; token++; clearTimeout(loadTimer);
      var target = list[idx] && list[idx] !== opener && list[idx].offsetParent ? list[idx] : opener;
      if (anim) { anim.cancel(); anim = null; }
      var done = function () {
        lb.hidden = true; lb.classList.remove('is-open'); html.classList.remove('noscroll'); setInert(false);
        img.removeAttribute('src'); img.style.width = img.style.height = ''; status.innerHTML = ''; closing = false;
        if (opener && opener.focus) opener.focus({ preventScroll: true });
      };
      lb.classList.remove('is-open');
      var out = zoom(rectOf(target), false);
      if (out) { anim = out; out.onfinish = function () { anim = null; done(); }; }
      else setTimeout(done, reduced() ? 0 : 260);
    }

    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-lightbox]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      e.preventDefault(); open(a.getAttribute('data-lightbox'), a);
    });
    d.addEventListener('keydown', function (e) {
      if (!lb || lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight' && list.length > 1) { e.preventDefault(); go(idx + 1, 1); }
      else if (e.key === 'ArrowLeft' && list.length > 1) { e.preventDefault(); go(idx - 1, -1); }
      else if (e.key === 'Tab') {
        var f = $$('button:not([hidden]), a[href]', lb); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (!lb.contains(d.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  });

  window.LN_READY = true;
})();
