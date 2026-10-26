/* ============================================================
   AWENDEV.ONLINE — SCROLL STORY & PRELOADER
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ----------------------------------------------------------
     Preloader Dismissal
     ---------------------------------------------------------- */
  var dismissLoader = function () {
    var loader = doc.getElementById('site-loader');
    if (loader && !loader.classList.contains('is-loaded')) {
      loader.classList.add('is-loaded');
    }
  };

  window.addEventListener('load', function () {
    setTimeout(dismissLoader, 400);
  });
  setTimeout(dismissLoader, 1500); // Safety fallback

  /* ----------------------------------------------------------
     1. Mobile Navigation Toggle
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
     2. Theme Toggle (Light / Dark)
     ---------------------------------------------------------- */
  var themeToggle = doc.querySelector('[data-theme-toggle]');
  var STORAGE_KEY = 'awen-theme';

  var applyTheme = function (theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  };

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
     3. Scroll Reveal (IntersectionObserver)
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
     4. Scroll-driven Hero Frame Animation
     ---------------------------------------------------------- */
  var canvasWrap = doc.getElementById('hero-canvas');
  var visualLayer = canvasWrap && canvasWrap.parentNode;
  var hero = doc.getElementById('home');
  var services = doc.getElementById('services');
  var work = doc.getElementById('work');

  if (canvasWrap && visualLayer && hero && services && work) {
    var context = canvasWrap.getContext('2d', { alpha: true });
    if (!context) {
      console.warn('Hero frame animation disabled: 2D canvas context unavailable.');
      dismissLoader();
    } else {
      var frameCount = 40;
      var frameCache = {};
      var loadingFrames = {};
      var frameUseOrder = [];
      var currentFrame = 0;
      var previousFrame = 1;
      var scrollQueued = false;
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var initialRect = visualLayer.getBoundingClientRect();
      var originalRect = {
        left: initialRect.left,
        top: initialRect.top + window.scrollY,
        width: initialRect.width,
        height: initialRect.height
      };
      var placeholder = doc.createElement('div');
      placeholder.className = 'hero__3d-placeholder';
      visualLayer.parentNode.replaceChild(placeholder, visualLayer);
      doc.body.appendChild(visualLayer);
      visualLayer.style.position = reduceMotion ? 'absolute' : 'fixed';
      visualLayer.style.zIndex = '1';
      visualLayer.style.pointerEvents = 'none';
      visualLayer.style.transformOrigin = '50% 50%';
      visualLayer.style.left = originalRect.left + 'px';
      visualLayer.style.top = (reduceMotion ? originalRect.top : originalRect.top - window.scrollY) + 'px';
      visualLayer.style.width = originalRect.width + 'px';
      visualLayer.style.height = originalRect.height + 'px';
      canvasWrap.style.width = '100%';
      canvasWrap.style.height = '100%';

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function smoothStep(value) {
        var t = clamp(value, 0, 1);
        return t * t * (3 - 2 * t);
      }

      function getDocumentRect(element) {
        var rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, height: rect.height };
      }

      function updateCanvasSize() {
        var width = Math.max(visualLayer.clientWidth, 1);
        var height = Math.max(visualLayer.clientHeight, 1);
        var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvasWrap.width = Math.round(width * pixelRatio);
        canvasWrap.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        drawFrame(currentFrame);
      }

      function processFrame(image) {
        return image;
      }

      function rememberFrame(index, frame) {
        frameCache[index] = frame;
        frameUseOrder = frameUseOrder.filter(function (cachedIndex) { return cachedIndex !== index; });
        frameUseOrder.push(index);
        while (frameUseOrder.length > 4) {
          var staleIndex = frameUseOrder.shift();
          if (staleIndex === currentFrame) {
            frameUseOrder.push(staleIndex);
            break;
          }
          delete frameCache[staleIndex];
        }
      }

      function drawFrame(index) {
        var width = visualLayer.clientWidth;
        var height = visualLayer.clientHeight;
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        var frame = frameCache[index];
        if (!frame) return;

        var scale = Math.max(width / frame.naturalWidth, height / frame.naturalHeight);
        var drawWidth = frame.naturalWidth * scale;
        var drawHeight = frame.naturalHeight * scale;
        context.save();
        context.beginPath();
        context.arc(width / 2, height / 2, Math.min(width, height) * 0.484, 0, Math.PI * 2);
        context.clip();
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(frame, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
        context.restore();
      }

      function loadFrame(index) {
        if (index < 1 || index > frameCount || frameCache[index] || loadingFrames[index]) return;
        loadingFrames[index] = true;
        var image = new Image();
        var frameName = 'frame_' + String(index).padStart(3, '0') + '.png';
        image.onload = function () {
          var frame = processFrame(image);
          loadingFrames[index] = false;
          if (!frame) return;
          rememberFrame(index, frame);
          if (index === currentFrame) drawFrame(index);
        };
        image.onerror = function () {
          loadingFrames[index] = false;
          console.warn('Hero animation frame failed to load: ' + frameName);
        };
        image.src = 'assets/frames/' + frameName;
      }

      function showFrame(index) {
        var direction = index >= previousFrame ? 1 : -1;
        previousFrame = index;
        currentFrame = clamp(index, 1, frameCount);
        if (frameCache[currentFrame]) {
          rememberFrame(currentFrame, frameCache[currentFrame]);
          drawFrame(currentFrame);
        } else {
          loadFrame(currentFrame);
        }
        loadFrame(currentFrame + direction);
        loadFrame(currentFrame + direction * 2);
      }

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
        var viewportHeight = window.innerHeight;
        revealItems.forEach(function (item, index) {
          if (!item.classList.contains('is-visible')) return;
          var rect = item.getBoundingClientRect();
          var offset = (rect.top + rect.height * 0.5 - viewportHeight * 0.5) / viewportHeight;
          var direction = index % 2 === 0 ? 1 : -1;
          item.style.setProperty('--scroll-y', clamp(-offset * 24, -26, 26) + 'px');
          item.style.setProperty('--scroll-z', (Math.max(0, 1 - Math.abs(offset)) * 12) + 'px');
          item.style.setProperty('--scroll-rotate', clamp(offset * 3.5, -4, 4) + 'deg');
          item.style.setProperty('--scroll-yaw', (direction * Math.max(0, 1 - Math.abs(offset)) * 2) + 'deg');
        });
      }

      function updateScrollScene() {
        var heroRect = getDocumentRect(hero);
        var workRect = getDocumentRect(work);
        var scrollY = window.scrollY;
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var scrollProgress = reduceMotion ? 0 : clamp((scrollY - heroRect.top) / Math.max(workRect.top - heroRect.top, 1), 0, 1);
        var heroProgress = reduceMotion ? 0 : clamp((scrollY - heroRect.top) / Math.max(heroRect.height, 1), 0, 1);
        var startSize = Math.min(originalRect.width, viewportWidth - 32);
        var peakSize = Math.min(viewportWidth * 0.84, viewportHeight * 0.88, 860);
        var keyframes = [
          { at: 0, x: originalRect.left + startSize * 0.5, y: originalRect.top + startSize * 0.5, size: startSize, opacity: 0.9, rotateX: 2, rotateY: -7 },
          { at: 0.26, x: viewportWidth * 0.57, y: viewportHeight * 0.34, size: peakSize * 0.72, opacity: 0.8, rotateX: 5, rotateY: -3 },
          { at: 0.47, x: viewportWidth * 0.58, y: viewportHeight * 0.52, size: peakSize, opacity: 0.5, rotateX: -3, rotateY: 1 },
          { at: 0.7, x: viewportWidth * 0.56, y: viewportHeight * 0.48, size: peakSize * 0.9, opacity: 0.36, rotateX: 3, rotateY: 5 },
          { at: 1, x: viewportWidth * 0.7, y: viewportHeight * 0.43, size: peakSize * 0.68, opacity: 0.24, rotateX: -2, rotateY: 7 }
        ];
        var size = interpolate(scrollProgress, keyframes, 'size');
        var left = interpolate(scrollProgress, keyframes, 'x');
        var top = interpolate(scrollProgress, keyframes, 'y');
        var opacity = interpolate(scrollProgress, keyframes, 'opacity');
        var rotateX = interpolate(scrollProgress, keyframes, 'rotateX');
        var rotateY = interpolate(scrollProgress, keyframes, 'rotateY');

        visualLayer.style.left = (left - size * 0.5) + 'px';
        visualLayer.style.top = (top - size * 0.5) + 'px';
        visualLayer.style.width = size + 'px';
        visualLayer.style.height = size + 'px';
        visualLayer.style.opacity = String(opacity);
        visualLayer.style.visibility = 'visible';
        visualLayer.style.transform = reduceMotion ? 'none' : 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        visualLayer.style.setProperty('--visual-scroll-progress', scrollProgress);
        visualLayer.querySelector('.hero__orbit-label').style.opacity = String(1 - scrollProgress * 0.75);

        var frameStops = [
          { at: 0, frame: 1 },
          { at: 0.26, frame: 10 },
          { at: 0.47, frame: 20 },
          { at: 0.7, frame: 30 },
          { at: 1, frame: 40 }
        ];
        showFrame(Math.round(interpolate(scrollProgress, frameStops, 'frame')));

        var heroContent = hero.querySelector('.hero__content');
        var heroFooter = hero.querySelector('.hero__footer-meta');
        if (!reduceMotion && heroContent.classList.contains('is-visible')) {
          heroContent.style.transform =
            'perspective(1100px) translate3d(0,' + (-heroProgress * 64) + 'px,' + (-heroProgress * 56) + 'px) rotateX(' + (-heroProgress * 7) + 'deg)';
          heroContent.style.opacity = String(1 - heroProgress * 0.8);
        }
        if (!reduceMotion && heroFooter.classList.contains('is-visible')) {
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
        originalRect = { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
        if (reduceMotion) {
          visualLayer.style.left = originalRect.left + 'px';
          visualLayer.style.top = originalRect.top + 'px';
          visualLayer.style.width = originalRect.width + 'px';
          visualLayer.style.height = originalRect.height + 'px';
        }
        updateCanvasSize();
        updateScrollScene();
      }

      window.addEventListener('scroll', queueScrollUpdate, { passive: true });
      window.addEventListener('resize', resizeVisual);
      if ('ResizeObserver' in window) {
        new ResizeObserver(resizeVisual).observe(placeholder);
      }

      updateCanvasSize();
      updateScrollScene();
      window.setTimeout(function () {
        var firstFrameReady = !!frameCache[1];
        if (!firstFrameReady) loadFrame(currentFrame || 1);
        dismissLoader();
      }, 900);
    }
  } else {
    dismissLoader();
  }

})();
