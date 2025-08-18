/* Global utilities */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/* Year */
document.getElementById('year').textContent = new Date().getFullYear().toString();

/* Smooth anchor scroll */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const targetId = a.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* Reveal on scroll */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

document.querySelectorAll('.reveal, .fade-in').forEach(el => revealObserver.observe(el));

/* Typewriter effect */
(() => {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const text = 'I build scalable backend systems with .NET Core & modern web technologies.';
  el.textContent = '';
  let i = 0;
  const speed = 24;
  const tick = () => {
    i = i + 1;
    el.textContent = text.slice(0, i);
    if (i < text.length) {
      setTimeout(tick, speed);
    }
  };
  setTimeout(tick, 400);
})();

/* Scroll-to-top button */
(() => {
  const btn = document.getElementById('to-top');
  if (!btn) return;
  const onScroll = () => {
    if (window.scrollY > 300) btn.classList.add('visible'); else btn.classList.remove('visible');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* Intro animation (Three.js) */
const hasPlayedIntro = () => {
  try {
    if (localStorage.getItem('introPlayed') === '1') return true;
    if (sessionStorage.getItem('introPlayed') === '1') return true;
  } catch {}
  return false;
};

const markIntroPlayed = () => {
  try { localStorage.setItem('introPlayed', '1'); } catch {}
  try { sessionStorage.setItem('introPlayed', '1'); } catch {}
};

const loadThree = async () => {
  if (window.__THREE__) return window.__THREE__;
  const mod = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  window.__THREE__ = mod;
  return mod;
};

const initIntro = async () => {
  return new Promise(async (resolve) => {
    const overlay = document.getElementById('intro');
    const canvas = document.getElementById('intro-canvas');
    const skipBtn = document.querySelector('.skip-intro');
    if (!overlay || !canvas) { resolve(); return; }

    const played = hasPlayedIntro();
    if (played) {
      overlay.classList.add('hidden');
      try { overlay.style.display = 'none'; } catch {}
      resolve();
      return;
    }

    let disposed = false;
    let safetyTimer = null;
    let THREE = null;
    try {
      THREE = await loadThree();
    } catch (e) {
      // If Three.js fails to load, end intro gracefully without calling undeclared functions
      markIntroPlayed();
      try { overlay.classList.add('hidden'); } catch {}
      disposed = true;
      try { overlay.style.display = 'none'; } catch {}
      try { resolve(); } catch {}
      return;
    }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0.3, 5.5);

  // Stars
  const starCount = 1500;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 12 * Math.cbrt(Math.random());
    starPositions[i * 3 + 0] = (Math.random() * 2 - 1) * r;
    starPositions[i * 3 + 1] = (Math.random() * 2 - 1) * r * 0.6;
    starPositions[i * 3 + 2] = (Math.random() * 2 - 1) * r - 2;
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMat = new THREE.PointsMaterial({ color: 0x9fbfff, size: 0.02, transparent: true, opacity: 0.7 });
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);

  // Jet (stylized using primitives)
  const jet = new THREE.Group();
  scene.add(jet);
  const fuselage = new THREE.CylinderGeometry(0.08, 0.18, 1.6, 16);
  const nose = new THREE.ConeGeometry(0.18, 0.5, 20);
  const tail = new THREE.ConeGeometry(0.12, 0.4, 16);
  const wing = new THREE.BoxGeometry(0.9, 0.04, 0.25);
  const fin = new THREE.BoxGeometry(0.04, 0.4, 0.25);
  const matCyan = new THREE.MeshPhongMaterial({ color: 0x06b6d4, emissive: 0x0b3a44, shininess: 160, specular: 0x66e0ff });
  const matPurple = new THREE.MeshPhongMaterial({ color: 0x7c3aed, emissive: 0x220b45, shininess: 180, specular: 0xd0a6ff });

  const mFuselage = new THREE.Mesh(fuselage, matCyan); mFuselage.rotation.z = Math.PI / 2; jet.add(mFuselage);
  const mNose = new THREE.Mesh(nose, matPurple); mNose.position.x = 0.85; mNose.rotation.z = -Math.PI / 2; jet.add(mNose);
  const mTail = new THREE.Mesh(tail, matPurple); mTail.position.x = -0.95; mTail.rotation.z = Math.PI / 2; jet.add(mTail);
  const mWingL = new THREE.Mesh(wing, matCyan); mWingL.position.set(-0.1, -0.18, 0.0); mWingL.rotation.y = 0.15; jet.add(mWingL);
  const mWingR = new THREE.Mesh(wing, matCyan); mWingR.position.set(-0.1, 0.18, 0.0); mWingR.rotation.y = -0.15; jet.add(mWingR);
  const mFin = new THREE.Mesh(fin, matPurple); mFin.position.set(-0.65, 0, 0.18); jet.add(mFin);
  jet.scale.set(0.9, 0.9, 0.9);

  const glow = new THREE.PointLight(0x7c3aed, 1.2, 8); glow.position.set(-0.6, 0, 0); jet.add(glow);
  const glow2 = new THREE.PointLight(0x06b6d4, 1.0, 7); glow2.position.set(0.2, 0, 0); jet.add(glow2);

  // Trail
  const trailGroup = new THREE.Group();
  scene.add(trailGroup);
  let trailGeom1 = null, trailGeom2 = null;
  const trailMatCyan = new THREE.MeshBasicMaterial({ color: 0x32e6ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending });
  const trailMatPurple = new THREE.MeshBasicMaterial({ color: 0xb388ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending });
  const lastPositions = [];

  // Lights
  scene.add(new THREE.AmbientLight(0x446688, 0.6));

  // Path
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(1.6, 0.45, -0.5);
  const p2 = new THREE.Vector3(5.8, 1.2, -1.6);
  const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let startTime = performance.now();
  let frame = 0;

  const rebuildTrail = (points) => {
    const path = new THREE.CatmullRomCurve3(points);
    const geom1 = new THREE.TubeGeometry(path, 60, 0.06, 12, false);
    const geom2 = new THREE.TubeGeometry(path, 60, 0.09, 12, false);
    if (trailGeom1) trailGeom1.dispose();
    if (trailGeom2) trailGeom2.dispose();
    trailGeom1 = geom1; trailGeom2 = geom2;
    // Clear previous children
    while (trailGroup.children.length) { const c = trailGroup.children.pop(); c.geometry.dispose(); }
    trailGroup.add(new THREE.Mesh(geom1, trailMatCyan));
    trailGroup.add(new THREE.Mesh(geom2, trailMatPurple));
  };

  const animate = () => {
    if (disposed) return;
    const now = performance.now();
    const t = (now - startTime) / 3400; // ~3.4s flight
    const tt = clamp(t, 0, 1);

    // Jet along curve
    const pos = curve.getPoint(tt);
    const next = curve.getPoint(Math.min(tt + 0.0025, 1));
    jet.position.copy(pos);
    jet.lookAt(next.x + 0.0001, next.y + 0.0001, next.z + 0.0001);
    jet.rotateZ(0.12);

    // Stars parallax
    stars.rotation.y = tt * 0.6;
    stars.position.x = -tt * 0.3;

    // Trail positions
    lastPositions.push(pos.clone());
    if (lastPositions.length > 80) lastPositions.shift();
    if (frame % 2 === 0 && lastPositions.length > 6) rebuildTrail(lastPositions);

    renderer.render(scene, camera);
    frame++;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      endIntro();
    }
  };

    const endIntro = () => {
      if (disposed) return;
      markIntroPlayed();
      overlay.classList.add('hidden');
      disposed = true;
      // Allow the site to proceed immediately while the overlay fades
      try { resolve(); } catch {}
      setTimeout(() => {
        // Cleanup
        try {
          window.removeEventListener('resize', resize);
          starsGeo.dispose();
          fuselage.dispose(); nose.dispose(); tail.dispose(); wing.dispose(); fin.dispose();
          if (trailGeom1) trailGeom1.dispose();
          if (trailGeom2) trailGeom2.dispose();
          renderer.dispose();
        } catch {}
        // Force hide if CSS class didn't apply
        overlay.style.display = 'none';
      }, 700);
    };

    

    if (skipBtn) skipBtn.addEventListener('click', endIntro);
    // Safety timeout to guarantee exit
    safetyTimer = setTimeout(endIntro, 4200);
    requestAnimationFrame(animate);
  });
};

