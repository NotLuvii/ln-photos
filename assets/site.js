/* LN Photos, v5 interactions. No dependencies.
   Motion follows Apple's product pages (measured from apple.com/ca/airpods-pro): staggered entrances
   (30px rise over 0.7s, fade over 0.9s, 0.15s apart, easeInOutQuad, triggered at 85% of the window), a
   30px scroll parallax, media that opens from an inset card to full bleed, a highlights gallery that
   advances on its own with a pause control, and a hero that settles into a frame as you scroll.
   Each module is isolated so one failure can't take the others down. Per-frame work is transform, opacity
   or clip-path, set straight on the element that moves. Everything respects prefers-reduced-motion, and
   layouts that depend on this file fall back to static versions (html.no-js) if it doesn't start in 3s. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, body = d.body;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return reduceMQ.matches; };
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var listen = function (mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); };
  function run(name, fn) { try { fn(); } catch (err) { if (window.console) console.warn('[LN] ' + name + ' failed', err); } }
  /* if this file arrived after the 3s fallback switched the page to its static layout, keep that layout */
  var staticMode = html.classList.contains('no-js');

  /* iOS only shows :active press states when a touch listener exists */
  d.addEventListener('touchstart', function () {}, { passive: true });

  /* ---------- global navigation: mobile menu ---------- */
  run('header', function () {
    var header = $('.gnav'); if (!header) return;
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
    var wide = window.matchMedia('(min-width: 834px)');
    listen(wide, function () { if (wide.matches) setMenu(false); });
  });

  /* height of whichever bar is pinned to the top of the page */
  var pinnedBar = function () { var l = $('.lnav'); if (l) return l.offsetHeight; var g = $('.gnav'); return g ? g.offsetHeight : 0; };

  /* ---------- art direction: the viewer opens whichever photograph is on screen ---------- */
  run('swap', function () {
    $$('[data-swap-mq]').forEach(function (a) {
      var mq = window.matchMedia(a.getAttribute('data-swap-mq'));
      var get = function (p) { return { w: a.getAttribute(p + 'w'), h: a.getAttribute(p + 'h'), alt: a.getAttribute(p + 'alt') }; };
      var base = get('data-'), alt = get('data-swap-');
      base.href = a.getAttribute('href'); alt.href = a.getAttribute('data-swap-href');
      var sync = function () {
        var v = mq.matches ? alt : base;
        a.setAttribute('href', v.href); a.setAttribute('data-w', v.w); a.setAttribute('data-h', v.h);
        a.setAttribute('data-alt', v.alt); a.setAttribute('aria-label', 'View larger: ' + v.alt);
      };
      sync(); listen(mq, sync);
    });
  });

  /* ---------- staggered entrances ----------
     A group's items rise and fade in one after another once the group's top reaches 85% of the window.
     The timing lives in CSS; this only flips the class. Groups already above the window show at once. */
  run('stagger', function () {
    var groups = $$('[data-stagger]'); if (!groups.length) return;
    var own = function (g) { return $$('[data-stagger-item]', g).filter(function (it) { return it.closest('[data-stagger]') === g; }); };
    var show = function (g, instant) {
      if (g.classList.contains('stg-in')) return;
      var n = own(g).length;
      if (instant) g.classList.add('stg-done');
      g.classList.add('stg-in');
      setTimeout(function () { g.classList.add('stg-done'); }, Math.max(0, n - 1) * 150 + 950);
    };
    groups.forEach(function (g) {
      own(g).forEach(function (it, i) { it.style.setProperty('--i', i); });
      g.addEventListener('focusin', function () { show(g, true); });
    });
    if (staticMode || !('IntersectionObserver' in window)) { groups.forEach(function (g) { show(g, true); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
        else if (en.boundingClientRect.bottom < 0) { show(en.target, true); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    groups.forEach(function (g) { io.observe(g); });
    window.addEventListener('beforeprint', function () { groups.forEach(function (g) { show(g, true); }); });
  });

  /* ---------- scroll parallax: elements arrive 30px low (20px on tablets) and settle as they rise
     from the bottom of the window to 30% above the top ---------- */
  run('parallax', function () {
    var els = $$('[data-parallax]'); if (!els.length || staticMode) return;
    var medium = window.matchMedia('(max-width: 1068px) and (min-width: 735px)'), ticking = false;
    var frame = function () {
      ticking = false;
      if (reduced()) { els.forEach(function (el) { el.style.transform = ''; }); return; }
      var vh = window.innerHeight, amp = medium.matches ? 20 : 30;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top > vh || r.bottom < -vh * .3) return;
        var p = clamp((vh - r.top) / (vh * 1.3));
        el.style.transform = 'translate3d(0,' + (amp * (1 - p)).toFixed(2) + 'px,0)';
      });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    frame();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    listen(reduceMQ, req);
  });

  /* ---------- media that opens to full bleed ----------
     Starts inset by 6.25% of the window on each side with 28px corners, and opens as it rises into place
     (clip-path, so the photograph itself is never scaled). Settled once it is centred in the window. */
  run('expand', function () {
    var els = $$('[data-expand]'); if (!els.length || staticMode) return;
    var ticking = false;
    var frame = function () {
      ticking = false;
      var vh = window.innerHeight, vw = html.clientWidth, nav = pinnedBar();
      var radius = parseFloat(getComputedStyle(html).getPropertyValue('--r-lg')) || 28;
      els.forEach(function (el) {
        if (reduced()) { el.style.clipPath = ''; return; }
        var r = el.getBoundingClientRect();
        var end = Math.max(nav, (vh + nav - r.height) / 2), startAt = end + vh * .6;
        var p = clamp((r.top - end) / (startAt - end));
        el.style.clipPath = p > .002 ? 'inset(0 ' + (p * vw * .0625).toFixed(2) + 'px round ' + (p * radius).toFixed(2) + 'px)' : '';
      });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    frame();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    listen(reduceMQ, req);
  });

  /* ---------- highlights gallery ----------
     Cards snap to the centre. While the gallery is in view it advances every 5s (easeInOutQuad, 1s), the
     current dot filling as a timer; after the last card it stops and offers a replay. Any touch, scroll,
     dot or key press hands control to the reader. No autoplay with reduced motion. */
  run('gallery', function () {
    if (staticMode) return;
    $$('[data-gallery]').forEach(function (root) {
      var track = $('.hl-track', root), items = $$('.hl-item', root), dots = $$('.hl-dot', root);
      var play = $('.hl-play', root), pill = $('[data-pill]', root);
      if (!track || !items.length) return;
      var n = items.length, cur = 0, DWELL = 5000, MOVE = 1000;
      var playing = false, started = false, userStopped = false, inView = false, timer = null, startedAt = 0, remaining = DWELL, anim = null, scrollTick = false;
      root.style.setProperty('--hl-dwell', DWELL + 'ms');
      if (play) play.style.setProperty('--i', 0);
      $$('.hl-dots li', root).forEach(function (li, i) { li.style.setProperty('--i', i + 1); });

      var center = function (i) { var it = items[i]; return it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2; };
      var fromScroll = function () {
        var best = 0, bd = Infinity;
        items.forEach(function (it, i) { var dd = Math.abs(center(i) - track.scrollLeft); if (dd < bd) { bd = dd; best = i; } });
        return best;
      };
      var restartFill = function () {
        $$('.hl-dot-fill.is-run', root).forEach(function (f) { f.classList.remove('is-run'); });
        if (!playing) return;
        var f = $('.hl-dot-fill', dots[cur]); void f.offsetWidth; f.classList.add('is-run');
      };
      var setCurrent = function (i) {
        if (i === cur && dots[i].getAttribute('aria-current') === 'true') return;
        cur = i;
        dots.forEach(function (dt, j) { if (j === i) dt.setAttribute('aria-current', 'true'); else dt.removeAttribute('aria-current'); });
        restartFill();
      };
      var cancelAnim = function () { if (anim) cancelAnimationFrame(anim); anim = null; track.classList.remove('is-moving'); };
      var easeIO = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
      var goTo = function (i, smooth) {
        i = Math.max(0, Math.min(n - 1, i));
        var to = center(i), from = track.scrollLeft;
        cancelAnim(); setCurrent(i);
        if (!smooth || reduced() || Math.abs(to - from) < 2) { track.scrollLeft = to; return; }
        track.classList.add('is-moving');
        var t0 = performance.now();
        var step = function (now) {
          var t = Math.min(1, (now - t0) / MOVE);
          track.scrollLeft = from + (to - from) * easeIO(t);
          if (t < 1) anim = requestAnimationFrame(step); else { anim = null; track.classList.remove('is-moving'); }
        };
        anim = requestAnimationFrame(step);
      };

      var LABEL = { pause: 'Pause the gallery', play: 'Play the gallery', replay: 'Replay the gallery' };
      var setButton = function (s) { if (!play) return; play.setAttribute('data-state', s); play.setAttribute('aria-label', LABEL[s]); };
      var pauseClock = function () {
        if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(0, remaining - (performance.now() - startedAt)); }
        root.classList.add('is-paused');
      };
      var schedule = function () {
        clearTimeout(timer); timer = null;
        if (!playing) return;
        if (!inView || d.hidden) { root.classList.add('is-paused'); return; }
        root.classList.remove('is-paused');
        startedAt = performance.now();
        timer = setTimeout(advance, remaining);
      };
      var stop = function (s) {
        clearTimeout(timer); timer = null; playing = false; remaining = DWELL;
        root.classList.remove('is-playing', 'is-paused'); setButton(s); restartFill();
      };
      var advance = function () {
        timer = null; remaining = DWELL;
        if (cur >= n - 1) { stop('replay'); return; }
        goTo(cur + 1, true); schedule();
      };
      var start = function (fromStart) {
        if (reduced()) return;
        started = true; userStopped = false; playing = true; remaining = DWELL;
        root.classList.add('is-playing'); setButton('pause');
        if (fromStart && cur !== 0) goTo(0, true); else restartFill();
        schedule();
      };
      var takeOver = function () { if (playing) { stop('play'); userStopped = true; } };

      if (play) play.addEventListener('click', function () {
        var s = play.getAttribute('data-state');
        if (s === 'pause') { stop('play'); userStopped = true; }
        else start(s === 'replay');
      });
      dots.forEach(function (dt, i) { dt.addEventListener('click', function () { takeOver(); goTo(i, true); }); });
      ['pointerdown', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, takeOver, { passive: true }); });
      track.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) takeOver(); }, { passive: true });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); takeOver(); goTo(cur + (e.key === 'ArrowRight' ? 1 : -1), true); }
      });
      items.forEach(function (it, i) {
        var card = $('.hl-card', it);
        /* a card waiting at the side comes to the centre first; the centred card opens its project */
        card.addEventListener('click', function (e) { if (i !== cur) { e.preventDefault(); takeOver(); goTo(i, true); } });
        card.addEventListener('focus', function () { if (i !== cur) { takeOver(); goTo(i, true); } });
      });
      track.addEventListener('scroll', function () {
        if (anim || scrollTick) return; scrollTick = true;
        requestAnimationFrame(function () { scrollTick = false; if (!anim) setCurrent(fromScroll()); });
      }, { passive: true });
      window.addEventListener('resize', function () { cancelAnim(); track.scrollLeft = center(cur); });
      d.addEventListener('visibilitychange', function () { if (d.hidden) pauseClock(); else schedule(); });
      listen(reduceMQ, function () { if (reduced()) stop('play'); });
      setButton(reduced() ? 'play' : 'pause');

      if (!('IntersectionObserver' in window)) { if (pill) pill.classList.add('is-in'); return; }
      /* the control materialises as the gallery arrives; autoplay runs only while most of it is visible */
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { if (pill) pill.classList.add('is-in'); o.disconnect(); }
      }, { rootMargin: '0px 0px -15% 0px' }).observe(root);
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && !started && !userStopped) start(false);
        else if (inView) schedule();
        else pauseClock();
      }, { threshold: .6 }).observe(track);
    });
  });

  /* ---------- booking: the photograph follows the step in the middle of the window ---------- */
  run('steps', function () {
    if (staticMode || !('IntersectionObserver' in window)) return;
    $$('[data-steps]').forEach(function (root) {
      var steps = $$('.book-step', root), shots = $$('[data-step-media]', root);
      var set = function (i) {
        steps.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
        shots.forEach(function (m, j) { m.classList.toggle('is-active', j === i); });
      };
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) set(steps.indexOf(en.target)); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { io.observe(s); });
    });
  });

  /* ---------- video: plays muted while it is on screen, with a pause button; never on its own with reduced motion ---------- */
  run('video', function () {
    if (staticMode) return;
    $$('[data-video]').forEach(function (box) {
      var v = $('video', box), btn = $('.media-btn', box); if (!v || !btn) return;
      v.removeAttribute('controls');
      var userPaused = false, inView = false;
      var LABEL = { play: 'Play the video', pause: 'Pause the video' };
      var sync = function () { var s = v.paused ? 'play' : 'pause'; btn.setAttribute('data-state', s); btn.setAttribute('aria-label', LABEL[s]); };
      var tryPlay = function () { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { sync(); }); };
      btn.addEventListener('click', function () {
        if (v.paused) { userPaused = false; tryPlay(); } else { userPaused = true; v.pause(); }
      });
      v.addEventListener('play', sync); v.addEventListener('pause', sync);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          inView = es[0].isIntersecting;
          if (inView && !userPaused && !reduced()) tryPlay();
          else if (!inView && !v.paused) v.pause();
        }, { threshold: .5 }).observe(box);
      }
      listen(reduceMQ, function () { if (reduced() && !v.paused) { v.pause(); } });
      d.addEventListener('visibilitychange', function () { if (d.hidden && !v.paused) v.pause(); else if (!d.hidden && inView && !userPaused && !reduced()) tryPlay(); });
      sync();
    });
  });

  /* ---------- side-scrolling rows: previous / next buttons ---------- */
  run('scrollers', function () {
    $$('[data-scroller]').forEach(function (sc) {
      var btns = sc.nextElementSibling && sc.nextElementSibling.classList.contains('scroll-btns') ? $$('.scroll-btn', sc.nextElementSibling) : [];
      if (!btns.length) return;
      var update = function () {
        var max = sc.scrollWidth - sc.clientWidth - 2;
        btns[0].disabled = sc.scrollLeft <= 2; btns[1].disabled = sc.scrollLeft >= max;
      };
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var item = $('.bento', sc), step = item ? item.offsetWidth + 20 : sc.clientWidth * .8;
          sc.scrollBy({ left: step * +b.getAttribute('data-dir'), behavior: reduced() ? 'auto' : 'smooth' });
        });
      });
      sc.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
      window.addEventListener('resize', update); update();
    });
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
