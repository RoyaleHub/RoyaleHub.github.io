/* ============================================================
   TRANCE — main.js
   3D-scene (Three.js), scroll-animationer og UI-logik
   ============================================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------
     1. Preloader
     -------------------------------------------------------- */
  var preloader = document.getElementById('preloader');
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (preloader) preloader.classList.add('hidden');
    }, 500);
  });
  // Sikkerhed: fjern preloaderen senest efter 4 sek
  setTimeout(function () {
    if (preloader) preloader.classList.add('hidden');
  }, 4000);

  /* --------------------------------------------------------
     2. Navigation — scrolled state, aktivt link, mobilmenu
     -------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function onScrollNav() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  if (navLinks) {
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Aktivt nav-link ved scroll
  var sections = ['funktioner', 'saadan-virker-det', 'forskning', 'download'];
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var currentSection = function () {
    var y = window.scrollY + 140;
    var found = null;
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) found = id;
    });
    return found;
  };
  window.addEventListener('scroll', function () {
    var cur = currentSection();
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  }, { passive: true });

  /* --------------------------------------------------------
     3. Scroll-progress bar
     -------------------------------------------------------- */
  var progressBar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (progressBar && max > 0) {
      progressBar.style.width = (h.scrollTop / max) * 100 + '%';
    }
  }, { passive: true });

  /* --------------------------------------------------------
     4. Reveal-on-scroll
     -------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      el.style.setProperty('--d', (i % 3) * 0.08 + 's');
      revealObs.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* --------------------------------------------------------
     5. Animerede tællere (stats)
     -------------------------------------------------------- */
  var counters = document.querySelectorAll('.counter');
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var start = null;
    var dur = 1600;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { counterObs.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-target'); });
  }

  /* --------------------------------------------------------
     6. 3D-tilt på feature-kort
     -------------------------------------------------------- */
  var tiltCards = document.querySelectorAll('.tilt');
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    tiltCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(900px) rotateX(' + (-y * 8) + 'deg) rotateY(' + (x * 10) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* --------------------------------------------------------
     7. THREE.JS — 3D hero-scene
     -------------------------------------------------------- */
  var canvas = document.getElementById('hero3d');

  function init3D() {
    if (!window.THREE || !canvas) return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* --- Lys --- */
    scene.add(new THREE.AmbientLight(0x8899cc, 0.7));
    var keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);
    var rimLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    rimLight.position.set(-5, -3, -4);
    scene.add(rimLight);
    var redLight = new THREE.PointLight(0xff2d55, 1.6, 12);
    redLight.position.set(0, 0, 0.5);
    scene.add(redLight);

    /* --- Koncentriske ringe (hypnose-ankerpunktet) --- */
    var ringGroup = new THREE.Group();
    scene.add(ringGroup);

    var ringDefs = [
      { r: 2.6, t: 0.05, color: 0x60a5fa, opacity: 0.32, tilt: 0.0 },
      { r: 2.1, t: 0.06, color: 0x3b82f6, opacity: 0.42, tilt: 0.12 },
      { r: 1.6, t: 0.06, color: 0x93c5fd, opacity: 0.55, tilt: -0.10 },
      { r: 1.15, t: 0.06, color: 0x2563eb, opacity: 0.7, tilt: 0.06 },
      { r: 0.7, t: 0.05, color: 0xbfdbfe, opacity: 0.85, tilt: -0.04 }
    ];
    var rings = [];
    ringDefs.forEach(function (d, i) {
      var geo = new THREE.TorusGeometry(d.r, d.t, 40, 120);
      var mat = new THREE.MeshStandardMaterial({
        color: d.color,
        transparent: true,
        opacity: d.opacity,
        metalness: 0.5,
        roughness: 0.35,
        emissive: d.color,
        emissiveIntensity: 0.18
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2 + d.tilt + (i % 2 === 0 ? 0 : -0.06);
      ringGroup.add(mesh);
      rings.push({ mesh: mesh, def: d, base: mesh.rotation.x });
    });

    /* --- Centrale røde dot (optage-indikator / fokuspunkt) --- */
    var dotGeo = new THREE.SphereGeometry(0.14, 32, 32);
    var dotMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55,
      emissive: 0xff2d55,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.1
    });
    var dot = new THREE.Mesh(dotGeo, dotMat);
    ringGroup.add(dot);

    var glowGeo = new THREE.SphereGeometry(0.32, 24, 24);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xff2d55,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    ringGroup.add(glow);

    /* --- Funktioner: ringe, der reagerer på øjerne? Nej — partikler --- */
    var particleCount = reducedMotion ? 300 : 900;
    var pos = new Float32Array(particleCount * 3);
    var pColor = new Float32Array(particleCount * 3);
    var cA = new THREE.Color(0x3b82f6);
    var cB = new THREE.Color(0x67e8f9);
    for (var i = 0; i < particleCount; i++) {
      var r = 5 + Math.random() * 14;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(phi) - 6;
      var col = cA.clone().lerp(cB, Math.random());
      pColor[i * 3] = col.r;
      pColor[i * 3 + 1] = col.g;
      pColor[i * 3 + 2] = col.b;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColor, 3));
    var pMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    var particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* --- Interaktion: mus-parallax --- */
    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
      document.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });
    }
    var startTime = performance.now();

    function animate(now) {
      requestAnimationFrame(animate);
      var t = (now - startTime) / 1000;

      // Langsom vejrtrækningsrytme på ringene (~1 åndedrag pr. 8 sek)
      var breath = 1 + 0.07 * Math.sin(t * (Math.PI * 2 / 8));
      ringGroup.scale.set(breath, breath, breath);
      ringGroup.rotation.y = t * 0.12;
      ringGroup.rotation.z = Math.sin(t * 0.25) * 0.06;

      // Pulserende rød dot
      var pulse = 1 + 0.18 * Math.sin(t * (Math.PI * 2 / 4));
      dot.scale.set(pulse, pulse, pulse);
      glow.scale.set(pulse * 2.4, pulse * 2.4, pulse * 2.4);
      glowMat.opacity = 0.1 + 0.1 * Math.sin(t * (Math.PI * 2 / 4));
      redLight.intensity = 1.3 + 0.7 * Math.sin(t * (Math.PI * 2 / 4));

      // Parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = targetX * 0.7;
      camera.position.y = -targetY * 0.5;
      camera.lookAt(0, 0, 0);

      particles.rotation.y = t * 0.02;
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', onResize);
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (reducedMotion) {
      // Uden animation: statisk, men fuldt renderet scene
      var staticT = 0;
      ringGroup.scale.setScalar(1);
      renderer.render(scene, camera);
    } else {
      requestAnimationFrame(animate);
    }
    canvas.classList.add('ready');
  }

  /* Varm start: vent på DOM + evt. CDN-load af Three.js */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3D);
  } else {
    init3D();
  }
  // Hvis CDN'et fejler, prøver vi igen én gang når window load trækker vejret
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (window.THREE && !canvas.classList.contains('ready')) init3D();
    }, 300);
  });

})();