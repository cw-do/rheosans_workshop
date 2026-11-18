/* =====================================================================
   THE THREE DEMOS — what is typed and what appears, step by step.

   Sources (see README.md, "Where the demo content comes from"):
     script   reduce_template.py (reduce_R1.py with its seven run lists emptied, made by
              prepare_assets.py and also put in the experiment's shared folder) and the
              run list of IPTS-37681 in ONCat; the lists are filled with the real values
     sansbook the recorded session of shared/user/sansbook (2026-11-03), with the
              folder names changed to the attendee's own; the summary-page turn and
              the page it ends on are reconstructed (make_report.py)
     sansdir  the keys and screens of sansdir 0.12.3 driven on the cluster; the 2D
              tile figures were made there by sansdir's own plot code
   USER is the example user ID shown everywhere ("use your own").
   ===================================================================== */
(function () {
  'use strict';
  const D = window.Demo, DATA = window.DEMO_DATA, esc = D.esc;
  const USER = 'abc', HOST = 'analysis-node05';
  const SHARED = '/SNS/EQSANS/IPTS-37681/shared', MINE = `${SHARED}/${USER}`;
  const GPFS = `/gpfs/neutronsfs/instruments/EQSANS/IPTS-37681/shared/${USER}`;
  const ROLE = { samscatt: 'r-ss', samtrans: 'r-st', bkgscatt: 'r-bs', bkgtrans: 'r-bt', emptybeam: 'r-eb', sample_thick: '', sample_names: '' };
  const ARR = Object.keys(ROLE);

  /* ================================================================
     1 · SCRIPT-BASED REDUCTION
     ================================================================ */
  // The script, coloured. The seven lists start empty, as in reduce_template.py; every entry that will be typed in is its own
  // span (hidden until then, with the comma that goes before it) so it can appear, be typed and be lit up.
  const relist = (line) => Array.from(line.querySelectorAll('.e:not(.todo)')).forEach((e, k) => e.classList.toggle('first', k === 0));
  function scriptLines(ed) {
    let cfg = -1;
    const colour = (line) => {
      if (/^\s*#/.test(line)) return `<span class="k-com">${esc(line)}</span>`;
      // strings first, keywords only outside them (and never inside the markup this adds)
      return line.split(/('[^']*'|"[^"]*")/).map((t, k) => k % 2 ? `<span class="k-str">${esc(t)}</span>`
        : esc(t).replace(/\b(from|import|for|in|range|len|float|str)\b/g, '<span class="k-kw">$1</span>')).join('');
    };
    DATA.script.forEach((line) => {
      const m = line.match(/^(samscatt|samtrans|bkgscatt|bkgtrans|emptybeam|sample_thick|sample_names) = \[\]$/);
      if (/^# Configuration: /.test(line)) { cfg++; ed.line(colour(line), 'cfg' + cfg); return; }
      if (m) {
        const spans = DATA.lists[cfg][m[1]].map((v, i) => `<span class="e todo" data-a="${m[1]}" data-c="${cfg}" data-i="${i}"><span class="sep">, </span><span class="v"></span></span>`).join('');
        ed.line(`<span class="k-var">${m[1]}</span> = [${spans}]`, `a${cfg}-${m[1]}`);
        return;
      }
      ed.line(colour(line), /^output_directory/.test(line) ? 'outdir' : /^# Stitching:/.test(line) ? 'stitch' : /^overlap = /.test(line) ? 'overlap' : null);
    });
  }
  /* ONCat as it really looks (v3.16, seen 2026-11-17 in a 682 px wide window). The landing, sign-in, instrument and
     experiment pages are screenshots of the real pages (assets/oncat/); the run list is rebuilt here from the same
     colours, fonts and columns so that rows can be lit up, with the run data read off the real page. */
  const shot = (name) => `<div class="oc-shot"><img src="assets/oncat/${name}.png" alt=""></div>`;
  const ocBar = (crumbs) => `<div class="oc-bar"><span class="oc-logo">${DATA.oncat_logo}</span><b>ONCat</b>${crumbs.map((x, k) => (k ? '<i class="oc-chev">›</i>' : '') + `<span class="oc-pill">${x}</span>`).join('')}<span class="oc-user"><span class="oc-chip">ccd</span>(Do…</span><span class="oc-logout">Logout</span></div>`;
  // the instrument page: real banner above, and below it the one experiment a member of IPTS-37681 is shown
  function oncatInstrumentPage() {
    return `<div class="oc-shot"><img src="assets/oncat/eqsans.png" alt=""></div><div class="oc-latest"><p>Of the experiments you have permission to see, the table shows the experiments with the most recently acquired raw data.</p>
      <div class="oc-exp" id="ipts"><span class="oc-expicon"></span><b>IPTS-37681</b><span class="pi"></span><span class="ago">2 months ago</span><i class="chev">›</i>
        <div class="ti">RheoSANS School, EQ-SANS, SNS – November 2026</div><div class="sa">10 mM CTAB + 50 mM Sodium Salicylate in D2O</div></div></div>`;
  }
  function oncatRunsPage() {
    const ids = DATA.oncat.map((r) => `<div class="oc-id" data-run="${r.run}" data-cfg="${r.cfg}"><span class="m">⋯</span><span class="n"><i>#</i>${String(r.run).replace(/(\d{3})$/, ',$1')}</span><span class="c">›</span></div>`).join('');
    const rows = DATA.oncat.map((r) => `<div class="oc-r" data-run="${r.run}" data-cfg="${r.cfg}"><span class="c-st">${r.start}</span><span class="c-st">${r.end}</span><span class="c-du">${r.dur}</span><span class="c-ti">${esc(r.title)}</span><span class="c-tc">${r.counts}</span><span class="c-pc">${r.charge}</span><span class="c-wl">${r.wl}</span></div>`).join('');
    return `<div class="oc">${ocBar(['Instruments', 'SNS / EQSAN'])}
      <div class="oc-tools"><span class="oc-ref">⟳</span><a>Search Runs</a><span class="oc-sel">Common Run Info<i>⌄</i></span><a>Configure Tables</a><a class="csv">Download as CSV</a><span class="oc-sort"><i class="on">↑</i><i>↓</i></span></div>
      <div class="oc-grid">
        <div class="oc-idhead">ID</div>
        <div class="oc-head"><div class="oc-x"><div class="oc-group">General</div><div class="oc-cols"><span class="c-st">Start Time</span><span class="c-st">End Time</span><span class="c-du">Duration<small>(HH:MM:SS)</small></span><span class="c-ti">Title</span><span class="c-tc">Total Counts</span><span class="c-pc">Proton Charge<small>(C)</small></span><span class="c-wl">wavelength.skf1</span></div></div></div>
        <div class="oc-ids"><div class="oc-y">${ids}</div></div>
        <div class="oc-body"><div class="oc-x oc-y">${rows}</div></div>
      </div><div class="oc-rbar"></div><div class="oc-fab">⌕</div></div>`;
  }

  const script = {
    part: 'Part 1 of 3', title: 'Reduction with a script',
    build(screen) {
      const w = {};
      w.term = D.term(screen, 22, 44, 1406, 1014, USER, HOST);
      w.ed = D.editor(screen, 22, 44, 716, 1014, `reduce_template.py (${MINE}) - gedit`);
      w.br = D.browser(screen, 750, 44, 678, 1014);
      scriptLines(w.ed);
      w.entry = (a, cfg, i) => w.ed.inner.querySelector(`.e[data-a="${a}"][data-c="${cfg}"][data-i="${i}"]`);
      w.row = (run) => w.br.page.querySelector(`.oc-r[data-run="${run}"]`);
      // light up (or clear) a run: its ID cell and its row
      w.mark = (run, classes, on = true) => w.br.page.querySelectorAll(`[data-run="${run}"]`).forEach((e) => classes.forEach((k) => e.classList.toggle(k, on)));
      w.cfgOnly = (cfg) => w.br.page.querySelectorAll('.oc-r, .oc-id').forEach((e) => { e.classList.remove('r-ss', 'r-st', 'r-bs', 'r-bt', 'r-eb', 'now'); e.classList.toggle('cfg-off', !!cfg && e.dataset.cfg !== cfg); });
      w.scrollX = (x) => { const g = w.br.page.querySelector('.oc-grid'); if (g) g.style.setProperty('--sx', x + 'px'); };
      // scroll the run list only as far as it takes to bring a run into view
      w.toRun = (run) => {
        const r = w.row(run), g = w.br.page.querySelector('.oc-grid'); if (!r || !g) return;
        const H = g.querySelector('.oc-body').offsetHeight, all = r.parentNode.offsetHeight, y = w.ocY || 0, top = r.offsetTop, pad = 0;
        const ny = top < y + pad ? top - pad : top + r.offsetHeight > y + H - pad ? top + r.offsetHeight - H + pad : y;
        w.ocY = Math.max(0, Math.min(ny, all - H)); g.style.setProperty('--sy', w.ocY + 'px');
      };
      // put one sample's seven entries into the lists; slow = one at a time with its ONCat row lit up
      w.fill = async (c, cfg, i, slow) => {
        for (const a of ARR) {
          const e = w.entry(a, cfg, i), v = e.querySelector('.v'), run = DATA.lists[cfg][a][i], full = `'${run}'`, row = /^\d+$/.test(run) ? w.row(run) : null;
          const appear = () => { e.classList.remove('todo'); relist(e.parentNode); };
          if (slow) {
            if (row) { w.toRun(run); w.mark(run, [ROLE[a], 'now']); }
            v.textContent = ''; appear(); v.classList.add('now');
            await c.sleep(row ? 500 : 200); await c.type(v, full, 45); await c.sleep(650);
            v.classList.remove('now'); if (ROLE[a]) v.classList.add(ROLE[a]); if (row) w.mark(run, ['now'], false);
          } else { v.textContent = full; appear(); if (ROLE[a]) v.classList.add(ROLE[a]); if (row) { w.mark(run, [ROLE[a]]); if (c.alive() && !c.fast) w.toRun(run); } }
        }
      };
      return w;
    },
    steps: [
      { head: 'Open a terminal on the analysis cluster',
        say: 'Sign in at <b>analysis.sns.gov</b> and open a terminal. Everything today happens in the experiment’s shared folder.',
        note: `<code>${USER}</code> stands for <b>your own user ID</b> in everything that follows.`,
        async run(c, w) { w.term.show(); w.term.prompt(); await c.sleep(300); } },
      { head: 'Go to the shared folder', keys: [`cd ${SHARED}`, 'ls'],
        say: 'Every experiment has one. <code>reduce_template.py</code> is a reduction script for this experiment with its run lists left empty: the one you will fill in.',
        async run(c, w) {
          await w.term.run(c, `cd ${SHARED}`, null, { cwd: SHARED });
          await w.term.run(c, 'ls', { html: true, text: '<span class="ls-dir">autoreduce</span>  <span class="ls-dir">ccd</span>  <span class="ls-dir">output</span>  reduce_R1.py  reduce_template.py  <span class="ls-dir">user</span>' });
        } },
      { head: 'Make a folder of your own', keys: [`mkdir ${USER}`],
        say: 'Name it after your user ID, so your files stay apart from everyone else’s.',
        async run(c, w) { await w.term.run(c, `mkdir ${USER}`); } },
      { head: 'Copy the blank script into it', keys: [`cp reduce_template.py ${USER}/`, `cd ${USER}`, 'ls'],
        say: 'You will fill in your own copy, not the original.',
        async run(c, w) {
          await w.term.run(c, `cp reduce_template.py ${USER}/`);
          await w.term.run(c, `cd ${USER}`, null, { cwd: MINE });
          await w.term.run(c, 'ls', 'reduce_template.py');
        } },
      { head: 'Open the script', keys: ['gedit reduce_template.py &'],
        say: 'A drtsans script is a <b>table written as Python lists</b>: one entry per sample in each list. Seven lists for each configuration, and <b>all of them are empty</b>. You fill them in from the catalog.',
        note: 'The comment at the top of the file says what goes into each list.',
        async run(c, w) {
          await w.term.run(c, 'gedit reduce_template.py &', '[1] 48213');
          await c.sleep(400);
          w.term.move(750, 44, 678, 1014); w.ed.show(); await c.sleep(500);
        } },
      { head: 'Send the output to your folder', keysLabel: `Change line ${DATA.script.findIndex((l) => l.startsWith('output_directory')) + 1} to`, keys: [`output_directory = "${MINE}/output"`],
        say: 'The first thing to fill in: where the reduced files go. Put your user ID in place of <code>USER_ID</code>.',
        note: 'The script refuses to run while it still says USER_ID.',
        async run(c, w) {
          const line = w.ed.get('outdir'); w.ed.scrollTo('outdir', 330); w.ed.hl('outdir'); await c.sleep(700);
          const s = line.querySelector('.k-str'); s.textContent = `"${SHARED}/`;
          await c.sleep(400); await c.type(s, `${USER}/output"`, 70); await c.sleep(500);
        } },
      { head: 'Open ONCat and sign in', keys: ['oncat.ornl.gov'], keysLabel: 'In a browser',
        say: 'ONCat is the catalog of every run at SNS and HFIR. <b>Login</b> takes you to the ORNL sign-in page; use your UCAMS or XCAMS account.',
        async run(c, w) {
          w.ed.hl('outdir', false); w.br.show();
          await w.br.go(c, 'oncat.ornl.gov', 'ONCat', shot('landing_signed_out'), true);
          await c.sleep(900); await w.br.clickAt(c, 0.83, 0.026);
          await w.br.go(c, 'https://extidp.ornl.gov/as/authorization.oauth2?client_id=367334fd-29fc-4951…', 'ORNL Collaboration Login', shot('login'));
          await c.sleep(1300); await w.br.clickAt(c, 0.775, 0.318);
          await w.br.go(c, 'https://oncat.ornl.gov/', 'ONCat', shot('landing'));
          await c.sleep(500);
        } },
      { head: 'Browse to the runs of the experiment', keysLabel: 'Click', keys: [{ press: 'Browse → EQ-SANS → IPTS-37681 → Runs' }],
        say: 'Scroll down to <b>Browse</b>, pick <b>EQ-SANS</b> in the SNS column, then your experiment, then <b>Runs</b>. You only see the experiments you are a member of.',
        async run(c, w) {
          await c.sleep(600); await w.br.go(c, 'https://oncat.ornl.gov/', 'ONCat', shot('landing_browse'));
          await c.sleep(900); await w.br.clickAt(c, 0.224, 0.63);
          await w.br.go(c, 'https://oncat.ornl.gov/instruments', 'ONCat', shot('instruments'));
          await c.sleep(1000); await w.br.clickAt(c, 0.62, 0.79);
          await w.br.go(c, 'https://oncat.ornl.gov/instruments/SNS/EQSANS', 'ONCat', oncatInstrumentPage());
          await c.sleep(1000); await w.br.click(c, '#ipts');
          await w.br.go(c, 'https://oncat.ornl.gov/experiments/SNS/EQSANS/IPTS-37681', 'ONCat', shot('experiment'));
          await c.sleep(1100); await w.br.clickAt(c, 0.722, 0.432);
          await w.br.go(c, 'https://oncat.ornl.gov/runs/SNS/EQSANS/IPTS-37681', 'ONCat', oncatRunsPage());
          w.ocY = 0; await c.sleep(400);
        } },
      { head: 'Read the run titles', keysLabel: 'In the table', keys: [{ press: 'Scroll right to the <b>Title</b> column' }],
        say: 'The title says what a run is. <b>S-</b> is a scattering run, <b>T-</b> a transmission run, <b>T-empty beam</b> the direct beam. Each exists for <b>1,3</b> and <b>2,3</b>, and for both configurations. Newest runs are on top.',
        note: 'Titles starting with <code>--</code> are notes and aborted runs. Skip them.',
        async run(c, w) {
          await c.sleep(600); w.scrollX(300); await c.sleep(900);
          for (const [run, cls] of [[188929, 'r-ss'], [188923, 'r-st'], [188918, 'r-eb']]) { w.toRun(run); w.mark(run, [cls, 'now']); await c.sleep(900); w.mark(run, ['now'], false); }
          await c.sleep(300); for (const run of [188929, 188923, 188918]) w.mark(run, ['r-ss', 'r-st', 'r-eb'], false);
        } },
      { head: 'One sample needs five runs',
        say: 'Take <b>CTAB, 1,3, no shear, 4m2.5a</b>: its scattering and transmission, the empty cup-and-bob as background with <i>its</i> transmission, and the empty beam. Then the thickness in cm and a name. That is <b>one entry in each of the seven lists</b>.',
        async run(c, w) {
          w.ed.scrollTo('a0-samscatt', 190); w.cfgOnly('4m2.5a');
          await c.sleep(600); await w.fill(c, 0, 2, true);
        } },
      { head: 'Do the same for every sample',
        say: 'Fourteen entries per list for 4m2.5a, in the same order in every list. The <b>2,3</b> samples take the 2,3 background and the 2,3 empty beam. The empty cup-and-bob itself has no background: <code>\'\'</code>.',
        async run(c, w) {
          for (const i of [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) { await w.fill(c, 0, i, false); await c.sleep(230); }
        } },
      { head: 'Second configuration: 8m10a',
        say: 'The same seven lists once more, with the 8m10a run numbers. A wrong number here gives a wrong curve and no error message, which is why the titles matter.',
        async run(c, w) {
          w.cfgOnly('8m10a');
          w.ed.scrollTo('a1-samscatt', 190); w.toRun(188950); await c.sleep(700);
          for (let i = 0; i < 14; i++) { await w.fill(c, 1, i, false); await c.sleep(170); }
        } },
      { head: 'The end of the script stitches',
        say: 'Nothing to fill in here. Once both configurations are reduced, the script takes each sample’s <b>8m10a</b> curve (low q), scales it onto its <b>4m2.5a</b> curve (high q) where the two overlap, and writes them as one curve: <code>merged_&lt;sample&gt;_Iq.txt</code>.',
        note: '<code>overlap</code> is the q range, in Å⁻¹, in which the two curves are matched.',
        async run(c, w) {
          w.cfgOnly(null); w.ed.scrollTo('stitch', 330); await c.sleep(700); w.ed.hl('overlap'); await c.sleep(600);
        } },
      { head: 'Check with the answer key', keys: ['grep "^samscatt" reduce_template.py ../reduce_R1.py'],
        say: 'Now it can be told: <code>reduce_R1.py</code> in the shared folder is the <b>answer key</b>, this same script with every list filled in. Save your file and compare before you run anything.',
        note: 'The same numbers in the same order? Then try the other lists the same way.',
        async run(c, w) {
          w.term.move(22, 400, 1406, 658); w.term.front(); await c.sleep(500);
          const row = (file, cfg) => `${file}:samscatt = [${DATA.lists[cfg].samscatt.map((r) => `'${r}'`).join(', ')}]`;
          await w.term.run(c, 'grep "^samscatt" reduce_template.py ../reduce_R1.py',
            [row('reduce_template.py', 0), row('reduce_template.py', 1), { text: row('../reduce_R1.py', 0), cls: 'ok' }, { text: row('../reduce_R1.py', 1), cls: 'ok' }]);
        } },
      { head: 'Run it', keys: ['drtsans reduce_template.py'],
        say: 'One reduction per sample and configuration: <b>28 in all, about a minute each</b>. drtsans loads the runs, applies the corrections and writes the files.',
        async run(c, w) {
          w.term.move(22, 400, 1406, 658); w.term.front(); await c.sleep(500);
          await w.term.run(c, 'drtsans reduce_template.py', null, { hold: true });
          const fix = (l) => l.replace(/shared\/ccd\//g, `shared/${USER}/`).replace('CTAB_1,3_0shear', 'EmptyCupBob_1,3_0shear').replace(/188929/g, '188908');
          await c.stream(DATA.log_head.map(fix), (l) => w.term.out(l, 'dim'), 55);
          w.term.out('  …', 'dim'); await c.sleep(500);
          await c.stream(DATA.log_tail.map(fix), (l) => w.term.out(l, 'dim'), 70);
          // the next reductions start the same way; only their first line is shown
          const first = (name) => `Run "ipython /SNS/EQSANS/shared/script/eqsanstools/eqsans_reduction.py ${MINE}/output/${name}.json" in the "sans" pixi environment`;
          w.term.out(first('EmptyCupBob_2,3_0shear_4m2.5a_4m2.5a'), 'dim'); await c.sleep(600);
          w.term.out('  …', 'dim'); await c.sleep(400);
          w.term.out(first('CTAB_2,3_0shear-return_8m10a_8m10a'), 'dim'); await c.sleep(600);
          w.term.out('  …', 'dim'); w.term.out('Python-[Warning] ...plotting completed.', 'dim'); await c.sleep(500);
          // then the stitching part: one notice and one line per sample (the factors are the ones drtsans printed for these curves)
          w.term.out('Python-[Notice] Stitching profile 0 to profile 1. Scale factor is 2.739e+00', 'dim');
          w.term.out('.... stitched: merged_EmptyCupBob_1,3_0shear_Iq.txt', 'dim'); await c.sleep(500);
          w.term.out('  …', 'dim'); await c.sleep(400);
          w.term.out('Python-[Notice] Stitching profile 0 to profile 1. Scale factor is 4.458e+00', 'dim');
          w.term.out('.... stitched: merged_CTAB_2,3_0shear-return_Iq.txt', 'dim'); w.term.prompt();
        } },
      { head: 'Look at what came out', keys: ['ls output | head -14', 'ls output/*_Iq.dat | wc -l', 'ls output/merged_* | wc -l'],
        say: 'For every sample and configuration: <code>_Iq.dat</code> is I(q), <code>_Iqxqy.dat</code> the 2D pattern, with a picture of each and the full record of the reduction. And for every sample one <code>merged_…_Iq.txt</code>: the two configurations stitched.',
        async run(c, w) {
          const s = 'CTAB_1,3_0.1shear_4m2.5a_4m2.5a';
          const kinds = ['.err', '.json', '.out', '_bkgd_188904_raw_trans.txt', '_bkgd_188904_trans.txt', '_Iq.dat', '_Iq.png', '_Iqxqy.dat', '_Iqxqy.h5', '_Iqxqy.png', '_processed.nxs', '_raw_trans.txt', '_reduction_log.hdf', '_trans.txt'];
          await w.term.run(c, 'ls output | head -14', kinds.map((k) => ({ text: s + k, cls: /_Iq\.dat|_Iqxqy\.dat/.test(k) ? 'ok' : 'out' })));
          await w.term.run(c, 'ls output/*_Iq.dat | wc -l', '28');
          await w.term.run(c, 'ls output/merged_* | wc -l', '14');
        } },
    ],
  };

  /* ================================================================
     2 · SANSBOOK
     ================================================================ */
  const T = {
    guide: '<span class="tg">└── </span>',
    reductions: { html: '▼ <b>Reductions</b>' },
    r1: (extra, here) => ({ html: `${T.guide}<b>○ R1</b> ipts37681_copy <span class="dim">${extra}</span>${here ? ' <span class="rvc">reductions go here</span>' : ''}` }),
    s0a: { html: '▼ <b>◆ S0a</b> R1 reduced I(q) and I(qx,qy) <span class="dim">(56) ⚠1 a.u. ← R1</span>' },
    s1: (cur) => ({ html: `${T.guide}<span class="live">● S1</span> reduction_summary${cur ? ' <span class="rvw">current page</span>' : ''}`, cursor: cur }),
  };
  const sansbook = {
    part: 'Part 2 of 3', title: 'Reduction by asking: sansbook',
    build(screen) {
      const w = {};
      w.term = D.term(screen, 22, 44, 1406, 1014, USER, HOST); w.term.cwd(MINE);
      w.sb = D.sansbook(w.term.body, '0.3.11');
      w.term2 = D.term(screen, 380, 590, 1010, 250, USER, HOST); w.term2.cwd(MINE);
      w.br = D.browser(screen, 60, 60, 1330, 990);
      return w;
    },
    steps: [
      { head: 'Start sansbook in your folder', keys: [`cd ${MINE}`, 'sansbook'],
        say: 'sansbook keeps a notebook of the analysis, a <b>book</b>, in the folder where you start it. There is none here yet, so it asks.',
        note: 'If the command is not found, use the full path: <code>/SNS/EQSANS/shared/script/sansbook/bin/sansbook</code>',
        async run(c, w) {
          w.term.show(); w.term.cwd(SHARED); w.term.prompt();
          await w.term.run(c, `cd ${MINE}`, null, { cwd: MINE });
          await w.term.run(c, 'sansbook', null, { hold: true });
          await c.sleep(500); w.term.title('sansbook (v0.3.11)'); w.sb.on();
          w.sb.start(`<b>sansbook</b> (v0.3.11) — no book in <b>${MINE}</b>  (IPTS-37681)\nWhat would you like to do?<div class="sb-opts"><div class="sel">Start an empty book in ./sansbook  <span class="dim">(add data later: tell the agent where it is)</span></div><div>Quit</div></div>`.replace('\n', '<br>'));
          await c.sleep(300);
        } },
      { head: 'Start an empty book', keysLabel: 'Press', keys: [{ press: '<kbd>Enter</kbd>' }],
        say: 'Left: the pages of the book and the output of scripts. Right: the conversation. The blue lines on top say which page you are on and <b>where reductions will be written</b>.',
        async run(c, w) {
          await c.sleep(500); w.sb.startOff();
          w.sb.status({ title: 'IPTS-37681 sansbook', path: `${MINE}/sansbook`, out: `${MINE}/output` });
          w.sb.tree([]);
          w.sb.add('notice', `Book IPTS-37681 sansbook (IPTS-37681) at ${GPFS}/sansbook\nModel openai/gpt-6-luna. Ask anything about the data; :help lists commands, Esc stops an answer.`);
          w.sb.promptText(); await c.sleep(300);
        } },
      { head: 'Ask for the reduction', keys: ['reduce data from ipts-37681 into ./output'],
        say: 'Plain words are enough. sansbook looks for what already exists for this experiment before it does anything, and <b>asks when there is a choice</b>.',
        async run(c, w) {
          await w.sb.send(c, 'reduce data from ipts-37681 into ./output');
          await w.sb.work(c, [
            { call: 'record_decision {"text": "Use ./output as the reduction output directory for IPTS-37681.", "by": "user", "tag": "reduction"}', ret: 'D1 recorded (user): Use ./output as the reduction output directory for IPTS-37681.', cost: 0.002 },
            { call: 'find_eqsanscli_sessions {"ipts": "37681"}', ret: `${SHARED}/.eqsanscli/sessions/R1.json — IPTS-37681, 28 rows {'done': 28}, configs ['4m2.5a', '8m10a'], modified 2026-11-03 12:00, eqsanscli 0.54.4, output ${SHARED}/ccd/output, sc`, cost: 0.003 },
            { think: 900, cost: 0.004 },
          ]);
          w.sb.add('question', `? The existing IPTS-37681 session has 28 rows already reduced in \`${SHARED}/ccd/output\`, not \`./output\`. For the requested output folder, should I copy those reduced files there without reducing again, or reduce the 28 rows again into \`./output\`?\n   1. Copy the already reduced files into ./output\n   2. Reduce all 28 rows again into ./output\n   (answer with the number, or in your own words)`);
          w.sb.add('tool', '[3 call(s), $0.004, question]'); w.sb.promptText();
        } },
      { head: 'Take the files that are already reduced', keys: ['1'],
        say: 'Reducing again takes about half an hour; today we <b>copy</b>. The work appears in the book as reduction <b>R1</b>, with the record of how the files were made.',
        async run(c, w) {
          await w.sb.send(c, '1', '1  → Copy the already reduced files into ./output');
          await w.sb.work(c, [
            { call: 'set_output_dir {"path": "./output"}', ret: `reduction output → ${GPFS}/output`, cost: 0.005, do: () => w.sb.status({ out: `${GPFS}/output` }) },
            { call: 'start_reduction {"slug": "ipts37681_copy", "note": "Continue the existing IPTS-37681 experiment, copying its already reduced rows into the requested ./output fold…', wait: 2600, ret: 'R1 opened (its own session in reductions/R1_ipts37681_copy/reduction/).', cost: 0.006,
              do: () => { w.sb.status({ red: 'R1' }); w.sb.tree([T.reductions, T.r1('open', true)]); } },
            { call: 'inspect_reduction {}', ret: `IPTS-37681: 28 rows ({'done': 28}); output ${GPFS}/output`, cost: 0.008 },
            { think: 700 },
          ]);
          w.sb.add('assistant', `Copied the existing IPTS-37681 reductions into \`./output\` (resolved to \`${GPFS}/output\`). The copied set includes all 28 completed rows and 14 merged files; **no rows were re-reduced**. The work is in R1.`);
          w.sb.add('tool', '[4 call(s), $0.008]'); w.sb.promptText();
        } },
      { head: 'Ask for a summary page', keys: ['create a summary page: plot the reduced I(q) and the 2D Iqxqy maps for each configuration'],
        say: 'It freezes the files it will use as a source (<b>S0a</b>), opens a page (<b>S1</b>), writes a plotting script, runs it and <b>looks at the figures</b> before it answers.',
        note: 'The wording of its answer changes from run to run. What stays: a source, a page, a script, a figure check.',
        async run(c, w) {
          await w.sb.send(c, 'create a summary page: plot the reduced I(q) and the 2D Iqxqy maps for each configuration');
          await w.sb.work(c, [
            { call: 'make_source {"reduction": "R1", "pattern": "*_Iq*.dat", "title": "R1 reduced I(q) and I(qx,qy)", "note": "Frozen reduced I(q) and I(qx,qy) files of the copied IPTS-37…', wait: 1100, ret: 'S0a made from R1: 56 files, unit a.u., 1 warning, 3 info', cost: 0.011,
              do: () => w.sb.tree([T.reductions, T.r1('open → S0a', true), T.s0a]) },
            { call: 'new_page {"parents": ["S0a"], "slug": "reduction_summary", "question": "For each configuration, what do the reduced I(q) curves and the 2D I(qx,qy) maps of this…', ret: 'S1 created at pages/S1_reduction_summary/ (sources S0a); it is the current page. Next: write_script, run_script, look_at_figure, close_page.', cost: 0.014,
              do: () => { w.sb.status({ page: 'S1' }); w.sb.tree([T.reductions, T.r1('open → S0a', true), T.s0a, { html: `${T.guide}<span style="color:#00ffff">○ S1</span> reduction_summary <span class="rvw">current page</span>`, cursor: true }]); } },
            { think: 1500, call: 'write_script reduction_summary.py (41 lines)', ret: 'wrote pages/S1_reduction_summary/reduction_summary.py (41 lines); run it with run_script', cost: 0.019 },
            { call: 'run_script reduction_summary.py', runlog: '$ reduction_summary.py\n4m2.5a: 14 I(q) curves, 14 maps\n8m10a: 14 I(q) curves, 14 maps\nwrote 30 figures', wait: 2800, ret: 'S1 run 1: OK in 21.4 s', cost: 0.021 },
            { call: 'look_at_figure pages/S1_reduction_summary/figures/s1_iq_4m2.5a.png', wait: 150, cost: 0.024 },
            { think: 150, call: 'look_at_figure pages/S1_reduction_summary/figures/s1_2d_CTAB_1,3_1000shear_8m10a.png', ret: 'figure pages/S1_reduction_summary/figures/s1_iq_4m2.5a.png attached; look for: Check that all 14 curves are drawn with readable axes and legend.', cost: 0.027 },
            { call: 'close_page {"verdict": "live", "result": "S1 shows 2 I(q) overlays (14 curves each) and 28 I(qx,qy) maps for the configurations 4m2.5a and 8m10a, with the complete r…', ret: 'S1 closed as live; log entry written, STATE.md updated.', cost: 0.029,
              do: () => w.sb.tree([T.reductions, T.r1('open → S0a', true), T.s0a, T.s1(true)]) },
            { think: 900, cost: 0.031 },
          ]);
          w.sb.add('assistant', 'Created **S1**, the reduction summary page. For each configuration (4m2.5a and 8m10a) it shows an overlay of the 14 reduced I(q) curves and a gallery of the 14 I(qx,qy) maps, with the full reduction table (28 rows).\n\nIntensities are in relative units (a.u.). View the page at `report/index.html#S1`.');
          w.sb.add('tool', '[7 call(s), $0.031]'); w.sb.promptText();
        } },
      { head: 'Open the report', keysLabel: 'In a second terminal', keys: ['firefox sansbook/report/index.html &'],
        say: 'The report is rebuilt after every answer that changes the book. It is one HTML file inside the book folder; open it in a browser on the cluster.',
        async run(c, w) {
          w.term2.show(); w.term2.prompt();
          await w.term2.run(c, 'firefox sansbook/report/index.html &', '[1] 51877');
          await c.sleep(500); w.br.show();
          await w.br.go(c, `file://${MINE}/sansbook/report/index.html#S1`, 'IPTS-37681 sansbook — sansbook', '<iframe src="assets/report/index.html" title="sansbook report"></iframe>');
          await c.sleep(600);
        } },
      { head: 'Read the page: I(q), then the 2D maps',
        say: 'One overlay per configuration, then every 2D map. In the <b>1,3</b> plane the pattern stretches along the vorticity direction as the shear rate goes up; in <b>2,3</b> it changes much less.',
        note: 'Scroll in the page yourself, or press ↻ to watch again.',
        async run(c, w) {
          const f = w.br.page.querySelector('iframe');
          const to = async (y, ms) => { try { f.contentWindow.scrollTo({ top: y, behavior: c.fast ? 'auto' : 'smooth' }); } catch (e) { } await c.sleep(ms); };
          await c.sleep(900); await to(330, 2600); await to(1750, 3200); await to(2500, 3000);
        } },
    ],
  };

  /* ================================================================
     3 · SANSDIR
     ================================================================ */
  const KINDS = [['.err', '0 B'], ['.json', '3.9 KB'], ['.out', '38.7 KB'], ['_bkgd_188904_raw_trans.txt', '779 B'], ['_bkgd_188904_trans.txt', '782 B'], ['_Iq.dat', '4.1 KB'], ['_Iq.png', '16.8 KB'],
    ['_Iqxqy.dat', '493.7 KB'], ['_Iqxqy.h5', '202.0 KB'], ['_Iqxqy.png', '21.4 KB'], ['_processed.nxs', '86.2 MB'], ['_raw_trans.txt', '786 B'], ['_reduction_log.hdf', '658.7 KB'], ['_trans.txt', '782 B']];
  const allRows = () => {
    const rows = [{ name: '..', size: '<DIR>' }];
    for (const s of ['CTAB_1,3_0.1shear_4m2.5a_4m2.5a', 'CTAB_1,3_0.1shear_8m10a_8m10a', 'CTAB_1,3_0shear-return_4m2.5a_4m2.5a'])
      for (const [k, size] of KINDS) rows.push({ name: s + k.replace('188904', s.includes('8m10a') ? '188906' : '188904'), size });
    return rows;
  };
  const filtered = (pat, tag) => [{ name: '..', size: '<DIR>' }].concat(DATA.files.filter((f) => f.name.includes(pat)).map((f) => ({ name: f.name, size: f.size, tag })));
  const HOME_ROWS = [{ name: '..', size: '<DIR>', mod: '2026-11-19 09:13' }, { name: 'output/', size: '<DIR>', mod: '2026-11-19 09:31' }, { name: 'sansbook/', size: '<DIR>', mod: '2026-11-19 09:44' }, { name: 'reduce_template.py', size: '8.6 KB', mod: '2026-11-19 09:16' }];
  const sansdir = {
    part: 'Part 3 of 3', title: 'Browse and plot: sansdir',
    build(screen) {
      const w = {};
      w.term = D.term(screen, 22, 44, 1406, 1014, USER, HOST); w.term.cwd(MINE);
      w.sd = D.sansdir(w.term.body, '0.12.3');
      w.fig = D.figure(screen, 800, 56, 620, 1010, 'Figure 1');
      w.right = () => w.sd.pane(1, MINE, HOME_ROWS, { cursor: 0 });
      return w;
    },
    steps: [
      { head: 'Start sansdir', keys: ['sansdir'],
        say: 'A two-pane file manager that knows SANS files: it colours them by kind and plots them with one key. The keys are listed at the bottom.',
        async run(c, w) {
          w.term.show(); w.term.prompt();
          await w.term.run(c, 'sansdir', null, { hold: true });
          await c.sleep(450); w.term.title('SansdirApp'); w.sd.on();
          w.sd.pane(0, MINE, HOME_ROWS, { cursor: 0, active: true }); w.right(); w.sd.stat('4 entries');
        } },
      { head: 'Go into the reduced files', keysLabel: 'Press', keys: [{ press: '<kbd>↓</kbd> to <b>output/</b>, then <kbd>Enter</kbd>' }],
        say: 'Green is I(q), <b style="color:#f4005f">red is the 2D data</b>, blue the transmissions. Four hundred files: too many to read.',
        async run(c, w) {
          await c.sleep(500); w.sd.pane(0, MINE, HOME_ROWS, { cursor: 1, active: true }); await c.sleep(700);
          w.sd.pane(0, `${MINE}/output`, allRows(), { cursor: 0, active: true, wide: true }); w.sd.stat('400 entries');
        } },
      { head: 'Filter for the 2D files', keysLabel: 'Press', keys: [{ press: '<kbd>/</kbd> then type <b>Iqxqy.dat</b> and <kbd>Enter</kbd>' }],
        say: '<kbd>/</kbd> keeps only the names that contain what you type. <kbd>Esc</kbd> clears the filter.',
        async run(c, w) {
          await w.sd.ask(c, 'filter', 'Iqxqy.dat');
          w.sd.pane(0, `${MINE}/output`, filtered('_Iqxqy.dat'), { cursor: 0, active: true, wide: true });
          w.sd.stat('29 entries  ·  filter: <span class="flt">Iqxqy.dat</span>');
        } },
      { head: 'Tag them all', keysLabel: 'Press', keys: [{ press: '<kbd>+</kbd> then type <b>*</b> and <kbd>Enter</kbd>' }],
        say: '<kbd>+</kbd> tags by pattern; <b>*</b> is everything that is listed. <kbd>Space</kbd> tags one file at a time, <kbd>u</kbd> untags all.',
        async run(c, w) {
          await w.sd.ask(c, 'tag.glob', '*');
          w.sd.pane(0, `${MINE}/output`, filtered('_Iqxqy.dat', true), { cursor: 0, active: true, wide: true });
          w.sd.stat('29 entries  ·  28 tagged  ·  filter: <span class="flt">Iqxqy.dat</span>');
        } },
      { head: 'Plot', keysLabel: 'Press', keys: [{ press: '<kbd>p</kbd>' }],
        say: 'One 2D file gives a single map; several give an <b>array of maps on one colour scale</b>. Here all 28: both configurations, every shear rate.',
        async run(c, w) {
          await c.sleep(700); w.fig.img('assets/tile_all.png'); w.fig.show(); await c.sleep(500);
        } },
      { head: 'One configuration at a time', keysLabel: 'Press', keys: [{ press: '<kbd>u</kbd>   <kbd>/</kbd> <b>8m10a_Iqxqy</b> <kbd>Enter</kbd>' }, { press: '<kbd>+</kbd> <b>*</b> <kbd>Enter</kbd>   <kbd>p</kbd>' }],
        say: 'Narrow the filter and plot again. At 8m10a the <b>1,3</b> maps turn into a vertical streak at 100 and 1000: the micelles line up with the flow.',
        async run(c, w) {
          w.fig.show(false); await c.sleep(500);
          w.sd.pane(0, `${MINE}/output`, filtered('_Iqxqy.dat'), { cursor: 0, active: true, wide: true });
          w.sd.stat('29 entries  ·  filter: <span class="flt">Iqxqy.dat</span>');
          await w.sd.ask(c, 'filter', '8m10a_Iqxqy');
          w.sd.pane(0, `${MINE}/output`, filtered('8m10a_Iqxqy.dat'), { cursor: 0, active: true, wide: true });
          w.sd.stat('15 entries  ·  filter: <span class="flt">8m10a_Iqxqy</span>');
          await w.sd.ask(c, 'tag.glob', '*');
          w.sd.pane(0, `${MINE}/output`, filtered('8m10a_Iqxqy.dat', true), { cursor: 0, active: true, wide: true });
          w.sd.stat('15 entries  ·  14 tagged  ·  filter: <span class="flt">8m10a_Iqxqy</span>');
          await c.sleep(700); w.fig.move(560, 56, 866, 1010); w.fig.img('assets/tile_8m10a.png'); w.fig.show(); await c.sleep(400);
        } },
    ],
  };

  window.DEMOS = { script, sansbook, sansdir };
})();
