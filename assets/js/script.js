/* ============================================================
   AWENDEV.ONLINE — ROOTS TO DIGITAL × THREE.JS SCULPTURE & INTERACTION
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

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
     4. Three.js Interactive Sculpture: Roots to Digital
     ---------------------------------------------------------- */
  var canvasWrap = doc.getElementById('hero-canvas');
  if (canvasWrap && typeof THREE !== 'undefined') {
    try {
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(45, canvasWrap.clientWidth / canvasWrap.clientHeight, 0.1, 1000);
      camera.position.z = 6;

      var renderer = new THREE.WebGLRenderer({ canvas: canvasWrap, alpha: true, antialias: true });
      renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Lighting
      var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      var pointLight1 = new THREE.PointLight(0xa9653b, 2, 50); // earth tone
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);

      var pointLight2 = new THREE.PointLight(0x879568, 2, 50); // leaf tone
      pointLight2.position.set(-5, -5, 3);
      scene.add(pointLight2);

      // Sculpture Group (Roots evolving into industrial rings & digital nodes)
      var sculptureGroup = new THREE.Group();

      // Organic Root Branches (Torus Knots & Cylinders)
      var rootMat = new THREE.MeshStandardMaterial({
        color: 0xa9653b,
        roughness: 0.8,
        metalness: 0.2,
        wireframe: false
      });
      var rootGeo = new THREE.TorusKnotGeometry(1.2, 0.25, 128, 16, 2, 3);
      var rootMesh = new THREE.Mesh(rootGeo, rootMat);
      sculptureGroup.add(rootMesh);

      // Industrial Structural Rings
      var ringMat = new THREE.MeshStandardMaterial({
        color: 0x6c6863,
        roughness: 0.3,
        metalness: 0.8
      });
      for (var i = 0; i < 3; i++) {
        var ringGeo = new THREE.TorusGeometry(1.8 + i * 0.4, 0.04, 16, 100);
        var ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / (2 + i);
        ringMesh.rotation.y = Math.PI / (4 * i + 1);
        sculptureGroup.add(ringMesh);
      }

      // Digital Nodes / Circuit Particles (Points)
      var particleCount = 200;
      var particleGeo = new THREE.BufferGeometry();
      var positions = new Float32Array(particleCount * 3);
      for (var p = 0; p < particleCount * 3; p += 3) {
        positions[p] = (Math.random() - 0.5) * 5;
        positions[p + 1] = (Math.random() - 0.5) * 5;
        positions[p + 2] = (Math.random() - 0.5) * 5;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var particleMat = new THREE.PointsMaterial({
        color: 0xd4af37, // gold accent
        size: 0.05,
        transparent: true,
        opacity: 0.8
      });
      var particlePoints = new THREE.Points(particleGeo, particleMat);
      sculptureGroup.add(particlePoints);

      scene.add(sculptureGroup);

      // Mouse interactivity
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
        var delta = clock.getDelta();
        var time = clock.getElapsedTime();

        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        sculptureGroup.rotation.y = time * 0.15 + targetX * 0.5;
        sculptureGroup.rotation.x = time * 0.1 + targetY * 0.5;

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
      console.warn('Three.js initialization fallback:', err);
    }
  }

})();
