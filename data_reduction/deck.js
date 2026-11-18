/* =====================================================================
   DECK RUNTIME — fixed 1920×1080 stage, step reveals, slide transitions,
   and the demo slides (demo.js, demos.js).

   Keys:  → / PgDn / Space  next        ← / PgUp  previous
          Home / End  first / last      4 Enter   go to slide 4
          F fullscreen    B black screen    H progress bar    R replay the demo step
          O all slides (also the ▦ button at the top right, next to ‹ › for previous / next slide)
   On a demo slide next/previous move through the demo's steps first;
   the Back / Next buttons in the guide column do the same.
   ===================================================================== */
(function () {
  'use strict';
  const EXPO = 'cubic-bezier(.16,1,.3,1)', SMOOTH = 'cubic-bezier(.65,0,.35,1)';
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const players = new Map();
  let cur = 0, step = 0, anims = [], typed = '';

  function fit() {
    const f = Math.min(innerWidth / 1920, innerHeight / 1080), w = 1920 * f, h = 1080 * f;
    stage.style.transform = `translate(${(innerWidth - w) / 2}px,${(innerHeight - h) / 2}px) scale(${f})`;
  }
  window.addEventListener('resize', fit);

  slides.forEach((s, i) => {
    if (s.classList.contains('no-chrome') || s.classList.contains('s-demo')) return;
    const logo = document.createElement('img');
    logo.className = 'chrome-logo'; logo.alt = 'Oak Ridge National Laboratory — Spallation Neutron Source'; logo.src = '../eqsans_intro/assets/logo_color.png';
    const pn = document.createElement('div'); pn.className = 'chrome-page'; pn.textContent = i + 1;
    s.append(logo, pn);
  });

  /* ---------------- demo slides ---------------- */
  const isDemo = (s) => s.classList.contains('s-demo');
  function player(s) {
    if (!players.has(s)) {
      const demo = window.DEMOS[s.dataset.demo];
      demo.onEnd = () => go(cur + 1, 1); demo.onStart = () => go(cur - 1, -1);
      players.set(s, window.Demo.mount(s, demo));
    }
    return players.get(s);
  }

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
  function transition(from, to, dir) {
    finishAnims();
    from.classList.add('leaving'); from.classList.remove('active'); to.classList.add('active');
    const mine = [], push = (a) => (mine.push(a), a);
    to.style.zIndex = 4;
    if (to.classList.contains('s-closing')) push(A(to, [{ clipPath: 'circle(0% at 50% 48%)' }, { clipPath: 'circle(76% at 50% 48%)' }], { duration: 1300, easing: 'cubic-bezier(.7,0,.2,1)' }));
    else if (isDemo(to) || isDemo(from) || from.classList.contains('s-cover') || from.classList.contains('s-closing')) {
      push(A(from, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: SMOOTH }));
      push(A(to, [{ opacity: 0 }, { opacity: 1 }], { duration: 550, easing: SMOOTH }));
    } else {
      push(A(from, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 14}%)`, opacity: 0 }], { duration: 700, easing: EXPO }));
      push(A(to, [{ transform: `translateX(${dir * 14}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 850, easing: EXPO }));
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
    document.getElementById('progress').style.transform = `scaleX(${slides.length > 1 ? cur / (slides.length - 1) : 1})`;
    document.title = `${cur + 1} · ${s.dataset.title || ''} — ${document.body.dataset.deck || 'From Runs to I(Q)'}`;   // ../data_analysis uses this file too
    history.replaceState(null, '', '#' + (cur + 1));
    document.dispatchEvent(new CustomEvent('deck:change'));
  }
  function enter(s, dir, quick) {
    step = dir < 0 ? +(s.dataset.steps || 0) : 0;
    applyStep(s, step, true);
    if (isDemo(s)) {
      const p = player(s);
      if (dir < 0) p.goto(p.n - 1, false);                      // coming back: the finished demo
      else { p.goto(0, false); setTimeout(() => { if (slides[cur] === s && p.k === 0) p.goto(0); }, quick ? 100 : 650); }
    }
  }
  function go(i, dir) {
    if (i < 0 || i >= slides.length || i === cur) return;
    const from = slides[cur], to = slides[i];
    if (isDemo(from)) player(from).stop();
    cur = i;
    enter(to, dir);
    transition(from, to, dir);
    ui();
  }
  function next() {
    const s = slides[cur];
    if (isDemo(s)) { if (player(s).next()) return; }
    else if (step < +(s.dataset.steps || 0)) { applyStep(s, ++step); return; }
    go(cur + 1, 1);
  }
  function prev() {
    const s = slides[cur];
    if (isDemo(s)) { if (player(s).prev()) return; }
    else if (step > 0) { applyStep(s, --step); return; }
    go(cur - 1, -1);
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') next();
    else if (k === 'ArrowLeft' || k === 'PageUp') prev();
    else if (k === 'Home') go(0, -1);
    else if (k === 'End') go(slides.length - 1, 1);
    else if (k === 'f' || k === 'F') { if (window.DeckNav && window.DeckNav.hub) window.DeckNav.hub.fullscreen(); else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); }
    else if (k === 'b' || k === 'B') document.body.classList.toggle('black');
    else if (k === 'h' || k === 'H') document.body.classList.toggle('show-progress');
    else if ((k === 'r' || k === 'R') && isDemo(slides[cur])) player(slides[cur]).replay();
    else if (/^\d$/.test(k)) { typed += k; return; }
    else if (k === 'Enter' && typed) { const n = +typed - 1; typed = ''; if (n < 0 && window.DeckNav) window.DeckNav.home(); else go(n, n > cur ? 1 : -1); }   // 0 Enter: the workshop front page
    else if (k === 'Escape') { typed = ''; return; }
    else return;
    typed = '';
    e.preventDefault();
  });
  document.getElementById('blackout').onclick = () => document.body.classList.remove('black');
  stage.addEventListener('click', (e) => { if (!e.target.closest('a, button')) next(); });

  fit();
  // "#5" opens slide 5; "#5.3" opens slide 5 at step 3 of its demo
  const [hs, hk] = location.hash.slice(1).split('.');
  cur = Math.min(slides.length - 1, Math.max(0, (parseInt(hs, 10) || 1) - 1));
  slides[cur].classList.add('active');
  enter(slides[cur], 1, true);
  if (hk && isDemo(slides[cur])) player(slides[cur]).goto(parseInt(hk, 10) - 1, false);
  ui();

  window.deck = { slides, go, next, prev, player: () => (isDemo(slides[cur]) ? player(slides[cur]) : null), get cur() { return cur; } };
})();
