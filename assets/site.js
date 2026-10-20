(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- header ---------- */
  var header = $('.site-header');
  if (header && !header.classList.contains('always-solid')) {
    var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  var menuBtn = $('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !header.classList.contains('nav-open');
      header.classList.toggle('nav-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { header.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- hero slideshow ---------- */
  var hero = $('.hero');
  if (hero) {
    var slides = $$('.hero-slide', hero), dots = $$('.hero-dots button', hero);
    var capT = $('#hero-cap-title'), capS = $('#hero-cap-sub');
    var mobile = window.matchMedia('(max-width: 700px)');
    var MS = 7000, cur = -1, timer = null;
    hero.style.setProperty('--hero-ms', MS + 'ms');
    var setCap = function (i) {
      var s = slides[i], m = mobile.matches;
      capT.textContent = m ? s.dataset.mTitle : s.dataset.dTitle;
      capS.textContent = m ? s.dataset.mSub : s.dataset.dSub;
    };
    var show = function (i) {
      if (i === cur) return;
      slides.forEach(function (s, j) { s.classList.toggle('is-active', j === i); s.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      dots.forEach(function (d, j) {
        d.classList.remove('is-active', 'is-done');
        void d.offsetWidth;
        if (j < i) d.classList.add('is-done');
        if (j === i) d.classList.add('is-active');
        d.setAttribute('aria-current', j === i ? 'true' : 'false');
      });
      cur = i; setCap(i);
    };
    var next = function () { show((cur + 1) % slides.length); };
    var start = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { if (!document.hidden) next(); }, MS); };
    dots.forEach(function (d, j) { d.addEventListener('click', function () { show(j); start(); }); });
    if (mobile.addEventListener) mobile.addEventListener('change', function () { setCap(cur); });
    show(0); start();
  }

  /* ---------- filters ---------- */
  var filterBar = $('.filters');
  if (filterBar) {
    var cards = $$('.work-grid .card');
    $$('button', filterBar).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.filter;
        $$('button', filterBar).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        cards.forEach(function (c) { c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f); });
      });
    });
  }

  /* ---------- justified galleries ---------- */
  function justify(grid) {
    var items = $$('.jitem', grid).map(function (el) { return { el: el, ar: (+el.dataset.w) / (+el.dataset.h) }; });
    var targetD = +(grid.dataset.target || 320), lastW = 0;
    function render() {
      var W = grid.clientWidth; if (!W || Math.abs(W - lastW) < 2) return; lastW = W;
      var gap = W < 600 ? 6 : 12, target = W < 600 ? Math.round(targetD * 0.52) : W < 1000 ? Math.round(targetD * 0.78) : targetD;
      grid.style.setProperty('--jgap', gap + 'px');
      var rows = [], acc = [], sum = 0;
      items.forEach(function (it) {
        acc.push(it); sum += it.ar;
        if (sum * target + gap * (acc.length - 1) >= W) { rows.push({ items: acc, sum: sum, full: true }); acc = []; sum = 0; }
      });
      if (acc.length) {
        var prev = rows[rows.length - 1];
        if (prev && sum * target < W * 0.5) { prev.items = prev.items.concat(acc); prev.sum += sum; }
        else rows.push({ items: acc, sum: sum, full: false });
      }
      var frag = document.createDocumentFragment();
      rows.forEach(function (r) {
        var row = document.createElement('div'); row.className = 'jrow';
        var h = r.full ? (W - gap * (r.items.length - 1)) / r.sum : target;
        r.items.forEach(function (it) {
          it.el.style.flex = it.ar + ' 1 0%';
          it.el.style.aspectRatio = it.el.dataset.w + '/' + it.el.dataset.h;
          var img = it.el.querySelector('img'); if (img) img.sizes = Math.ceil(it.ar * h) + 'px';
          row.appendChild(it.el);
        });
        if (!r.full) {
          var rest = (W - gap * r.items.length) / target - r.sum;
          if (rest > 0.05) { var f = document.createElement('span'); f.className = 'jfill'; f.style.flex = rest + ' 1 0%'; row.appendChild(f); }
        }
        frag.appendChild(row);
      });
      grid.textContent = ''; grid.appendChild(frag); grid.classList.add('is-justified');
    }
    render();
    if ('ResizeObserver' in window) new ResizeObserver(render).observe(grid);
    else window.addEventListener('resize', render);
  }
  $$('.jgrid').forEach(justify);

  /* ---------- lightbox ---------- */
  var lb = null, lbImg, lbTitle, lbCount, lbLink, list = [], idx = 0, opener = null;
  var ICON = { prev: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>', next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>', close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' };
  function build() {
    lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<div class="lb-bar"><div class="lb-title"></div><button type="button" class="lb-btn lb-close" aria-label="Close">' + ICON.close + '</button></div>' +
      '<div class="lb-stage"><img alt=""><button type="button" class="lb-btn lb-prev" aria-label="Previous photo">' + ICON.prev + '</button><button type="button" class="lb-btn lb-next" aria-label="Next photo">' + ICON.next + '</button></div>' +
      '<div class="lb-foot"><span class="lb-count tnum"></span><span class="lb-link"></span></div>';
    document.body.appendChild(lb);
    lbImg = $('img', lb); lbTitle = $('.lb-title', lb); lbCount = $('.lb-count', lb); lbLink = $('.lb-link', lb);
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { go(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { go(idx + 1); });
    $('.lb-stage', lb).addEventListener('click', function (e) { if (e.target === e.currentTarget) close(); });
    var sx = null, sy = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
      sx = null;
    }, { passive: true });
  }
  function go(i) {
    idx = (i + list.length) % list.length;
    var a = list[idx], src = a.getAttribute('href');
    lbImg.classList.add('is-loading');
    var pre = new Image();
    pre.onload = pre.onerror = function () { if (list[idx] === a) { lbImg.src = src; lbImg.classList.remove('is-loading'); } };
    pre.src = src;
    lbImg.alt = a.dataset.alt || '';
    lbTitle.innerHTML = (a.dataset.title || '') + (a.dataset.date ? '<span>' + a.dataset.date + '</span>' : '');
    lbCount.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
    lbLink.innerHTML = a.dataset.project ? '<a href="' + a.dataset.project + '">View project</a>' : '';
    [idx + 1, idx - 1].forEach(function (j) { var n = list[(j + list.length) % list.length]; var p = new Image(); p.src = n.getAttribute('href'); });
    var multi = list.length > 1; $('.lb-prev', lb).hidden = !multi; $('.lb-next', lb).hidden = !multi;
  }
  function open(group, el) {
    if (!lb) build();
    list = $$('[data-lightbox="' + group + '"]'); opener = el;
    lb.hidden = false; doc.classList.add('noscroll');
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    go(list.indexOf(el)); $('.lb-close', lb).focus({ preventScroll: true });
  }
  function close() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('is-open'); lb.hidden = true; doc.classList.remove('noscroll'); lbImg.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); open(a.dataset.lightbox, a);
  });
  document.addEventListener('keydown', function (e) {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(idx + 1);
    else if (e.key === 'ArrowLeft') go(idx - 1);
    else if (e.key === 'Tab') {
      var f = $$('button:not([hidden]), a', lb); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- copy handle ---------- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.dataset.copy, done = function (t) { b.textContent = t; setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done('Copied'); }, function () { done('Select'); });
      else done('Select');
    });
  });

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }
})();