/* Mobile navigation */
(() => {
  const menuBtn = document.querySelector('.menu-toggle');
  const header = document.querySelector('.site-nav');
  const desktopNavList = document.querySelector('.site-nav .nav-links');
  const backdrop = document.querySelector('.nav-backdrop');
  if (!menuBtn || !header || !desktopNavList || !backdrop) return;

  // Build drawer
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  const drawerHeader = document.createElement('div');
  drawerHeader.className = 'drawer-header';
  const drawerTitle = document.createElement('div');
  drawerTitle.className = 'drawer-title';
  drawerTitle.textContent = 'Menu';
  const drawerClose = document.createElement('button');
  drawerClose.className = 'drawer-close';
  drawerClose.setAttribute('aria-label', 'Close menu');
  drawerClose.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  drawerHeader.appendChild(drawerTitle);
  drawerHeader.appendChild(drawerClose);
  const drawerList = desktopNavList.cloneNode(true);
  drawer.appendChild(drawerHeader);
  drawer.appendChild(drawerList);
  document.body.appendChild(drawer);

  const openMenu = () => {
    drawer.classList.add('open');
    menuBtn.classList.add('open');
    backdrop.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    drawer.classList.remove('open');
    menuBtn.classList.remove('open');
    backdrop.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  const toggleMenu = () => {
    if (drawer.classList.contains('open')) closeMenu(); else openMenu();
  };

  menuBtn.addEventListener('click', toggleMenu);
  backdrop.addEventListener('click', closeMenu);
  drawerClose.addEventListener('click', closeMenu);
  drawerList.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // Close on resize back to desktop
  const mql = window.matchMedia('(min-width: 641px)');
  const onChange = () => closeMenu();
  mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
})();

/* Tilt / 3D hover */
(() => {
  const tiltEls = Array.from(document.querySelectorAll('[data-tilt]'));
  tiltEls.forEach(el => {
    let rafId = 0;
    const maxDeg = 10;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotY = clamp(dx * maxDeg, -maxDeg, maxDeg);
      const rotX = clamp(-dy * maxDeg, -maxDeg, maxDeg);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(rafId);
      el.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1)';
      el.style.transform = 'rotateX(0) rotateY(0)';
      setTimeout(() => { el.style.transition = ''; }, 320);
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', reset);
    el.addEventListener('mouseenter', () => { el.style.transition = 'transform 160ms ease-out'; });
  });
})();

