(function () {
  'use strict';
  var doc = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------- header ---------- */
  var header = $('.site-header');
  if (header && !header.classList.contains('always-solid')) {
    var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  var menuBtn = $('.menu-btn');
  if (menuBtn) {
    var setMenu = function (open) {
      header.classList.toggle('nav-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', function () { setMenu(!header.classList.contains('nav-open')); });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('nav-open')) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---------- hero slideshow (pausable, off under reduced motion) ---------- */
  var hero = $('.hero');
  if (hero && $$('.hero-slide', hero).length > 1) {
    var slides = $$('.hero-slide', hero), dots = $$('.hero-dot', hero), pauseBtn = $('.hero-pause', hero);
    var capLink = $('#hero-cap-link'), capSub = $('#hero-cap-sub'), status = $('#hero-status');
    var MS = 7000, cur = -1, timer = null, paused = false;
    hero.style.setProperty('--hero-ms', MS + 'ms');
    var show = function (i, announce) {
      if (i === cur) return;
      slides.forEach(function (s, j) {
        var on = j === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        var img = s.querySelector('img'); if (img && on && img.loading === 'lazy') img.loading = 'eager';
      });
      dots.forEach(function (d, j) {
        d.classList.remove('is-active', 'is-done'); void d.offsetWidth;
        if (j < i) d.classList.add('is-done');
        if (j === i) d.classList.add('is-active');
        d.setAttribute('aria-current', j === i ? 'true' : 'false');
      });
      var s = slides[i];
      capLink.textContent = s.dataset.title; capLink.href = s.dataset.href; capSub.textContent = s.dataset.sub;
      if (announce && status) status.textContent = 'Slide ' + (i + 1) + ' of ' + slides.length + ': ' + s.dataset.title;
      cur = i;
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var start = function () { stop(); if (!paused) timer = setInterval(function () { if (!document.hidden) show((cur + 1) % slides.length); }, MS); };
    var setPaused = function (p) {
      paused = p;
      hero.classList.toggle('is-paused', p);
      pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
      pauseBtn.setAttribute('aria-pressed', String(p));
      if (p) stop(); else { var d = dots[cur]; d.classList.remove('is-active'); void d.offsetWidth; d.classList.add('is-active'); start(); }
    };
    dots.forEach(function (d, j) { d.addEventListener('click', function () { show(j, true); if (!paused) start(); }); });
    pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    show(0, false);
    if (reduceMQ.matches) { hero.classList.add('is-static'); setPaused(true); }
    else start();
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', function (e) { if (e.matches) { hero.classList.add('is-static'); setPaused(true); } });
  }

  /* ---------- filters (all projects) ---------- */
  var filterBar = $('.filters');
  if (filterBar) {
    var cards = $$('.work-grid .card'), live = $('#filter-status');
    var apply = function (f, btn) {
      $$('button', filterBar).forEach(function (x) { x.setAttribute('aria-pressed', String(x === btn)); });
      var n = 0;
      cards.forEach(function (c) { var show = f === 'all' || c.dataset.cat === f; c.classList.toggle('is-hidden', !show); if (show) n++; });
      if (live) live.textContent = 'Showing ' + n + (n === 1 ? ' project' : ' projects');
    };
    $$('button', filterBar).forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.filter, b); }); });
    var fromHash = function () { var h = (location.hash || '').slice(1), btn = h && $('button[data-filter="' + h + '"]', filterBar); if (btn) apply(h, btn); };
    fromHash(); window.addEventListener('hashchange', fromHash);
  }

  /* ---------- lightbox ---------- */
  var lb = null, lbImg, lbTitle, lbCount, lbLink, list = [], idx = 0, opener = null;
  var ICON = { prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>', next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>', close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' };
  function build() {
    lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<div class="lb-bar"><div class="lb-title"></div><button type="button" class="lb-btn lb-close" aria-label="Close photo viewer">' + ICON.close + '</button></div>' +
      '<div class="lb-stage"><img alt=""><button type="button" class="lb-btn lb-prev" aria-label="Previous photo">' + ICON.prev + '</button><button type="button" class="lb-btn lb-next" aria-label="Next photo">' + ICON.next + '</button></div>' +
      '<div class="lb-foot"><span class="lb-count tnum" aria-live="polite"></span><span class="lb-link"></span></div>';
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
    lbTitle.innerHTML = '';
    lbTitle.appendChild(document.createTextNode(a.dataset.title || ''));
    if (a.dataset.date) { var sp = document.createElement('span'); sp.textContent = a.dataset.date; lbTitle.appendChild(sp); }
    lbCount.textContent = pad(idx + 1) + ' / ' + pad(list.length);
    lbLink.innerHTML = a.dataset.project ? '<a href="' + a.dataset.project + '">View project</a>' : '';
    if (list.length > 1) [idx + 1, idx - 1].forEach(function (j) { var n = list[(j + list.length) % list.length]; var p = new Image(); p.src = n.getAttribute('href'); });
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
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault(); open(a.dataset.lightbox, a);
  });
  document.addEventListener('keydown', function (e) {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') go(idx + 1);
    else if (e.key === 'ArrowLeft') go(idx - 1);
    else if (e.key === 'Tab') {
      var f = $$('button:not([hidden]), a[href]', lb); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!lb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- copy handle ---------- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.dataset.copy;
      var done = function (t) { b.textContent = t; setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
      var selectIt = function () { var r = document.createRange(); r.selectNodeContents(b.previousElementSibling); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done('Copied'); }, selectIt);
      else selectIt();
    });
  });
})();
