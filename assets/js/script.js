/* ============================================================
   AWENDEV.ONLINE — SCROLL STORY & PRELOADER (v2 — Optimized)
   ============================================================
   Perubahan utama dari v1:
   - Semua 40 frame di-preload SEKALI di awal, progress bar terhubung nyata
   - Tinting frame dilakukan saat preload (bukan saat scroll) → animasi instan
   - Cache warna theme (getComputedStyle dipanggil 1x, bukan tiap draw)
   - Cache semua frame, tidak evict agresif
   - Ganti tema: reprocess chunked, tidak freeze
   - Config terpusat: FRAME_COUNT, FRAME_EXT, FRAME_SIZE
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ----------------------------------------------------------
     KONFIGURASI — ubah di sini jika perlu
     ---------------------------------------------------------- */
  var FRAME_COUNT = 40;
  var FRAME_EXT   = 'png';           // 'webp' (disarankan) atau 'png'
  var FRAME_PATH  = 'assets/frames/'; // trailing slash wajib
  var FRAME_SIZE  = 768;              // ukuran internal canvas processing (px)
  var LOADER_SAFETY_TIMEOUT = 15000;  // ms — paksa dismiss jika stuck

  /* ----------------------------------------------------------
     Theme color cache — dipanggil 1x saat init & saat ganti tema
     ---------------------------------------------------------- */
  var themeColors = {
    paper: '#ffffff',
    earth: '#8b7355',
    ink: { r: 26, g: 26, b: 26 } // --color-charcoal di-parse ke RGB
  };

  function refreshThemeColors() {
    var s = getComputedStyle(root);
    themeColors.paper = s.getPropertyValue('--color-paper').trim() || '#ffffff';
    themeColors.earth = s.getPropertyValue('--color-earth').trim() || '#8b7355';
    var charcoal = s.getPropertyValue('--color-charcoal').trim() || '#1a1a1a';

    var temp = doc.createElement('canvas').getContext('2d');
    if (temp) {
      temp.fillStyle = charcoal;
      temp.fillRect(0, 0, 1, 1);
      var d = temp.getImageData(0, 0, 1, 1).data;
      themeColors.ink = { r: d[0], g: d[1], b: d[2] };
    }
  }

  /* ----------------------------------------------------------
     Preloader
     ---------------------------------------------------------- */
  var loaderEl    = doc.getElementById('site-loader');
  var loaderBarEl = loaderEl && loaderEl.querySelector('.loader__bar');
  var loaderSubEl = loaderEl && loaderEl.querySelector('.loader__sub');

  function setLoaderProgress(ratio) {
    var clamped = Math.max(0, Math.min(1, ratio));
    if (loaderBarEl) {
      // Hentikan animasi CSS (jika ada) agar width yang kita set terlihat
      loaderBarEl.style.animation = 'none';
      loaderBarEl.style.transition = 'width 0.25s ease';
      loaderBarEl.style.width = (clamped * 100) + '%';
      // Juga set CSS var untuk konsumen yang mungkin mengandalkannya
      loaderBarEl.style.setProperty('--loader-progress', clamped);
    }
    if (loaderSubEl) {
      if (clamped < 0.7) {
        loaderSubEl.textContent = 'MEMUAT ANIMASI...';
      } else if (clamped < 1) {
        loaderSubEl.textContent = 'MEMPROSES ANIMASI...';
      } else {
        loaderSubEl.textContent = 'SIAP';
      }
    }
  }

  function dismissLoader() {
    if (loaderEl && !loaderEl.classList.contains('is-loaded')) {
      loaderEl.classList.add('is-loaded');
    }
  }

  // Safety fallback — jika ada yang macet, tetap dismiss
  setTimeout(dismissLoader, LOADER_SAFETY_TIMEOUT);

  /* ----------------------------------------------------------
     Theme toggle (didaftarkan lebih awal)
     ---------------------------------------------------------- */
  var themeToggle = doc.querySelector('[data-theme-toggle]');
  var STORAGE_KEY = 'awen-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  }

  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) applyTheme(stored);
  } catch (e) {}

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  /* ----------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------- */
  var navToggle = doc.querySelector('.nav-toggle');
  var nav = doc.querySelector('#primary-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ----------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------- */
  var revealEls = doc.querySelectorAll('.reveal, .section-editorial .contact-finale');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        var target = entry.target;
        if (target.closest('#home')) {
          if (entry.isIntersecting) {
            target.classList.add('is-visible');
            obs.unobserve(target);
          }
          return;
        }
        target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ----------------------------------------------------------
     Hero frame animation
     ---------------------------------------------------------- */
  var canvasWrap  = doc.getElementById('hero-canvas');
  var visualLayer = canvasWrap && canvasWrap.parentNode;
  var hero        = doc.getElementById('home');
  var work        = doc.getElementById('work');

  if (!canvasWrap || !visualLayer || !hero || !work) {
    dismissLoader();
    return;
  }

  var context = canvasWrap.getContext('2d', { alpha: true });
  if (!context) {
    console.warn('Hero frame animation disabled: 2D context unavailable.');
    dismissLoader();
    return;
  }

  var frameCache   = {};   // index 1..N -> { canvas, source }
  var currentFrame = 1;
  var canvasLogicalWidth = 0;
  var canvasLogicalHeight = 0;
  var scrollQueued = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var preloadDone = false;

  var initialRect = visualLayer.getBoundingClientRect();
  var originalRect = {
    left: initialRect.left,
    top: initialRect.top + window.scrollY,
    width: initialRect.width,
    height: initialRect.height
  };

  // Pindahkan visualLayer ke body (fixed) dan sisipkan placeholder
  var placeholder = doc.createElement('div');
  placeholder.className = 'hero__3d-placeholder';
  visualLayer.parentNode.replaceChild(placeholder, visualLayer);
  doc.body.appendChild(visualLayer);

  visualLayer.style.position = reduceMotion ? 'absolute' : 'fixed';
  visualLayer.style.zIndex = '1';
  visualLayer.style.pointerEvents = 'none';
  visualLayer.style.transformOrigin = '50% 50%';
  visualLayer.style.left   = originalRect.left + 'px';
  visualLayer.style.top    = (reduceMotion ? originalRect.top : originalRect.top - window.scrollY) + 'px';
  visualLayer.style.width  = originalRect.width + 'px';
  visualLayer.style.height = originalRect.height + 'px';
  canvasWrap.style.width = '100%';
  canvasWrap.style.height = '100%';

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function smoothStep(v) {
    var t = clamp(v, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function pad3(n) {
    return n < 10 ? '00' + n : (n < 100 ? '0' + n : '' + n);
  }

  function getDocumentRect(el) {
    var rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  }

  function getFrameUrl(index) {
    return FRAME_PATH + 'frame_' + pad3(index) + '.' + FRAME_EXT;
  }

  /* ----------------------------------------------------------
     Frame processing (tinting berdasarkan luminance)
     ---------------------------------------------------------- */
  function processFrame(image) {
    var source = doc.createElement('canvas');
    source.width = FRAME_SIZE;
    source.height = FRAME_SIZE;
    var sctx = source.getContext('2d', { willReadFrequently: true });
    if (!sctx) return null;
    sctx.drawImage(image, 0, 0, FRAME_SIZE, FRAME_SIZE);

    var processed = doc.createElement('canvas');
    processed.width = FRAME_SIZE;
    processed.height = FRAME_SIZE;
    var pctx = processed.getContext('2d', { willReadFrequently: true });
    if (!pctx) return null;
    pctx.drawImage(source, 0, 0);

    var pixels = pctx.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE);
    var data = pixels.data;
    var ink = themeColors.ink;
    var r = ink.r, g = ink.g, b = ink.b;

    for (var i = 0; i < data.length; i += 4) {
      var lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      var alpha = (0.97 - lum) / 0.24;
      if (alpha < 0) alpha = 0;
      else if (alpha > 1) alpha = 1;
      data[i]     = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = (data[i + 3] * alpha) | 0; // bitwise trunc — lebih cepat dari Math.round
    }
    pctx.putImageData(pixels, 0, 0);
    return processed;
  }

  /* ----------------------------------------------------------
     Preload semua frame (Image object)
     ---------------------------------------------------------- */
  function preloadAllFrames() {
    return new Promise(function (resolve) {
      var images = new Array(FRAME_COUNT);
      var settled = 0;

      function onSettled() {
        settled++;
        setLoaderProgress((settled / FRAME_COUNT) * 0.7); // 0–70%
        if (settled >= FRAME_COUNT) resolve(images);
      }

      for (var i = 0; i < FRAME_COUNT; i++) {
        (function (index) {
          var img = new Image();
          img.decoding = 'async';
          img.onload  = function () {
            images[index] = img;
            onSettled();
          };
          img.onerror = function () {
            console.warn('Frame failed to load:', getFrameUrl(index + 1));
            onSettled();
          };
          img.src = getFrameUrl(index + 1);
        })(i);
      }
    });
  }

  /* ----------------------------------------------------------
     Proses semua frame secara chunked (tidak freeze UI)
     ---------------------------------------------------------- */
  function processAllFrames(images) {
    return new Promise(function (resolve) {
      var i = 0;
      var chunk = 4; // proses 4 frame per tick

      function step() {
        var end = Math.min(i + chunk, FRAME_COUNT);
        for (; i < end; i++) {
          if (!images[i]) continue;
          var canvas = processFrame(images[i]);
          if (canvas) {
            frameCache[i + 1] = { canvas: canvas, source: images[i] };
          }
        }
        setLoaderProgress(0.7 + (i / FRAME_COUNT) * 0.3); // 70–100%
        if (i < FRAME_COUNT) {
          setTimeout(step, 0);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  /* ----------------------------------------------------------
     Reproses semua frame saat ganti tema (chunked di background)
     ---------------------------------------------------------- */
  function reprocessAllFramesAsync() {
    var indices = Object.keys(frameCache).map(Number);
    if (!indices.length) return;
    var i = 0;

    function step() {
      var end = Math.min(i + 3, indices.length);
      for (; i < end; i++) {
        var entry = frameCache[indices[i]];
        if (entry && entry.source) {
          var processed = processFrame(entry.source);
          if (processed) entry.canvas = processed;
        }
      }
      if (i < indices.length) {
        setTimeout(step, 0);
      } else {
        drawFrame(currentFrame);
      }
    }
    step();
  }

  /* ----------------------------------------------------------
     Canvas sizing & drawing
     ---------------------------------------------------------- */
  function updateCanvasSize(forceResize) {
    var width  = Math.max(visualLayer.clientWidth, 1);
    var height = Math.max(visualLayer.clientHeight, 1);
    if (!forceResize &&
        Math.abs(width  - canvasLogicalWidth)  < 32 &&
        Math.abs(height - canvasLogicalHeight) < 32) {
      return;
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWrap.width  = Math.round(width  * dpr);
    canvasWrap.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvasLogicalWidth  = width;
    canvasLogicalHeight = height;
    drawFrame(currentFrame);
  }

  function drawFrame(index) {
    var width  = visualLayer.clientWidth;
    var height = visualLayer.clientHeight;
    if (!width || !height) return;

    context.clearRect(0, 0, width, height);
    var entry = frameCache[index];
    var radius = Math.min(width, height) * 0.47;

    // Clip lingkaran + fill paper
    context.save();
    context.beginPath();
    context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = themeColors.paper;
    context.fillRect(0, 0, width, height);

    if (entry && entry.canvas) {
      var fc = entry.canvas;
      var scale = Math.max(width / fc.width, height / fc.height);
      var dw = fc.width  * scale;
      var dh = fc.height * scale;
      // Mirror horizontal
      context.translate(width, 0);
      context.scale(-1, 1);
      context.drawImage(fc, (width - dw) / 2, (height - dh) / 2, dw, dh);
    }
    context.restore();

    // Ring border
    context.save();
    context.beginPath();
    context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    context.strokeStyle = themeColors.earth;
    context.globalAlpha = 0.38;
    context.lineWidth = Math.max(width / 440, 1);
    context.stroke();
    context.restore();
  }

  /* ----------------------------------------------------------
     Interpolasi & scroll scene
     ---------------------------------------------------------- */
  function interpolate(progress, keyframes, property) {
    for (var i = 1; i < keyframes.length; i += 1) {
      if (progress <= keyframes[i].at) {
        var previous = keyframes[i - 1];
        var next = keyframes[i];
        var portion = smoothStep((progress - previous.at) / (next.at - previous.at));
        return previous[property] + (next[property] - previous[property]) * portion;
      }
    }
    return keyframes[keyframes.length - 1][property];
  }

  function updateRevealMotion() {
    if (reduceMotion) return;
    var revealItems = doc.querySelectorAll('.section-editorial .reveal, .section-editorial .contact-finale');
    var vh = window.innerHeight;
    revealItems.forEach(function (item, index) {
      if (!item.classList.contains('is-visible')) return;
      var rect = item.getBoundingClientRect();
      var offset = (rect.top + rect.height * 0.5 - vh * 0.5) / vh;
      var direction = index % 2 === 0 ? 1 : -1;
      item.style.setProperty('--scroll-y',      clamp(-offset * 24, -26, 26) + 'px');
      item.style.setProperty('--scroll-z',      (Math.max(0, 1 - Math.abs(offset)) * 12) + 'px');
      item.style.setProperty('--scroll-rotate', clamp(offset * 3.5, -4, 4) + 'deg');
      item.style.setProperty('--scroll-yaw',    (direction * Math.max(0, 1 - Math.abs(offset)) * 2) + 'deg');
    });
  }

  function updateScrollScene() {
    var heroRect = getDocumentRect(hero);
    var workRect = getDocumentRect(work);
    var scrollY = window.scrollY;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var scrollProgress = reduceMotion ? 0 :
      clamp((scrollY - heroRect.top) / Math.max(workRect.top - heroRect.top, 1), 0, 1);
    var heroProgress = reduceMotion ? 0 :
      clamp((scrollY - heroRect.top) / Math.max(heroRect.height, 1), 0, 1);

    var startSize = Math.min(originalRect.width, vw - 32);
    var isMobile = vw <= 768;
    var peakSize = isMobile
      ? Math.min(vw * 0.92, vh * 0.58, 520)
      : Math.min(vw * 0.84, vh * 0.88, 860);
    var initialX = originalRect.left + startSize * 0.5;
    var initialY = originalRect.top + startSize * 0.5 - scrollY;

    var keyframes = isMobile ? [
      { at: 0,    x: initialX, y: initialY, size: startSize,      opacity: 0.88, rotateX: 0,  rotateY: -3 },
      { at: 0.26, x: vw * 0.5, y: vh * 0.46, size: peakSize * 0.78, opacity: 0.54, rotateX: 2,  rotateY: -1 },
      { at: 0.47, x: vw * 0.5, y: vh * 0.48, size: peakSize,        opacity: 0.34, rotateX: -1, rotateY: 0  },
      { at: 0.7,  x: vw * 0.5, y: vh * 0.48, size: peakSize * 0.9,  opacity: 0.26, rotateX: 1,  rotateY: 1  },
      { at: 1,    x: vw * 0.5, y: vh * 0.45, size: peakSize * 0.76, opacity: 0.18, rotateX: -1, rotateY: 2  }
    ] : [
      { at: 0,    x: initialX, y: initialY, size: startSize,      opacity: 0.9,  rotateX: 2,  rotateY: -7 },
      { at: 0.26, x: vw * 0.57, y: vh * 0.34, size: peakSize * 0.72, opacity: 0.8,  rotateX: 5,  rotateY: -3 },
      { at: 0.47, x: vw * 0.58, y: vh * 0.52, size: peakSize,        opacity: 0.5,  rotateX: -3, rotateY: 1  },
      { at: 0.7,  x: vw * 0.56, y: vh * 0.48, size: peakSize * 0.9,  opacity: 0.36, rotateX: 3,  rotateY: 5  },
      { at: 1,    x: vw * 0.7,  y: vh * 0.43, size: peakSize * 0.68, opacity: 0.24, rotateX: -2, rotateY: 7  }
    ];

    var size    = interpolate(scrollProgress, keyframes, 'size');
    var left    = interpolate(scrollProgress, keyframes, 'x');
    var top     = interpolate(scrollProgress, keyframes, 'y');
    var opacity = interpolate(scrollProgress, keyframes, 'opacity');
    var rotateX = interpolate(scrollProgress, keyframes, 'rotateX');
    var rotateY = interpolate(scrollProgress, keyframes, 'rotateY');

    visualLayer.style.left    = (left - size * 0.5) + 'px';
    visualLayer.style.top     = (top  - size * 0.5) + 'px';
    visualLayer.style.width   = size + 'px';
    visualLayer.style.height  = size + 'px';
    visualLayer.style.opacity = String(opacity);
    visualLayer.style.visibility = 'visible';
    visualLayer.style.transform = reduceMotion ? 'none' :
      'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
    visualLayer.style.setProperty('--visual-scroll-progress', scrollProgress);

    var orbitLabel = visualLayer.querySelector('.hero__orbit-label');
    if (orbitLabel) orbitLabel.style.opacity = String(1 - scrollProgress * 0.75);

    updateCanvasSize();

    // Frame interpolation berdasarkan scroll
    var frameStops = [
      { at: 0,    frame: 1  },
      { at: 0.26, frame: 10 },
      { at: 0.47, frame: 20 },
      { at: 0.7,  frame: 30 },
      { at: 1,    frame: 40 }
    ];
    currentFrame = clamp(Math.round(interpolate(scrollProgress, frameStops, 'frame')), 1, FRAME_COUNT);
    drawFrame(currentFrame);

    // Parallax hero content
    var heroContent = hero.querySelector('.hero__content');
    var heroFooter  = hero.querySelector('.hero__footer-meta');
    if (!reduceMotion && heroContent && heroContent.classList.contains('is-visible')) {
      heroContent.style.transform =
        'perspective(1100px) translate3d(0,' + (-heroProgress * 64) + 'px,' +
        (-heroProgress * 56) + 'px) rotateX(' + (-heroProgress * 7) + 'deg)';
      heroContent.style.opacity = String(1 - heroProgress * 0.8);
    }
    if (!reduceMotion && heroFooter && heroFooter.classList.contains('is-visible')) {
      heroFooter.style.transform = 'translate3d(0,' + (-heroProgress * 28) + 'px,0)';
      heroFooter.style.opacity = String(1 - heroProgress * 0.7);
    }

    updateRevealMotion();
  }

  function queueScrollUpdate() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      scrollQueued = false;
      updateScrollScene();
    });
  }

  function resizeVisual() {
    var rect = placeholder.getBoundingClientRect();
    originalRect = {
      left: rect.left,
      top: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
    if (reduceMotion) {
      visualLayer.style.left   = originalRect.left + 'px';
      visualLayer.style.top    = originalRect.top + 'px';
      visualLayer.style.width  = originalRect.width + 'px';
      visualLayer.style.height = originalRect.height + 'px';
    }
    updateCanvasSize(true);
    updateScrollScene();
  }

  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', resizeVisual);

  if ('ResizeObserver' in window) {
    new ResizeObserver(resizeVisual).observe(placeholder);
  }

  /* ----------------------------------------------------------
     Ganti tema → reprocess frame
     ---------------------------------------------------------- */
  var themeObserver = new MutationObserver(function () {
    refreshThemeColors();

    // 1) Redraw frame saat ini SEGERA dengan warna baru
    if (frameCache[currentFrame] && frameCache[currentFrame].source) {
      var quick = processFrame(frameCache[currentFrame].source);
      if (quick) frameCache[currentFrame].canvas = quick;
    }
    drawFrame(currentFrame);

    // 2) Reproses frame lain di background (chunked, tidak freeze)
    reprocessAllFramesAsync();
  });
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* ----------------------------------------------------------
     Bootstrap
     ---------------------------------------------------------- */
  refreshThemeColors();
  updateCanvasSize(true);

  (async function init() {
    try {
      var images = await preloadAllFrames();
      await processAllFrames(images);
    } catch (err) {
      console.warn('Frame preload/process error:', err);
    }
    preloadDone = true;
    setLoaderProgress(1);
    updateScrollScene();
    // Beri jeda singkat agar bar 100% terlihat sebelum loader hilang
    setTimeout(dismissLoader, 250);
  })();

})();