/* Contact form (mock submission) */
(() => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending...';
    status.classList.remove('success', 'error');
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const message = String(fd.get('message') || '').trim();
    if (!name || !email || !message) {
      status.textContent = 'Please fill in all fields.';
      status.classList.add('error');
      return;
    }
    try {
      await new Promise(r => setTimeout(r, 900));
      status.textContent = 'Thanks! Your message has been sent.';
      status.classList.add('success');
      form.reset();
    } catch (err) {
      status.textContent = 'Something went wrong. Please try again later.';
      status.classList.add('error');
    }
  });
})();

/* Three.js animated background */
const initThree = async () => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  try {
    const THREE = await loadThree();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0.2, 6);

    // Lights
    const light1 = new THREE.PointLight(0x7c3aed, 1.5, 30);
    light1.position.set(-4, 2, 2);
    const light2 = new THREE.PointLight(0x06b6d4, 1.3, 30);
    light2.position.set(4, -1, 1);
    const ambient = new THREE.AmbientLight(0x446688, 0.35);
    scene.add(light1, light2, ambient);

    // Shapes group
    const group = new THREE.Group();
    scene.add(group);

    const materialA = new THREE.MeshPhongMaterial({ color: 0x3b82f6, emissive: 0x1b2a5a, shininess: 80, specular: 0x88aaff, transparent: true, opacity: 0.9 });
    const materialB = new THREE.MeshPhongMaterial({ color: 0x7c3aed, emissive: 0x2a0a4a, shininess: 120, specular: 0xaa88ff, transparent: true, opacity: 0.85 });

    const geo1 = new THREE.TorusKnotGeometry(1, 0.28, 180, 24);
    const mesh1 = new THREE.Mesh(geo1, materialA);
    mesh1.position.set(-1.6, 0.2, -1.5);
    group.add(mesh1);

    const geo2 = new THREE.IcosahedronGeometry(1.1, 0);
    const mesh2 = new THREE.Mesh(geo2, materialB);
    mesh2.position.set(1.7, -0.3, -1.2);
    group.add(mesh2);

    // Particles
    const particles = 500;
    const positions = new Float32Array(particles * 3);
    for (let i = 0; i < particles; i++) {
      const r = 6 * Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x8fb5ff, size: 0.02, transparent: true, opacity: 0.65 });
    const points = new THREE.Points(g, pMat);
    scene.add(points);

    // Handle resize
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // Parallax by mouse
    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mx = x; my = y;
    });

    // Animate
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      requestAnimationFrame(animate);
      mesh1.rotation.x = t * 0.25;
      mesh1.rotation.y = t * 0.18;
      mesh2.rotation.x = -t * 0.18;
      mesh2.rotation.y = t * 0.22;
      points.rotation.y = t * 0.02;
      group.position.x += (mx * 0.5 - group.position.x) * 0.04;
      group.position.y += (-my * 0.3 - group.position.y) * 0.04;
      renderer.render(scene, camera);
    };
    animate();
  } catch (err) {
    console.warn('[three.js] failed to load, continuing without 3D background', err);
  }
};

// Kick off intro; start bg scene immediately if intro already played, otherwise after overlay hides
(async () => {
  const overlay = document.getElementById('intro');
  const played = hasPlayedIntro();
  if (overlay && !played) {
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    await initIntro();
    // Wait a frame to ensure CSS transition begins
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      initThree();
    });
  } else {
    if (overlay) { try { overlay.classList.add('hidden'); overlay.style.display = 'none'; } catch {} }
    initThree();
  }
})();


