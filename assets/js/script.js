/* ============================================================
   AWENDEV.ONLINE — WORKSTATION 3D SETUP & PRELOADER
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
  var revealEls = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ----------------------------------------------------------
     4. Three.js Workstation Setup: PC Tower, Monitor, Printer, Router
     ---------------------------------------------------------- */
  var canvasWrap = doc.getElementById('hero-canvas');
  if (canvasWrap && typeof THREE !== 'undefined') {
    try {
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(40, canvasWrap.clientWidth / canvasWrap.clientHeight, 0.1, 1000);
      camera.position.set(0, 0.4, 5.8);

      var renderer = new THREE.WebGLRenderer({ canvas: canvasWrap, alpha: true, antialias: true });
      renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Studio Lighting
      var ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      var dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
      dirLight.position.set(5, 7, 5);
      scene.add(dirLight);

      var fillLight = new THREE.DirectionalLight(0xb8c4a0, 0.5); // sage fill
      fillLight.position.set(-5, -2, 4);
      scene.add(fillLight);

      var workstationGroup = new THREE.Group();

      // Materials
      var darkMat = new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.5, metalness: 0.3 });
      var metalMat = new THREE.MeshStandardMaterial({ color: 0x8c8680, roughness: 0.2, metalness: 0.85 });
      var pcBodyMat = new THREE.MeshStandardMaterial({ color: 0x22201e, roughness: 0.4, metalness: 0.6 });
      var accentMat = new THREE.MeshBasicMaterial({ color: 0x879568 }); // sage green LED

      // --- 1. MONITOR ---
      var uiCanvas = document.createElement('canvas');
      uiCanvas.width = 512;
      uiCanvas.height = 320;
      var ctx = uiCanvas.getContext('2d');
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#262422';
      ctx.fillRect(0, 0, 110, 320);
      ctx.fillStyle = '#33302c';
      ctx.fillRect(110, 0, 402, 48);
      ctx.fillStyle = '#879568';
      ctx.fillRect(130, 18, 16, 12);
      ctx.fillStyle = '#f9f8f6';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText('AwenDev Workstation', 158, 34);
      ctx.fillStyle = '#22201e';
      ctx.fillRect(130, 68, 170, 100);
      ctx.fillRect(320, 68, 162, 100);
      ctx.fillStyle = '#a9653b';
      ctx.fillRect(146, 88, 50, 8);
      ctx.fillStyle = '#f9f8f6';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('Web Dev', 146, 120);
      ctx.fillStyle = '#879568';
      ctx.fillRect(336, 88, 40, 8);
      ctx.fillStyle = '#f9f8f6';
      ctx.fillText('IT Support', 336, 120);

      var screenTexture = new THREE.CanvasTexture(uiCanvas);
      var screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });

      var monitorGeo = new THREE.BoxGeometry(2.2, 1.3, 0.05);
      var monitorMesh = new THREE.Mesh(monitorGeo, [
        darkMat, darkMat, darkMat, darkMat, screenMat, darkMat
      ]);
      monitorMesh.position.set(-0.4, 0.4, 0);
      workstationGroup.add(monitorMesh);

      // Monitor Stand
      var standNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 12), metalMat);
      standNeck.position.set(-0.4, -0.3, -0.05);
      workstationGroup.add(standNeck);

      var standBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.5), metalMat);
      standBase.position.set(-0.4, -0.55, 0.05);
      workstationGroup.add(standBase);

      // --- 2. PC TOWER CASE ---
      var towerGeo = new THREE.BoxGeometry(0.6, 1.4, 1.0);
      var towerMesh = new THREE.Mesh(towerGeo, pcBodyMat);
      towerMesh.position.set(-1.4, 0.1, -0.2);
      workstationGroup.add(towerMesh);

      var pcLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), accentMat);
      pcLed.position.set(-1.4, 0.65, 0.31);
      workstationGroup.add(pcLed);

      // --- 3. PRINTER ---
      var printerGeo = new THREE.BoxGeometry(0.9, 0.4, 0.7);
      var printerMesh = new THREE.Mesh(printerGeo, darkMat);
      printerMesh.position.set(1.0, -0.35, 0.1);
      workstationGroup.add(printerMesh);

      var trayGeo = new THREE.BoxGeometry(0.6, 0.08, 0.3);
      var trayMesh = new THREE.Mesh(trayGeo, metalMat);
      trayMesh.position.set(1.0, -0.1, 0.35);
      workstationGroup.add(trayMesh);

      // --- 4. NETWORK ROUTER ---
      var routerGeo = new THREE.BoxGeometry(0.5, 0.08, 0.35);
      var routerMesh = new THREE.Mesh(routerGeo, darkMat);
      routerMesh.position.set(0.4, -0.51, 0.4);
      workstationGroup.add(routerMesh);

      var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 8), metalMat);
      antenna.position.set(0.55, -0.3, 0.4);
      workstationGroup.add(antenna);

      scene.add(workstationGroup);

      // Gentle mouse parallax & tilt
      var mouseX = 0, mouseY = 0;
      var targetX = 0, targetY = 0;
      doc.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      });

      // Animation loop
      var clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        var time = clock.getElapsedTime();

        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        workstationGroup.rotation.y = targetX * 0.2;
        workstationGroup.rotation.x = -targetY * 0.12;
        workstationGroup.position.y = Math.sin(time * 1.2) * 0.02;

        renderer.render(scene, camera);
      }
      animate();

      // Resize listener
      window.addEventListener('resize', function () {
        if (!canvasWrap) return;
        var width = canvasWrap.clientWidth;
        var height = canvasWrap.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });

    } catch (err) {
      console.warn('Three.js workstation fallback:', err);
      dismissLoader();
    }
  } else {
    dismissLoader();
  }

})();
