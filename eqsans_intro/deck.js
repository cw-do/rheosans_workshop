/* =====================================================================
   DECK RUNTIME — fixed 1920×1080 stage, step reveals, slide transitions,
   and the link to the live EQ-SANS model in the iframe behind the stage.

   Keys:  → / PgDn / Space / click  next        ← / PgUp  previous
          Home / End  first / last              3 Enter   go to slide 3
          F fullscreen    B black screen    H progress bar    O all slides
   While a live slide is up the model owns the mouse; the same keys are
   caught inside the iframe (except Space, which belongs to its buttons).

   The model is driven through its own hook, window.__eqsans (see the end
   of ../eqsans-model/main.js): siteIntro, startDive, showSite, setRheo,
   setRheoPlane, rheoView, setPaused.
   ===================================================================== */
(function () {
  'use strict';
  const EXPO = 'cubic-bezier(.16,1,.3,1)', SMOOTH = 'cubic-bezier(.65,0,.35,1)';
  const stage = document.getElementById('stage');
  const frame = document.getElementById('model');
  const slides = Array.from(document.querySelectorAll('.slide'));
  let cur = 0, step = 0, anims = [], typed = '', modelTimer = 0;

  const M = () => { try { return frame.contentWindow.__eqsans || null; } catch (e) { return null; } };
  const isLive = (s) => s.classList.contains('s-live');
  const needsModel = (s) => isLive(s) || s.id === 's-cover';       // the cover keeps the site model running under its photograph
  const maxStep = (s) => (SCENES[s.id] && SCENES[s.id].steps) || +(s.dataset.steps || 0);

  /* ---------------- stage scaling ---------------- */
  function fit() {
    const f = Math.min(innerWidth / 1920, innerHeight / 1080), w = 1920 * f, h = 1080 * f;
    const x = (innerWidth - w) / 2, y = (innerHeight - h) / 2;
    stage.style.transform = `translate(${x}px,${y}px) scale(${f})`;
    // the model fills the same rectangle, unscaled, so its interface keeps its designed size
    Object.assign(frame.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  }
  window.addEventListener('resize', fit);

  /* ---------------- chrome: logo and page number ---------------- */
  slides.forEach((s, i) => {
    if (s.classList.contains('no-chrome')) return;
    const logo = document.createElement('img');
    logo.className = 'chrome-logo'; logo.alt = 'Oak Ridge National Laboratory — Spallation Neutron Source'; logo.src = 'assets/logo_color.png';
    const pn = document.createElement('div'); pn.className = 'chrome-page'; pn.textContent = i + 1;
    s.append(logo, pn);
  });

  /* ---------------- the live model ---------------- */
  function modelOn() { clearTimeout(modelTimer); frame.classList.add('on'); const m = M(); if (m) m.setPaused(false); }
  function modelOff(delay) {                                         // stop rendering once a static slide has covered it
    clearTimeout(modelTimer);
    modelTimer = setTimeout(() => { frame.classList.remove('on'); const m = M(); if (m) m.setPaused(true); }, delay);
  }
  let rheoStep = 0;                                                  // 0 whole rheometer · 1 cup and bob, 1–3 plane · 2 cup and bob, 2–3 plane
  // Per-slide hooks. enter(dir) may return the step to start on; next()/prev() return true when they used the key press.
  const SCENES = {
    's-cover': {
      enter(dir) { const m = M(); if (!m) return; if (dir < 0) setTimeout(() => { if (slides[cur].id === 's-cover') m.siteIntro(true); }, 700); else m.siteIntro(true); },
    },
    's-model': {
      enter(dir) {
        const m = M(); if (!m) return;
        if (m.rheo.on) m.setRheo(false, dir < 0);
        if (dir > 0) m.siteIntro(false);                             // from the cover: glide from the photograph's viewpoint to the landing view
      },
      next() { const m = M(); if (!m) return false; if (m.mode === 'site') { m.startDive(); return true; } return m.mode === 'dive'; },
      prev() { const m = M(); if (!m) return false; if (m.mode === 'inst') { m.showSite(); return true; } return m.mode === 'dive'; },
    },
    's-rheo': {
      enter(dir) {
        const m = M(); if (!m) return;
        if (dir > 0 || !m.rheo.on) { m.setRheoPlane('13', false); m.setRheo(true); rheoStep = 0; }
        else rheoStep = m.rheo.plane === '23' ? 2 : 1;
      },
      next() {
        const m = M(); if (!m || m.rheo.plane === '23') return false;
        if (rheoStep === 0) { m.setRheoPlane('13'); rheoStep = 1; } else { m.setRheoPlane('23'); rheoStep = 2; }
        return true;
      },
      prev() {
        const m = M(); if (!m) return false;
        if (m.rheo.plane === '23') { m.setRheoPlane('13'); rheoStep = 1; return true; }
        if (rheoStep === 1) { m.rheoView('wide'); rheoStep = 0; return true; }
        return false;
      },
    },
  };

  /* ---------------- step reveal ---------------- */
  function applyStep(s, k, instant) {
    if (instant) s.classList.add('instant');
    s.querySelectorAll('[data-step]').forEach((el) => el.classList.toggle('on', k >= +el.dataset.step));
    s.querySelectorAll('[data-only]').forEach((el) => el.classList.toggle('on', el.dataset.only.split(',').map(Number).includes(k)));
    s.dataset.cur = k;
    if (instant) { void s.offsetWidth; requestAnimationFrame(() => s.classList.remove('instant')); }
  }

  /* ---------------- transitions ---------------- */
  function finishAnims() { anims.forEach((a) => { try { a.finish(); } catch (e) { } }); anims = []; }
  function A(el, kf, o) { const a = el.animate(kf, Object.assign({ fill: 'both' }, o)); anims.push(a); return a; }
  function pick(from, to) {
    if (from.id === 's-cover' && isLive(to)) return 'dissolve';
    if (to.classList.contains('s-closing')) return 'iris';
    if (isLive(from) || isLive(to) || to.id === 's-cover' || from.classList.contains('s-closing')) return 'fade';
    return 'push';
  }
  function transition(from, to, type, dir) {
    finishAnims();
    // the cover photograph drifts slowly while the cover is up (kenburns); remember where it is before the class that drives it goes
    const drift = type === 'dissolve' ? getComputedStyle(from.querySelector('.bgimg')).transform : 'none';
    from.classList.add('leaving'); from.classList.remove('active'); to.classList.add('active');
    const mine = [], push = (a) => (mine.push(a), a);
    to.style.zIndex = '';
    switch (type) {
      case 'dissolve':                                               // the cover photograph melts into the live site model
        push(A(from.querySelector('.cover-card'), [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-90px)' }], { duration: 800, easing: SMOOTH }));
        // The model underneath is held on the photograph's own viewpoint (siteIntro in the model), so this is a matched
        // dissolve: the photograph settles onto its undrifted position and goes without zooming, and it is gone while the
        // model's glide (7 s, slow to start) has covered only its first few per cent.
        if (drift && drift !== 'none') push(A(from.querySelector('.bgimg'), [{ transform: drift }, { transform: 'none' }], { duration: 500, easing: 'ease-out' }));
        push(A(from.querySelector('.cover-bg'), [{ opacity: 1 }, { opacity: 0 }], { duration: 1500, easing: 'ease-in-out' }));
        break;
      case 'push':
        to.style.zIndex = 4;
        push(A(from, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 14}%)`, opacity: 0 }], { duration: 700, easing: EXPO }));
        push(A(to, [{ transform: `translateX(${dir * 14}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 850, easing: EXPO }));
        break;
      case 'iris':
        to.style.zIndex = 4;
        push(A(to, [{ clipPath: 'circle(0% at 50% 48%)' }, { clipPath: 'circle(76% at 50% 48%)' }], { duration: 1300, easing: 'cubic-bezier(.7,0,.2,1)' }));
        break;
      default:                                                       // fade: the slide on top goes, what is underneath is already there
        push(A(from, [{ opacity: 1 }, { opacity: 0 }], { duration: isLive(to) ? 900 : 550, easing: SMOOTH }));
        if (!isLive(to) && !isLive(from)) push(A(to, [{ opacity: 0 }, { opacity: 1 }], { duration: 550 }));
        if (isLive(from)) { to.style.zIndex = 4; push(A(to, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: SMOOTH })); }
    }
    Promise.all(mine.map((a) => a.finished)).catch(() => { }).then(() => {
      from.classList.remove('leaving'); to.style.zIndex = '';
      mine.forEach((a) => { try { a.cancel(); } catch (e) { } });
      anims = anims.filter((a) => !mine.includes(a));
    });
  }

  /* ---------------- navigation ---------------- */
  function ui() {
    const s = slides[cur];
    document.body.classList.toggle('live', isLive(s));
    document.getElementById('progress').style.transform = `scaleX(${slides.length > 1 ? cur / (slides.length - 1) : 1})`;
    document.title = `${cur + 1} · ${s.dataset.title || ''} — Introduction to EQ-SANS`;
    history.replaceState(null, '', '#' + (cur + 1));
    document.dispatchEvent(new CustomEvent('deck:change'));
  }
  function enter(s, dir) {
    if (needsModel(s)) modelOn();
    const sc = SCENES[s.id];
    step = dir < 0 ? +(s.dataset.steps || 0) : 0;
    if (sc && sc.enter) sc.enter(dir);
    applyStep(s, step, true);
  }
  function go(i, dir) {
    if (i < 0 || i >= slides.length || i === cur) return;
    const from = slides[cur], to = slides[i];
    cur = i;
    enter(to, dir);
    transition(from, to, pick(from, to), dir);
    if (!needsModel(to)) modelOff(to.classList.contains('s-closing') ? 1500 : 800);
    ui();
  }
  function next() {
    const s = slides[cur], sc = SCENES[s.id];
    if (sc && sc.next && sc.next()) return;
    if (!isLive(s) && step < maxStep(s)) { applyStep(s, ++step); return; }
    go(cur + 1, 1);
  }
  function prev() {
    const s = slides[cur], sc = SCENES[s.id];
    if (sc && sc.prev && sc.prev()) return;
    if (!isLive(s) && step > 0) { applyStep(s, --step); return; }
    go(cur - 1, -1);
  }

  function onKey(e, inFrame) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target && e.target.tagName, typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    const k = e.key;
    // A clicker sends PgDn / PgUp: those always move the deck, even when a slider in the model has the focus.
    if (k === 'PageDown') next();
    else if (k === 'PageUp') prev();
    else if (typing) return;
    else if (k === 'ArrowRight') next();
    else if (k === 'ArrowLeft') prev();
    else if (k === ' ' && !inFrame) next();
    else if (k === 'Home') go(0, -1);
    else if (k === 'End') go(slides.length - 1, 1);
    else if (k === 'f' || k === 'F') { if (window.DeckNav && window.DeckNav.hub) window.DeckNav.hub.fullscreen(); else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); }
    else if (k === 'b' || k === 'B') document.body.classList.toggle('black');
    else if (k === 'h' || k === 'H') document.body.classList.toggle('show-progress');
    else if (k === 'o' || k === 'O') { if (window.DeckNav) window.DeckNav.toggle(); }   // from inside the model's frame; in this page nav.js catches it first
    else if (/^\d$/.test(k)) { typed += k; return; }
    else if (k === 'Enter' && typed) { const n = +typed - 1; typed = ''; if (n < 0 && window.DeckNav) window.DeckNav.home(); else go(n, n > cur ? 1 : -1); }   // 0 Enter: the workshop front page
    else if (k === 'Escape') { document.getElementById('lightbox').classList.remove('open'); typed = ''; return; }
    else return;
    typed = '';
    e.preventDefault();
  }
  document.addEventListener('keydown', (e) => onKey(e, false));
  document.getElementById('blackout').onclick = () => document.body.classList.remove('black');

  // click on a slide: a picture opens enlarged, anything else advances
  const lightbox = document.getElementById('lightbox');
  lightbox.onclick = () => lightbox.classList.remove('open');
  stage.addEventListener('click', (e) => {
    const z = e.target.closest('.zoom');
    if (z) {
      const imgs = Array.from(z.querySelectorAll('img')).filter((im) => !im.matches('[data-step]:not(.on)'));
      lightbox.querySelector('img').src = imgs[imgs.length - 1].src; lightbox.classList.add('open'); return;
    }
    if (e.target.closest('a, button')) return;
    next();
  });

  /* ---------------- start ---------------- */
  function modelReady() {
    const m = M(); if (!m) return;
    try {
      frame.contentWindow.addEventListener('keydown', (e) => onKey(e, true), true);
      // a stray click on the model's GitHub link must not navigate the model away in the middle of the talk
      frame.contentDocument.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    } catch (e) { }
    const s = slides[cur];
    if (needsModel(s)) { modelOn(); const sc = SCENES[s.id]; if (sc && sc.enter) sc.enter(1); }
    else { if (s.id === 's-thanks') { m.setRheoPlane('13', false); m.setRheo(true, false); } m.setPaused(true); }
  }
  function waitModel(tries) {
    if (M()) { document.body.classList.remove('no-model'); modelReady(); return; }
    if (tries > 200) { document.body.classList.add('no-model'); return; }   // 20 s: not served over http, or the model folder is missing
    setTimeout(() => waitModel(tries + 1), 100);
  }
  if (location.protocol === 'file:') document.body.classList.add('no-model');

  fit();
  cur = Math.min(slides.length - 1, Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  slides[cur].classList.add('active');
  applyStep(slides[cur], 0, true);
  ui();
  waitModel(0);

  window.deck = { slides, go, next, prev, get cur() { return cur; }, get step() { return step; }, model: M };
})();
