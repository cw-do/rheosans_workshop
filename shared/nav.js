/* =====================================================================
   SLIDE NAVIGATION, shared by both decks. Load after the deck's own
   deck.js, which must expose  window.deck = { slides, go(i, dir), cur }
   and fire  document 'deck:change'  whenever the slide changes.

   On screen: ⌂  ‹  3 / 8  ›  ▦  ⛶   — workshop front page, previous slide,
   next slide, all slides, full screen on and off (also the key F). ⌂ (or 0 then Enter) goes to ../index.html, the
   page with the three decks as cards. When the deck was opened from that
   page it runs inside it, and then ⌂ only closes the deck, F asks that
   page for full screen, and the page is told which slide is showing.
   The arrows move whole slides (the arrow keys and the Back / Next
   buttons of a demo still go step by step). ▦ or the key O opens every
   slide as a thumbnail; click one, or move with the arrow keys and press
   Enter. Thumbnails are assets/thumbs/<n>.jpg, made by ../make_thumbs.py;
   a slide without one shows its number.
   ===================================================================== */
(function () {
  'use strict';
  const d = window.deck;
  if (!d) return;
  const stage = document.getElementById('stage');
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const title = (s) => s.dataset.title || '';
  // the workshop front page, when this deck runs inside it
  const hub = (() => { try { return window.parent !== window && window.parent.RheoHub ? window.parent.RheoHub : null; } catch (e) { return null; } })();
  const home = () => { if (hub) hub.home(); else location.href = '../index.html'; };

  /* ---------------- the pill ---------------- */
  const nav = el('nav', 'dnav');
  nav.setAttribute('aria-label', 'Slides');
  nav.innerHTML = '<button type="button" class="home" title="Workshop front page (0 Enter)">⌂</button><button type="button" class="arrow prev" title="Previous slide">‹</button><button type="button" class="count" title="All slides (O)"></button>'
    + '<button type="button" class="arrow next" title="Next slide">›</button><button type="button" class="grid" title="All slides (O)"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></button><button type="button" class="full" title="Full screen (F)"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path class="exp" d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/><path class="cmp" d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4"/></svg></button>';
  document.body.append(nav);
  const prev = nav.querySelector('.prev'), next = nav.querySelector('.next'), count = nav.querySelector('.count');
  nav.querySelector('.home').onclick = home;
  // full screen: the page itself, or the workshop front page when the deck runs inside it
  const fsDoc = hub ? window.parent.document : document, full = nav.querySelector('.full');
  full.onclick = () => { if (hub) hub.fullscreen(); else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); };
  const fsIcon = () => { const on = !!fsDoc.fullscreenElement; full.classList.toggle('on', on); full.title = on ? 'Leave full screen (F)' : 'Full screen (F)'; };
  fsDoc.addEventListener('fullscreenchange', fsIcon); fsIcon();
  // a button that was clicked must not keep the keyboard: Space would press it again
  nav.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) b.blur(); });
  prev.onclick = () => d.go(d.cur - 1, -1);
  next.onclick = () => d.go(d.cur + 1, 1);
  count.onclick = nav.querySelector('.grid').onclick = () => toggle();

  function place() {
    const r = stage.getBoundingClientRect();
    nav.style.top = (r.top + 6) + 'px';
    if (document.body.classList.contains('live')) { nav.style.left = (r.left + r.width / 2) + 'px'; nav.style.right = 'auto'; nav.style.transform = 'translateX(-50%)'; }
    else { nav.style.left = 'auto'; nav.style.right = (window.innerWidth - r.right + 10) + 'px'; nav.style.transform = 'none'; }
  }

  /* ---------------- all slides ---------------- */
  const ov = el('div', 'dov');
  ov.innerHTML = '<div class="dov-head"><b>All slides</b><span>click a slide, or ← → then Enter · Esc closes</span><button type="button">Close</button></div><div class="dov-grid"></div>';
  document.body.append(ov);
  const cards = d.slides.map((s, i) => {
    const c = el('button', 'dov-card', `<div class="dov-thumb">${i + 1}</div><div class="dov-label"><b>${i + 1}</b><span></span></div>`);
    c.type = 'button';
    c.querySelector('.dov-label span').textContent = title(s);
    const img = new Image();
    img.alt = '';
    img.onload = () => { const t = c.querySelector('.dov-thumb'); t.textContent = ''; t.append(img); };
    img.src = `assets/thumbs/${i + 1}.jpg`;
    c.onclick = () => { close(); if (i !== d.cur) d.go(i, i > d.cur ? 1 : -1); };
    ov.querySelector('.dov-grid').append(c);
    return c;
  });
  let sel = 0;
  const mark = () => cards.forEach((c, i) => { c.classList.toggle('is-cur', i === d.cur); c.classList.toggle('is-sel', i === sel); });
  function open() {
    sel = d.cur; mark(); ov.classList.add('open');
    // a key pressed now must reach this page, not the 3D model's frame
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    window.focus();
    cards[sel].scrollIntoView({ block: 'nearest' });
  }
  function close() { ov.classList.remove('open'); }
  function toggle() { if (ov.classList.contains('open')) close(); else open(); }
  ov.querySelector('.dov-head button').onclick = close;
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });

  // While the overview is open it takes the keys, before the deck sees them.
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, isOpen = ov.classList.contains('open');
    if (!isOpen) {
      const tag = e.target && e.target.tagName;
      if (hub && (k === 'f' || k === 'F')) { hub.fullscreen(); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if ((k === 'o' || k === 'O') && tag !== 'INPUT' && tag !== 'TEXTAREA') { open(); e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    const cols = getComputedStyle(ov.querySelector('.dov-grid')).gridTemplateColumns.split(' ').length;
    if (k === 'Escape' || k === 'o' || k === 'O') close();
    else if (k === 'Enter' || k === ' ') cards[sel].click();
    else if (k === 'ArrowRight') sel = Math.min(cards.length - 1, sel + 1);
    else if (k === 'ArrowLeft') sel = Math.max(0, sel - 1);
    else if (k === 'ArrowDown') sel = Math.min(cards.length - 1, sel + cols);
    else if (k === 'ArrowUp') sel = Math.max(0, sel - cols);
    mark(); cards[sel].scrollIntoView({ block: 'nearest' });
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);

  function update() {
    count.innerHTML = `<b>${d.cur + 1}</b> / ${d.slides.length}`;
    prev.disabled = d.cur === 0; next.disabled = d.cur === d.slides.length - 1;
    mark(); place();
    if (hub) hub.at(d.cur + 1);
  }
  document.addEventListener('deck:change', update);
  window.addEventListener('resize', place);
  update();

  window.DeckNav = { open, close, toggle, home, hub, get isOpen() { return ov.classList.contains('open'); } };
})();
