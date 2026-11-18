/* =====================================================================
   DEMO PLAYER — step-by-step replicas of what a user does on the
   analysis cluster. A demo is a list of steps; each step is an async
   function that types, prints and moves windows. To show step k the
   player rebuilds the screen, runs steps 0…k−1 instantly and plays
   step k with its animation, so going back and forth always lands on
   the same picture. A time bar along the bottom of the screen shows how
   far the animation of the step is, and turns green when it has finished;
   the guide column says the same in words above the step dots.

   window.Demo.mount(slide, demo) → { next(), prev(), goto(k), replay() }
   Components: Demo.term, Demo.editor, Demo.browser, Demo.sansbook,
   Demo.sansdir, Demo.figure. Demos themselves are in demos.js.
   ===================================================================== */
(function () {
  'use strict';
  const CANCEL = { cancelled: true };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  // **bold**, `code` and report links, as the chat shows Markdown
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(report\/[^`]+)`/g, '<span class="link">$1</span>').replace(/`([^`]+)`/g, '$1');

  /* ---------------- run context: one per goto() ---------------- */
  function context(player, fast) {
    const id = player.runId;
    const c = {
      fast,
      alive: () => player.runId === id,
      check() { if (player.runId !== id) throw CANCEL; },
      async sleep(ms) { if (c.fast) return; await new Promise((r) => setTimeout(r, ms)); c.check(); },
      // type text into a node, a character at a time
      async type(node, text, speed = 26) {
        if (c.fast) { node.textContent += text; return; }
        for (const ch of text) { node.textContent += ch; await c.sleep(ch === ' ' ? speed * 1.6 : speed + Math.random() * speed); }
      },
      // show lines one after another (a log, a tool trace)
      async stream(lines, add, gap = 60) { for (const l of lines) { add(l); await c.sleep(gap); } },
    };
    return c;
  }
  // The same step run without waiting, only adding up how long its animation takes (sleeps, typing, streamed lines).
  // It takes the animated branches (fast is false), so clicks and page loads count; nothing is ever cancelled.
  function meter() {
    const c = {
      fast: false, measure: true, total: 0,
      alive: () => true, check() { },
      async sleep(ms) { c.total += ms; },
      async type(node, text, speed = 26) { node.textContent += text; for (const ch of text) c.total += ch === ' ' ? speed * 1.6 : speed * 1.5; },
      async stream(lines, add, gap = 60) { for (const l of lines) { add(l); c.total += gap; } },
    };
    return c;
  }

  /* ---------------- windows ---------------- */
  function win(screen, cls, title, x, y, w, ht) {
    const el = h('div', 'win hidden ' + cls);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: ht + 'px' });
    const bar = h('div', 'win-bar', `<span></span><i class="x"></i>`), body = h('div', 'win-body');
    el.append(bar, body); screen.append(el);
    const o = {
      el, body,
      title(t) { bar.firstChild.textContent = t; },
      show(on = true) { el.classList.toggle('hidden', !on); if (on) o.front(); },
      front() { el.style.zIndex = ++win.z; },
      move(nx, ny, nw, nh) { Object.assign(el.style, { left: nx + 'px', top: ny + 'px', width: nw + 'px', height: nh + 'px' }); },
    };
    o.title(title);
    return o;
  }
  win.z = 10;

  /* ---------------- terminal ---------------- */
  function term(screen, x, y, w, ht, user, host) {
    const o = win(screen, 'term', '', x, y, w, ht);
    const lines = h('div', 'term-lines'); o.body.append(lines);
    let cmdNode = null, cur = null, dir = '~';
    o.cwd = (d) => { dir = d; o.title(`${user}@${host}:${d}`); };
    o.prompt = () => {
      if (cur) cur.remove();
      const l = h('div', 'tl', `<span class="ps">[${user}@${host} ${esc(dir === '~' ? '~' : dir.split('/').pop())}]$ </span><span class="cmd"></span>`);
      cur = h('span', 'cur'); l.append(cur); lines.append(l); cmdNode = l.querySelector('.cmd'); lines.scrollTop = lines.scrollHeight;
    };
    const bottom = () => { lines.scrollTop = lines.scrollHeight; };
    o.out = (text, cls = 'out', html = false) => { const l = h('div', 'tl ' + cls); if (html) l.innerHTML = text; else l.textContent = text; lines.append(l); bottom(); return l; };
    // type a command at the prompt, "press Enter", print its output, show the next prompt
    o.run = async (c, text, output, opt = {}) => {
      if (!cmdNode) o.prompt();
      await c.sleep(opt.before ?? 350);
      await c.type(cmdNode, text);
      await c.sleep(opt.enter ?? 420);
      if (cur) { cur.remove(); cur = null; }
      cmdNode = null;
      if (opt.cwd) o.cwd(opt.cwd);
      for (const line of [].concat(output || [])) o.out(line.text ?? line, line.cls || 'out', !!line.html);
      if (!opt.hold) o.prompt();
    };
    o.clear = () => { lines.innerHTML = ''; cmdNode = null; cur = null; };
    o.lines = lines;
    o.cwd('~');
    return o;
  }

  /* ---------------- text editor ---------------- */
  function editor(screen, x, y, w, ht, title) {
    const o = win(screen, 'editor', title, x, y, w, ht);
    const sc = h('div', 'ed-scroll'), inner = h('div', 'ed-inner'); sc.append(inner); o.body.append(sc);
    let n = 0;
    o.line = (html, id) => { const l = h('div', 'el', `<span class="n">${++n}</span><span class="c">${html}</span>`); if (id) l.dataset.id = id; inner.append(l); return l; };
    o.get = (id) => inner.querySelector(`[data-id="${id}"]`);
    o.hl = (id, on = true) => { const l = o.get(id); if (l) l.classList.toggle('hl', on); };
    o.scrollTo = (id, margin = 60) => { const l = o.get(id); if (!l) return; const top = Math.max(0, l.offsetTop - margin); inner.style.transform = `translateY(${-top}px)`; };
    o.inner = inner;
    return o;
  }

  /* ---------------- browser ---------------- */
  function browser(screen, x, y, w, ht) {
    const o = win(screen, 'browser', 'Mozilla Firefox', x, y, w, ht);
    o.body.innerHTML = `<div class="br-tabs"><div class="br-tab">New Tab</div></div><div class="br-nav"><span>←</span><span>→</span><span>⟳</span><div class="br-url"><span class="lock"></span><span class="u"></span></div></div><div class="br-load"></div><div class="br-page"></div>`;
    const tab = o.body.querySelector('.br-tab'), url = o.body.querySelector('.u'), lock = o.body.querySelector('.lock'), page = o.body.querySelector('.br-page'), load = o.body.querySelector('.br-load');
    o.page = page;
    // type (or set) the address, show a loading bar, then the page
    o.go = async (c, address, tabTitle, html, typed = false) => {
      if (typed) { url.textContent = ''; lock.textContent = ''; await c.type(url, address, 22); await c.sleep(300); } else url.textContent = address;
      lock.textContent = address.startsWith('https') || !address.includes('://') ? '🔒' : '';
      if (!c.fast) { load.classList.remove('go'); void load.offsetWidth; load.classList.add('go'); await c.sleep(520); }
      tab.textContent = tabTitle; o.title(tabTitle + ' — Mozilla Firefox');
      if (html != null) page.innerHTML = html;
    };
    // a mouse click at a place in the page, given as fractions of its width and of the height of what it shows
    o.clickAt = async (c, fx, fy) => {
      if (c.fast) return;
      const img = page.querySelector('.oc-shot img'), hgt = img ? img.offsetHeight : page.offsetHeight;
      const ring = h('div', 'click-ring'); ring.style.left = (fx * page.offsetWidth) + 'px'; ring.style.top = (fy * hgt) + 'px';
      page.append(ring); await c.sleep(650); ring.remove();
    };
    // a mouse click on something in the page
    o.click = async (c, target) => {
      const el = typeof target === 'string' ? page.querySelector(target) : target; if (!el) return;
      el.classList.add('pick');
      if (!c.fast) { const r = el.getBoundingClientRect(), p = page.getBoundingClientRect(), k = p.width / page.offsetWidth; const ring = h('div', 'click-ring'); ring.style.left = ((r.left + r.width / 2 - p.left) / k) + 'px'; ring.style.top = ((r.top + r.height / 2 - p.top) / k) + 'px'; page.append(ring); await c.sleep(650); ring.remove(); }
    };
    return o;
  }

  /* ---------------- sansbook, as the textual app draws it ---------------- */
  function sansbook(parent, version) {
    const el = h('div', 'tui');
    el.innerHTML = `<div class="sb-status"></div><div class="sb-body"><div class="sb-left"><div class="sb-legend"><span style="color:#008000">●</span> live ✕ dead <span style="color:#ffff00">…</span> waiting <span style="color:#00ffff">○</span> open: still changing · <span class="rv">current page</span> your next request · <span class="rv-c">reductions go here</span> reduce/merge</div><div class="sb-tree"></div><div class="sb-runlog">script output appears here</div></div><div class="sb-right"><div class="sb-chat"><div class="sb-chat-in"></div></div><div class="sb-prompt"><span class="ph">Ask about the data, or :help   ·   Enter sends · Ctrl+J new line</span></div></div></div><div class="tui-foot"><span><b>^j</b> New line</span><span><b>^q</b> Quit</span><span><b>esc</b> Stop</span><span><b>^T/F2</b> Select page</span><span><b>^R/F3</b> Rebuild report</span><span><b>^G/F1</b> Help</span><span><b>^O</b> Output dir</span><span class="r"><b>^p</b> palette</span></div><div class="sb-start"><div class="sb-box"></div></div>`;
    parent.append(el);
    const q = (s) => el.querySelector(s), chat = q('.sb-chat-in'), prompt = q('.sb-prompt'), status = q('.sb-status');
    const st = { title: 'sansbook', ipts: 'IPTS-37681', path: '', page: '-', model: 'openai/gpt-6-luna', cost: 0, state: 'ready', red: '— none open', out: '', talking: false };
    const o = { el, st };
    o.on = (on = true) => el.classList.toggle('on', on);
    o.status = (patch) => {
      Object.assign(st, patch || {});
      status.innerHTML = ` <b>sansbook (v${version})</b> │ <b>${esc(st.title)}</b> · ${st.ipts} · ${esc(st.path)}\n page <b>${st.page}</b> · ${st.talking ? `<span class="talk">${st.model}</span>` : st.model} · $${st.cost.toFixed(3)}/2.00 · ${st.state === 'ready' ? 'ready' : '<b>working… Esc stops</b>'}\n reduction <b>${st.red}</b> → <b>${esc(st.out)}</b> <span class="dim">(^O)</span>`;
    };
    // rows: [{html, cursor}]
    o.tree = (rows) => { q('.sb-tree').innerHTML = rows.map((r) => `<div class="row${r.cursor ? ' cursor' : ''}">${r.html}</div>`).join(''); };
    o.runlog = (text) => { q('.sb-runlog').textContent = text; };
    o.add = (kind, text, html = false) => { const d = h('div', kind); if (html) d.innerHTML = text; else if (kind === 'assistant') d.innerHTML = md(text); else d.textContent = text; chat.append(d); chat.scrollTop = chat.scrollHeight; return d; };
    o.clearChat = () => { chat.innerHTML = ''; };
    o.promptText = () => { prompt.innerHTML = '<span class="t"></span><span class="cur"></span>'; return prompt.querySelector('.t'); };
    o.promptIdle = () => { prompt.innerHTML = '<span class="ph">Ask about the data, or :help   ·   Enter sends · Ctrl+J new line</span>'; };
    // the person types a message and sends it
    o.send = async (c, text, shown) => {
      const t = o.promptText(); await c.sleep(400); await c.type(t, text, 24); await c.sleep(500);
      o.promptIdle(); o.add('user', '> ' + (shown || text));
    };
    // the model works: tool lines appear one by one, the model's name lights up while it is asked
    o.work = async (c, steps) => {
      o.status({ state: 'busy' });
      for (const s of steps) {
        o.status({ talking: true }); await c.sleep(s.think ?? 520); o.status({ talking: false, cost: s.cost ?? st.cost });
        if (s.call) o.add('tool', '● ' + s.call);
        if (s.runlog) o.runlog(s.runlog);
        await c.sleep(s.wait ?? 260);
        if (s.ret) o.add('tool', '   → ' + s.ret);
        if (s.do) s.do();
        await c.sleep(120);
      }
      o.status({ state: 'ready', talking: false });
    };
    o.start = (html) => { q('.sb-box').innerHTML = html; q('.sb-start').classList.add('on'); el.querySelector('.tui-foot').innerHTML = '<span><b>esc</b> Quit</span><span class="r"><b>^p</b> palette</span>'; };
    o.startOff = () => { q('.sb-start').classList.remove('on'); el.querySelector('.tui-foot').innerHTML = '<span><b>^j</b> New line</span><span><b>^q</b> Quit</span><span><b>esc</b> Stop</span><span><b>^T/F2</b> Select page</span><span><b>^R/F3</b> Rebuild report</span><span><b>^G/F1</b> Help</span><span><b>^O</b> Output dir</span><span class="r"><b>^p</b> palette</span>'; };
    return o;
  }

  /* ---------------- sansdir, as the textual app draws it ---------------- */
  function sansdir(parent, version) {
    const el = h('div', 'tui sd');
    const pane = `<div class="sd-pane"><div class="sd-path"></div><div class="sd-box"><div class="sd-head"><span class="nm">Name</span><span class="sz">Size</span><span class="md">Modified</span></div><div class="sd-rows"></div></div></div>`;
    el.innerHTML = `<div class="sd-title"><span class="m">▣</span> SansDIR  <span class="v">v${version}  ·</span>  <span class="i">EQSANS</span></div><div class="sd-panes">${pane}${pane}</div><div class="sd-stat"></div><div class="sd-keys"><i>F2</i>:Rename  <i>F3</i>:View  <i>F4</i>:Edit  <i>F5</i>:Refresh  <i>F6</i>:Copy  <i>F7</i>:Move  <i>F8</i>:Delete  <i>F9</i>:Mkdir  <i>Tab</i>:Pane  <i>^U</i>:Swap\n<i>Spc</i>:Tag  <i>+</i>:Tag glob  <i>u</i>:Untag all  <i>p,l</i>:Plot  <i>m</i>:Metadata  <i>z</i>:Zip  <i>e</i>:Email  <i>c</i>:Catalog  <i>/</i>:Filter  <i>g</i>:Goto  <i>i</i>:IPTS  <i>:</i>:Cmd  <i>?</i>:Help</div><div class="sd-cmd"></div>`;
    parent.append(el);
    const panes = el.querySelectorAll('.sd-pane'), cmd = el.querySelector('.sd-cmd'), stat = el.querySelector('.sd-stat');
    const o = { el };
    o.on = (on = true) => el.classList.toggle('on', on);
    const kind = (name) => name.endsWith('/') ? 'f-dir' : /_Iqxqy\./.test(name) ? 'f-2d' : /_Iq\.|merged_/.test(name) ? 'f-iq' : /trans\.txt$/.test(name) ? 'f-tr' : /processed\.nxs$/.test(name) ? 'f-nx' : '';
    // rows: [{name, size, mod, tag}]; opt: {cursor, wide (no Modified column), active}
    o.pane = (i, path, rows, opt = {}) => {
      const p = panes[i]; p.classList.toggle('active', !!opt.active);
      p.querySelector('.sd-path').textContent = path;
      p.querySelector('.sd-head .md').style.display = opt.wide ? 'none' : '';
      p.querySelector('.sd-rows').innerHTML = rows.map((r, k) => `<div class="sd-row${k === (opt.cursor ?? 0) ? ' cursor' : ''}"><span class="nm ${r.name === '..' ? 'up' : r.tag ? 'f-tag' : kind(r.name)}">${r.tag ? '* ' : ''}${esc(r.name)}</span><span class="sz">${esc(r.size || '')}</span>${opt.wide ? '' : `<span class="md">${r.mod || ''}</span>`}</div>`).join('');
    };
    o.stat = (html) => { stat.innerHTML = html; };
    o.cmdIdle = () => { cmd.className = 'sd-cmd'; cmd.innerHTML = '<span class="gt">&gt;</span> :  type a command — try `help` or `cd /tmp`'; };
    // the bottom line turns into an input: "filter", "tag.glob"
    o.ask = async (c, label, text) => {
      cmd.className = 'sd-cmd on'; cmd.innerHTML = `<span class="gt">&gt;</span> ${label} <span class="t"></span><span class="cur"></span>`;
      await c.sleep(450); await c.type(cmd.querySelector('.t'), text, 60); await c.sleep(550); o.cmdIdle();
    };
    o.cmdIdle();
    return o;
  }

  /* ---------------- matplotlib figure window ---------------- */
  function figure(screen, x, y, w, ht, title) {
    const o = win(screen, 'figwin', title, x, y, w, ht);
    o.body.innerHTML = `<div class="fig-tools"><i>⌂</i><i>←</i><i>→</i><i>✥</i><i>⌕</i><i>≡</i><i>▣</i></div><div class="fig-img"><img alt=""></div>`;
    o.img = (src) => { o.body.querySelector('img').src = src; };
    return o;
  }

  /* ---------------- player ---------------- */
  function mount(slide, demo) {
    const guide = h('div', 'guide'), screen = h('div', 'screen');
    guide.innerHTML = `<div class="g-part"></div><div class="g-title"></div><div class="g-count"></div><div class="g-head"></div><div class="g-say"></div><div class="g-keys"></div><div class="g-note" hidden></div><div class="g-foot"><div class="g-time"></div><div class="g-dots"></div><div class="g-btns"><button type="button" class="back">◂ Back</button><button type="button" class="replay" title="Play this step again">↻</button><button type="button" class="next">Next ▸</button></div><img class="g-logo" alt="" src="../eqsans_intro/assets/logo_color.png"></div>`;
    slide.append(guide, screen);
    const g = (s) => guide.querySelector(s);
    g('.g-part').textContent = demo.part; g('.g-title').textContent = demo.title;
    const dots = demo.steps.map((_, i) => { const d = h('i'); d.onclick = (e) => { e.stopPropagation(); player.goto(i); }; g('.g-dots').append(d); return d; });
    const player = { runId: 0, k: -1, busy: false, n: demo.steps.length };

    // How long each step's animation runs: play the whole demo once on a screen that is never shown, counting the waits.
    const durations = demo.steps.map(() => null);
    (async () => {
      const z = win.z, world = demo.build(h('div'));
      for (let i = 0; i < demo.steps.length; i++) {
        const m = meter();
        try { await demo.steps[i].run(m, world); } catch (e) { /* a step that needs the real screen: its length stays unknown */ continue; }
        durations[i] = m.total;
      }
      win.z = z;
    })();
    player.durations = durations;

    // The time bar along the bottom of the screen: fills while a step plays, turns green when it has finished.
    const secs = (ms) => Math.max(1, Math.round(ms / 1000));
    function timebar(id, k, animate) {
      const bar = screen.querySelector('.tbar'), fill = bar.firstChild, label = g('.g-time');
      const done = () => { if (player.runId !== id) return; bar.className = 'tbar done'; fill.style.width = '100%'; label.className = 'g-time done'; label.innerHTML = '<b>✓</b> Finished'; };
      if (!animate) { done(); return done; }
      const t0 = performance.now();
      bar.className = 'tbar play'; label.className = 'g-time play';
      (function tick() {
        if (player.runId !== id || bar.classList.contains('done')) return;
        const el = performance.now() - t0, est = durations[k];
        if (est) { fill.style.width = (Math.min(el / est, 0.97) * 100) + '%'; label.innerHTML = `<b>▶</b> Playing <span>${Math.min(secs(el), secs(est))} / ${secs(est)} s</span>`; }
        else { bar.classList.add('unknown'); label.innerHTML = '<b>▶</b> Playing'; }
        requestAnimationFrame(tick);
      })();
      return done;
    }

    function showGuide(k) {
      const s = demo.steps[k];
      g('.g-count').textContent = `Step ${k + 1} of ${demo.steps.length}`;
      g('.g-head').textContent = s.head;
      g('.g-say').innerHTML = s.say || '';
      g('.g-keys').innerHTML = (s.keys || []).length ? `<div class="lab">${s.keysLabel || 'Type'}</div>` + s.keys.map((kx) => typeof kx === 'string' ? `<div class="g-key">${esc(kx)}</div>` : `<div class="g-key press">${kx.press}</div>`).join('') : '';
      g('.g-note').hidden = !s.note; g('.g-note').innerHTML = s.note || '';
      dots.forEach((d, i) => { d.className = i < k ? 'done' : i === k ? 'here' : ''; });
      g('.back').disabled = false; g('.next').textContent = k === demo.steps.length - 1 ? 'Next part ▸' : 'Next ▸';
    }
    player.goto = async (k, animate = true) => {
      k = Math.max(0, Math.min(demo.steps.length - 1, k));
      const id = ++player.runId; player.k = k;
      showGuide(k);
      screen.innerHTML = '<div class="topbar"><span>Activities</span><span>Terminal ▾</span><span>analysis.sns.gov</span><span class="sp">' + (window.DEMO_CLOCK || 'Thu Nov 19  09:12') + '</span><span style="width:330px"></span></div><div class="tbar"><i></i></div>';
      win.z = 10;
      const world = demo.build(screen);
      try {
        const fastCtx = context(player, true);
        for (let i = 0; i < k; i++) await demo.steps[i].run(fastCtx, world);
        player.busy = true;
        const finished = timebar(id, k, animate);
        await demo.steps[k].run(context(player, !animate), world);
        finished();
      } catch (e) { if (e !== CANCEL) console.error(e); }
      if (player.runId === id) player.busy = false;
    };
    player.next = () => { if (player.k >= demo.steps.length - 1) return false; player.goto(player.k + 1); return true; };
    player.prev = () => { if (player.k <= 0) return false; player.goto(player.k - 1, false); return true; };
    player.replay = () => player.goto(player.k);
    player.stop = () => { player.runId++; };
    g('.next').onclick = (e) => { e.stopPropagation(); if (!player.next() && demo.onEnd) demo.onEnd(); };
    g('.back').onclick = (e) => { e.stopPropagation(); if (!player.prev() && demo.onStart) demo.onStart(); };
    g('.replay').onclick = (e) => { e.stopPropagation(); player.replay(); };
    guide.addEventListener('click', (e) => e.stopPropagation());
    screen.addEventListener('click', (e) => e.stopPropagation());
    return player;
  }

  window.Demo = { mount, win, term, editor, browser, sansbook, sansdir, figure, esc, h, md };
})();
