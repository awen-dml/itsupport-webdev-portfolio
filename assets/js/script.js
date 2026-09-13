/* ============================================================
   AWEN — IT Support & Web Developer
   script.js
   Berisi:
   1. Mobile navigation
   2. Header shadow saat scroll
   3. Active navigation state
   4. Reveal animation saat masuk viewport
   5. Theme toggle (light/dark)
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ----------------------------------------------------------
     1. Mobile navigation
     ---------------------------------------------------------- */
  var navToggle = doc.querySelector('.nav-toggle');
  var nav = doc.querySelector('#primary-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute(
        'aria-label',
        isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'
      );
    });

    // Tutup menu saat link diklik (mobile)
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Buka menu navigasi');
      }
    });

    // Tutup menu saat klik di luar
    doc.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || navToggle.contains(e.target)) return;
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ----------------------------------------------------------
     2. Header shadow saat scroll
     ---------------------------------------------------------- */
  var header = doc.querySelector('.site-header');
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 6);
    };
    onScrollHeader();
    window.addEventListener('scroll', onScrollHeader, { passive: true });
  }

  /* ----------------------------------------------------------
     3. Active navigation state (IntersectionObserver)
     ---------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    doc.querySelectorAll('.nav__link[href^="#"]')
  );

  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href').slice(1);
      return id ? doc.getElementById(id) : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var setActive = function (id) {
      navLinks.forEach(function (link) {
        var active = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', active);
        if (active) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        // Ambil section yang paling terlihat
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          });
        if (visible.length) setActive(visible[0].target.id);
      },
      {
        rootMargin: '-45% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    sections.forEach(function (sec) { sectionObserver.observe(sec); });
  }

  /* ----------------------------------------------------------
     4. Reveal animation saat masuk viewport
     ---------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));

  var prefersReduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (!revealEls.length) {
    /* no-op */
  } else if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ----------------------------------------------------------
     5. Theme toggle (light/dark)
     ---------------------------------------------------------- */
  var themeToggle = doc.querySelector('[data-theme-toggle]');
  var STORAGE_KEY = 'awen-theme';

  var applyTheme = function (theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      var isDark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'
      );
    }
  };

  var getStoredTheme = function () {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  };
  var setStoredTheme = function (theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { }
  };

  // Sinkronkan state tombol dengan tema awal
  applyTheme(root.getAttribute('data-theme') || 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setStoredTheme(next);
    });
  }

  /* ----------------------------------------------------------
     6. Smooth scroll (fallback untuk browser lama)
     ---------------------------------------------------------- */
  if (!('scrollBehavior' in root.style)) {
    doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id === '#') return;
        var target = doc.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          (parseInt(
            getComputedStyle(root).getPropertyValue('--header-h'),
            10
          ) || 64) -
          12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }
})();
