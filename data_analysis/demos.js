/* =====================================================================
   THE THREE DEMOS of the data-analysis deck — what is clicked, typed and
   answered, step by step. Played by ../data_reduction/demo.js.

   Sources (README.md, "셋째 덱"):
     sasview  SasView 6.1.3 on the analysis cluster, driven without a display
              and photographed after every action (ref/screens_sasview/).
              Every picture is the real window; the pointer, the orange
              frames and the magnified cut-outs are drawn on top here.
     fit      the recorded sansbook session of shared/user/sansbook
              (2026-11-03T171532): prompt, tool calls and answer as they were
     order    the recorded session of shared/ccd/sansbook (2026-11-03T151105):
              the three messages of the order-parameter request and the
              paragraph request, as they were — except "this page" → "page s1"
              in the first prompt, because here the fit page came in between
   Changed for the demo: the folder (shared/abc), the decision numbers of the
   order-parameter turns (D3, D4: the fit took D2), and long tool lines are
   cut with "…". Two failed look-ups in the fit turn are left out.
   ===================================================================== */
(function () {
  'use strict';
  const D = window.Demo, A = window.ANALYSIS, SV = A.sv;
  const USER = 'abc', HOST = 'analysis-node05';
  const SHARED = '/SNS/EQSANS/IPTS-37681/shared', MINE = `${SHARED}/${USER}`;
  const GPFS = `/gpfs/neutronsfs/instruments/EQSANS/IPTS-37681/shared/${USER}`;
  const FILE = 'merged_CTAB_1,3_0shear_Iq.txt';
  window.DEMO_CLOCK = 'Thu Nov 19  10:45';

  /* ================================================================
     The SasView window: real screenshots on a 1600x1040 stage
     ================================================================ */
  const SHOTS = ['01_start', '02_loaded', '03_sent', '04_category', '05_model', '06_plot_raw', '06_plot', '07_check1', '07_check2', '07_check3', '07_check4', '07_check5', '08_fit_popup', '09_fit'];
  const DLG = { x: 350, y: 180, bar: 34 };                          // where the file dialog sits on the stage
  const POP = { pop_category: SV.popups.pop_category.at, pop_model: [597, 249] };   // the model list opens under its own box (the capture screen was too narrow for that)
  function sasview(screen) {
    const K = 1406 / SV.size[0];
    const o = D.win(screen, 'svwin', 'SasView 6.1.3', 22, 52, 1406, 34 + Math.round(SV.size[1] * K));
    const st = D.h('div', 'sv-stage'); st.style.transform = `scale(${K})`; o.body.append(st);
    const shots = {};
    SHOTS.forEach((n) => { const im = new Image(); im.className = 'shot'; im.alt = ''; im.src = `assets/sasview/${n}.png`; st.append(im); shots[n] = im; });
    const pops = {};
    Object.keys(POP).forEach((n) => { const im = new Image(); im.className = 'sv-pop'; im.alt = ''; im.src = `assets/sasview/${n}.png`; im.style.left = POP[n][0] + 'px'; im.style.top = POP[n][1] + 'px'; st.append(im); pops[n] = im; });
    const dim = D.h('div', 'sv-dim'), dlg = D.h('div', 'sv-dlg', `<div class="bar">${SV.dialog.title}</div><img alt="" width="${SV.dialog.size[0]}" height="${SV.dialog.size[1]}">`);
    dlg.style.left = DLG.x + 'px'; dlg.style.top = DLG.y + 'px';
    ['dlg_folder', 'dlg_selected'].forEach((n) => { new Image().src = `assets/sasview/${n}.png`; });
    const hl = D.h('div', 'sv-hl'), ptr = D.h('div', 'sv-ptr jump', '<svg viewBox="0 0 30 30" width="30" height="30"><path d="M3 2 L3 24 L9 18.5 L13.2 28 L17 26.3 L12.9 17 L21 17 Z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg>');
    st.append(dim, dlg, hl, ptr);
    let cur = null; const zooms = [];
    o.shot = (n) => { Object.values(shots).forEach((i) => i.classList.remove('on')); shots[n].classList.add('on'); cur = n; zooms.forEach((z) => { z.querySelector('img').src = shots[n].src; }); };
    o.pop = (n) => Object.keys(pops).forEach((k) => pops[k].classList.toggle('on', k === n));
    o.dialog = (n) => { dim.classList.toggle('on', !!n); dlg.classList.toggle('on', !!n); if (n) dlg.querySelector('img').src = `assets/sasview/${n}.png`; };
    o.hl = (r) => { hl.classList.toggle('on', !!r); if (r) Object.assign(hl.style, { left: (r[0] - 6) + 'px', top: (r[1] - 6) + 'px', width: (r[2] + 4) + 'px', height: (r[3] + 4) + 'px' }); };
    // a magnified cut-out of the current screenshot: rect [x, y, w, h], scale, where to put it, a label
    o.zoom = (r, s, at, label) => {
      const z = D.h('div', 'sv-zoom', `<div class="lab">${label}</div><img alt="">`);
      Object.assign(z.style, { left: at[0] + 'px', top: at[1] + 'px', width: (r[2] * s) + 'px', height: (r[3] * s) + 'px' });
      const im = z.querySelector('img'); im.src = shots[cur].src; im.style.transform = `translate(${-r[0] * s}px, ${-r[1] * s}px) scale(${s})`;
      st.append(z); zooms.push(z); void z.offsetWidth; z.classList.add('on');
    };
    o.clear = () => { o.hl(null); o.pop(null); zooms.splice(0).forEach((z) => z.remove()); };
    o.point = async (c, x, y) => { ptr.classList.toggle('jump', !!c.fast); ptr.style.transform = `translate(${x}px, ${y}px)`; await c.sleep(620); };
    o.click = async (c, x, y) => {
      await o.point(c, x, y);
      if (!c.fast) { const ring = D.h('div', 'sv-ring'); ring.style.left = x + 'px'; ring.style.top = y + 'px'; st.append(ring); await c.sleep(480); ring.remove(); }
    };
    ptr.style.transform = 'translate(820px, 610px)';
    return o;
  }
  const mid = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
  const M = SV.marks, TABLE = [389, 281, 619, 205], CHI = [882, 622, 134, 86];
  const tick = (name) => [M['06_plot'][name][0] + 11, M['06_plot'][name][1] + 11];   // the tick box is at the left end of the row

  const sasviewDemo = {
    part: 'Part 1 of 3', title: 'Fit by hand: SasView',
    build(screen) {
      const w = {};
      w.term = D.term(screen, 22, 44, 1406, 1014, USER, HOST); w.term.cwd(MINE);
      w.sv = sasview(screen);
      return w;
    },
    steps: [
      { head: 'Start SasView', keys: ['sasview &'],
        say: 'SasView is installed on the analysis cluster. Start it from a terminal on the remote desktop; the window takes a few seconds to come up.',
        note: 'The first time, a <b>What’s New</b> window opens on top. Close it.',
        async run(c, w) {
          w.term.show(); w.term.prompt();
          await w.term.run(c, 'sasview &', ['[1] 60233', 'Run "sasview " in the "sasview" pixi environment']);
          await c.sleep(1500); w.sv.shot('01_start'); w.sv.show(); await c.sleep(500);
        } },
      { head: 'Load the merged curve', keysLabel: 'Click, then pick', keys: [{ press: 'Load data' }, FILE],
        say: 'The merged I(Q) of CTAB at rest, 1,3 plane: both configurations stitched into one curve by the reduction.',
        note: `The dialog does not open in your folder. Type the path into <b>File name</b> and press Enter: <code>${MINE}/output</code>`,
        async run(c, w) {
          w.sv.clear();
          await w.sv.click(c, ...mid(M['01_start'].load));
          w.sv.dialog('dlg_folder'); await c.sleep(1000);
          await w.sv.click(c, DLG.x + 330, DLG.y + DLG.bar + 275);
          w.sv.dialog('dlg_selected'); await c.sleep(800);
          await w.sv.click(c, ...[DLG.x + SV.dialog.open[0] + 40, DLG.y + DLG.bar + SV.dialog.open[1] + 13]);
          w.sv.dialog(null); w.sv.shot('02_loaded'); await c.sleep(350);
          w.sv.hl([24, 238, 298, 22]);
        } },
      { head: 'Send it to Fitting', keysLabel: 'Click', keys: [{ press: 'Send to' }],
        say: 'The file is listed and ticked. <b>Send to</b> hands every ticked data set to the tool named beside the button, here <b>Fitting</b>. The fit page now says which data it holds.',
        async run(c, w) {
          w.sv.clear();
          await w.sv.click(c, ...mid(M['02_loaded'].send));
          w.sv.shot('03_sent'); await c.sleep(350);
          w.sv.hl([362, 124, 424, 26]);
        } },
      { head: 'Choose the model', keysLabel: 'Pick', keys: [{ press: 'Category: Cylinder' }, { press: 'Model name: flexible_cylinder' }],
        say: 'A worm-like chain is called <b>flexible_cylinder</b> in SasView, in the category Cylinder. Its parameters appear with default values.',
        async run(c, w) {
          w.sv.clear();
          await w.sv.click(c, ...mid(M['03_sent'].category));
          w.sv.pop('pop_category'); await c.sleep(700);
          await w.sv.click(c, POP.pop_category[0] + 100, POP.pop_category[1] + SV.popups.pop_category.item[1] + 13);
          w.sv.pop(null); w.sv.shot('04_category'); await c.sleep(600);
          await w.sv.click(c, ...mid(M['04_category'].model));
          w.sv.pop('pop_model'); await c.sleep(800);
          await w.sv.click(c, POP.pop_model[0] + 110, POP.pop_model[1] + SV.popups.pop_model.item[1] + 13);
          w.sv.pop(null); w.sv.shot('05_model'); await c.sleep(600);
          w.sv.zoom(TABLE, 1.3, [12, 762], 'Default parameters');
        } },
      { head: 'Plot the data with the model', keysLabel: 'Click', keys: [{ press: 'Compute/Plot' }],
        say: `<b>Graph1</b>: the data (points) and the model (line). <b>Graph2</b>: the residuals. With default values the model is far from the data: χ² = ${SV.chi2_default.replace('e+08', ' × 10⁸')}.`,
        note: 'The two graphs open on top of each other. Drag them beside the fit panel.',
        async run(c, w) {
          w.sv.clear();
          await w.sv.click(c, ...mid(M['05_model'].plot));
          w.sv.shot('06_plot_raw'); await c.sleep(1700);
          w.sv.shot('06_plot'); await c.sleep(500);
          w.sv.zoom(CHI, 1.6, [826, 800], 'χ²');
        } },
      { head: 'Choose what to fit', keysLabel: 'Tick', keys: [{ press: 'scale · background' }, { press: 'length · kuhn_length · radius' }],
        say: 'A ticked parameter is varied by the fit. Leave <b>sld</b> and <b>sld_solvent</b> as they are: the intensity is in relative units, so contrast and scale cannot be told apart.',
        async run(c, w) {
          w.sv.clear(); w.sv.shot('06_plot');
          const names = ['scale', 'background', 'length', 'kuhn_length', 'radius'];
          for (let k = 0; k < names.length; k++) { await w.sv.click(c, ...tick(names[k])); w.sv.shot(`07_check${k + 1}`); await c.sleep(120); }
          await c.sleep(300);
          w.sv.zoom(TABLE, 1.3, [12, 762], 'Five parameters ticked');
        } },
      { head: 'Fit', keysLabel: 'Click', keys: [{ press: 'Fit' }],
        say: 'Levenberg–Marquardt needs a fraction of a second here. A <b>Result panel</b> with the convergence trace opens on top; close it to see the graphs again.',
        async run(c, w) {
          w.sv.clear();
          await w.sv.click(c, ...mid(M['06_plot'].fit));
          w.sv.shot('08_fit_popup'); await c.sleep(2200);
          const r = M['08_fit_popup'].result;
          await w.sv.click(c, r[0] + r[2] - 15, r[1] + 12);
          w.sv.shot('09_fit'); await c.sleep(400);
        } },
      { head: 'Read the result',
        say: `χ² fell from 1.19 × 10⁸ to <b>${(+SV.chi2).toFixed(1)}</b>. The <b>radius, 21.06 ± 0.01 Å</b>, is pinned down by the drop near 0.1 Å⁻¹. The length came out as 2.4 ± 6.8 Å, which is not a physical answer: this fit cannot tell length from Kuhn length.`,
        note: 'A χ² of 40 with residuals that wave like this says the model is not complete. Next: the same fit by asking.',
        async run(c, w) {
          w.sv.clear(); w.sv.shot('09_fit');
          await c.sleep(500);
          w.sv.zoom(TABLE, 1.3, [12, 762], 'Fitted values and errors');
          await c.sleep(500);
          w.sv.zoom(CHI, 1.6, [826, 800], 'χ²');
          await c.sleep(500);
          w.sv.hl(M['09_fit'].graph2);
        } },
    ],
  };

  /* ================================================================
     sansbook: the book as it stands, and the two conversations
     ================================================================ */
  const G = '<span class="tg">├── </span>', GL = '<span class="tg">└── </span>';
  const T = {
    reductions: { html: '▼ <b>Reductions</b>' },
    r1: { html: `${GL}<b>○ R1</b> ipts37681_ccd_output <span class="dim">open → S0a, S0b</span> <span class="rvc">reductions go here</span>` },
    s0a: { html: '▼ <b>◆ S0a</b> IPTS-37681 merged CTAB curves <span class="dim">(14) ← R1</span>' },
    s0b: { html: '<b>◆ S0b</b> IPTS-37681 8m10a 2D profiles <span class="dim">(14) ⚠1 a.u. ← R1</span>' },
    s1: (cur, last, open) => ({ html: `${last ? GL : G}${open ? '<span style="color:#00ffff">○ S1</span>' : '<span class="live">● S1</span>'} reduction_summary_merged_profiles${cur ? ' <span class="rvw">current page</span>' : ''}`, cursor: cur }),
    s1b: (state, cur) => ({ html: `${GL}${state === 'open' ? '<span style="color:#00ffff">○ S1b</span>' : '<span class="dead">✕ S1b</span>'} zero_shear_fit${cur ? ' <span class="rvw">current page</span>' : ''}`, cursor: cur }),
  };
  const tree0 = () => [T.reductions, T.r1, T.s0a, T.s1(true, true), T.s0b];
  const treeFit = (state) => [T.reductions, T.r1, T.s0a, T.s1(false, false), T.s1b(state, true), T.s0b];
  const treeOrder = (open) => [T.reductions, T.r1, T.s0a, T.s1(true, false, open), T.s1b('dead', false), T.s0b];
  const NOTICE = `Book IPTS-37681 sansbook (IPTS-37681) at ${GPFS}/sansbook\nModel openai/gpt-6-luna. Ask anything about the data; :help lists commands, Esc stops an answer.`;
  const P_FIT = "create a new page '0-shear fit' for analysis. take the 0 shear merged Iq data and apply worm-like chain model and perform fit. summarize fit results in detail.";
  const A_FIT = 'Created **S1b, `zero_shear_fit`**, as a new page from S0a. It fits the two exact 0-shear CTAB merged curves independently with SasView `flexible_cylinder` (the worm-like-chain model), and includes the parameter summary and fit/residual diagnostics.\n\n**Fit summary:** Both full-range fits show substantial systematic residuals and are not reliable for structural interpretation. CTAB_1,3_0shear has χ²ᵣ = 40.38; its contour length reaches the lower bound (10 Å). CTAB_2,3_0shear has χ²ᵣ = 58.21; its contour length reaches the upper bound (10000 Å). Both show structured residuals, particularly across mid-to-high q. Because the merged curves lack dQ, resolution smearing was not applied. The intensities are relative (a.u.), and the fixed default SLDs are only a computational convention.\n\nI marked S1b **dead** as a rejected full-range WLC fit. View it at `report/index.html#S1b`.';
  const P_OP = 'in page s1, add order parameter calculation for the 8m iqxqy data. show the equation to calculate order parameter. Then create a table to show the value for all 8m data. also make a plot of orderparameter vs shear rate using lin-log scale (y-axis - x-axis))';
  const Q1 = ['Use all CTAB maps (exclude EmptyCupBob); φ₀=0° along +qx; include the 0-shear return as a separate point; use all q pixels.',
    'Use all CTAB maps (exclude EmptyCupBob); φ₀=0° along +qx; include return separately; calculate only within a q annulus (I will specify qmin/qmax).',
    'Use only one CTAB concentration and/or omit the return run; I will specify the concentration, orientation reference, and q range.'];
  const Q2 = ['Linear shear-rate x and linear S₂ y (include zero-shear and return points).',
    'Logarithmic shear-rate x and linear S₂ y; omit the two zero-shear points from the plot, keep them in the table.',
    'Linear shear-rate x and logarithmic S₂ y; use only if all S₂ values are positive.'];
  const ask = (q, opts) => `? ${q}\n${opts.map((o, i) => `   ${i + 1}. ${o}`).join('\n')}\n   (answer with the number, or in your own words)`;
  const A_OP = 'S1 is updated and remains the current page. The order-parameter equation, table for all 10 CTAB 8m10a maps, and shear-rate plot are in the S1 report. EmptyCupBob maps are excluded; zero-shear and return values remain in the table but are omitted from the logarithmic-x plot.\n\nFor example, the table reports S₂ = −0.4375 for CTAB 1,3 at shear rate 100, and S₂ = 0.1925 for CTAB 2,3 at 1000. Each value uses 6,389 finite q pixels. The equation and plot were visually checked.\n\nReview `report/index.html#S1` or `order_parameter_table.csv`.';
  const P_PARA = 'in page s1, add a paragraph about the order parameter including exact equation that was used to calculate this';
  const A_PARA = 'Added the explanatory paragraph to S1’s 2D-profile gallery, including the exact equation and definitions of φᵢ and φ₀, the all-finite-pixel summation, and the EmptyCupBob exclusion. The page reran successfully. Review it in `report/index.html#S1`.';
  const PG = 'pages/S1_reduction_summary_merged_profiles', SRC_A = 'sources/S0a_ipts_37681_merged_ctab_curves', SRC_B = 'sources/S0b_ipts_37681_8m10a_2d_profiles';

  function windows(screen) {
    const w = {};
    w.term = D.term(screen, 22, 44, 1406, 1014, USER, HOST); w.term.cwd(MINE);
    w.sb = D.sansbook(w.term.body, '0.3.11');
    w.term2 = D.term(screen, 380, 590, 1010, 250, USER, HOST); w.term2.cwd(MINE);
    w.br = D.browser(screen, 60, 60, 1330, 990);
    return w;
  }
  // scroll the report inside the browser to an element (or the top)
  const scroller = (c, w) => {
    const f = w.br.page.querySelector('iframe');
    // the report may still be loading when a step is reached by going back
    const ready = async () => {
      for (let i = 0; i < 50; i++) {
        try { const d = f.contentDocument; if (d && d.readyState === 'complete' && d.querySelector('section.tab')) return; } catch (e) { return; }
        await new Promise((r) => setTimeout(r, 100));
      }
    };
    return async (sel, ms, off = 16) => {
      if (!c.measure) await ready();
      c.check();
      try {
        const d = f.contentDocument, e = sel ? d.querySelector(sel) : null;
        const y = e ? e.getBoundingClientRect().top + f.contentWindow.scrollY - off : 0;
        f.contentWindow.scrollTo({ top: y, behavior: c.fast ? 'auto' : 'smooth' });
      } catch (e) { /* opened from file://: the page cannot be scrolled from here */ }
      await c.sleep(ms);
    };
  };
  const openReport = async (c, w, tab) => {
    w.term2.show(); w.term2.prompt();
    await w.term2.run(c, 'firefox sansbook/report/index.html &', '[2] 61877');
    await c.sleep(500); w.br.show();
    await w.br.go(c, `file://${MINE}/sansbook/report/index.html#${tab}`, 'IPTS-37681 sansbook — sansbook', `<iframe src="assets/book/report/index.html#${tab}" title="sansbook report"></iframe>`);
    await c.sleep(900);
  };

  const fitDemo = {
    part: 'Part 2 of 3', title: 'Fit by asking: sansbook',
    build: windows,
    steps: [
      { head: 'Open the book again', keys: [`cd ${MINE}`, 'sansbook'],
        say: 'sansbook finds the book from the reduction session and carries on: the reduction <b>R1</b>, its merged curves <b>S0a</b>, the 8 m 2D maps <b>S0b</b> and the summary page <b>S1</b>.',
        note: 'This is the book of 3 November, so the names are its own. What matters in yours: the merged I(Q) files are in a source.',
        async run(c, w) {
          w.term.show(); w.term.cwd(SHARED); w.term.prompt();
          await w.term.run(c, `cd ${MINE}`, null, { cwd: MINE });
          await w.term.run(c, 'sansbook', null, { hold: true });
          await c.sleep(600); w.term.title('sansbook (v0.3.11)'); w.sb.on();
          w.sb.status({ title: 'IPTS-37681 sansbook', path: `${MINE}/sansbook`, page: 'S1', red: 'R1', out: `${GPFS}/output` });
          w.sb.tree(tree0()); w.sb.add('notice', NOTICE); w.sb.promptText(); await c.sleep(300);
        } },
      { head: 'Ask for the fit', keys: [P_FIT],
        say: 'Say <b>which data</b>, <b>which model</b> and <b>what you want back</b>. “Worm-like chain” is not a model name, so it looks one up, then opens a page, writes the fit script and runs it.',
        async run(c, w) {
          await w.sb.send(c, P_FIT);
          await w.sb.work(c, [
            { call: 'list_models {"keyword": "worm-like chain"}', ret: "no sasmodels model matches 'worm-like chain'", cost: 0.002 },
            { call: 'audit_source {"source": "S0a"}', ret: 'Reduction record (1 warning, 3 info); intensity unit a.u. (relative): Data were reduced with drtsans 1.35.0 (Mantid 6.16.1.2) through eqsanscli 0.54.4. 2 configurations (4m2.5a, 8m10a) and 28 reduced rows. …', cost: 0.004 },
            { call: 'list_models {"keyword": "flexible cylinder"}', ret: 'flexible_cylinder            shape:cylinder               Flexible cylinder where the form factor is normalized by the volume of the cylinder. …', cost: 0.006 },
            { call: 'describe_model {"name": "flexible_cylinder"}', ret: 'flexible_cylinder: Flexible cylinder where the form factor is normalized by the volume of the cylinder. [shape:cylinder]  scale default 1 limits [0, inf] …', cost: 0.008 },
            { call: 'record_decision {"text": "For the 0-shear WLC analysis, fit the two exact CTAB_1,3_0shear and CTAB_2,3_0shear merged curves independently; exclude the 0shear-return cu…', ret: 'D2 recorded (agent): For the 0-shear WLC analysis, fit the two exact CTAB_1,3_0shear and CTAB_2,3_0shear merged curves independently; exclude the 0shear-return curves and empty-cup curves. Because S0a is relative intensity (a.u.) and sample/solvent SLDs were not specified, use the SasView flexible_cylinder default SLD values only as a computational convention, float the scale, and do not interpret scale as an absolut…', cost: 0.010 },
            { call: 'new_page {"parents": ["S0a"], "slug": "zero_shear_fit", "question": "For the two CTAB samples at 0 shear, do the merged I(q) curves support a SasView worm-like-chai…', ret: 'S1b created at pages/S1b_zero_shear_fit/ (sources S0a); it is the current page. Next: write_script, run_script, look_at_figure, close_page.', cost: 0.012,
              do: () => { w.sb.status({ page: 'S1b' }); w.sb.tree(treeFit('open')); } },
            { call: `inspect_data {"path": "${SRC_A}/data/merged_CTAB_1,3_0shear_Iq.txt"}`, ret: 'merged_CTAB_1,3_0shear_Iq: 124 points, q 0.001997–0.4551 1/A, I -2.883–113.1 1/cm, dI yes, dQ no', cost: 0.014 },
            { call: `inspect_data {"path": "${SRC_A}/data/merged_CTAB_2,3_0shear_Iq.txt"}`, ret: 'merged_CTAB_2,3_0shear_Iq: 124 points, q 0.002064–0.4558 1/A, I 0.03747–157.5 1/cm, dI yes, dQ no', cost: 0.015 },
            { think: 1500, call: 'write_script zero_shear_wlc.py (58 lines)', ret: 'wrote pages/S1b_zero_shear_fit/zero_shear_wlc.py (58 lines); run it with run_script', cost: 0.019 },
            { call: 'run_script zero_shear_wlc.py', runlog: '$ zero_shear_wlc.py\n' + A.fitlog, wait: 2400, ret: 'S1b run 1: OK in 5.4 s', cost: 0.020 },
            { call: 'look_at_figure pages/S1b_zero_shear_fit/figures/s1b_CTAB_1_3_0shear_fit_diagnostics.png', wait: 150, cost: 0.022 },
            { think: 150, call: 'look_at_figure pages/S1b_zero_shear_fit/figures/s1b_CTAB_2_3_0shear_fit_diagnostics.png', ret: 'figure pages/S1b_zero_shear_fit/figures/s1b_CTAB_1_3_0shear_fit_diagnostics.png attached; look for: Check model fit and residuals across q; identify systematic failures.', cost: 0.023 },
            { call: 'read_file {"path": "pages/S1b_zero_shear_fit/fit_summary.csv", "max_lines": 20}', ret: `${GPFS}/sansbook/pages/S1b_zero_shear_fit/fit_summary.csv (3 lines, 633 B)`, cost: 0.024 },
            { call: 'close_page {"verdict": "dead", "result": "S1b: Independently fit the full available q ranges (0.001997–0.4551 Å⁻¹ for CTAB_1,3_0shear; 0.002064–0.4558 Å⁻¹ for CTAB_…', ret: 'S1b closed as dead; log entry written, STATE.md updated.', cost: 0.025,
              do: () => w.sb.tree(treeFit('dead')) },
            { think: 1100, cost: 0.026 },
          ]);
          w.sb.add('assistant', A_FIT);
          w.sb.add('tool', '[21 call(s), $0.026]'); w.sb.promptText();
        } },
      { head: 'Read the answer',
        say: 'It did the fit and then <b>judged it</b>: the residuals are systematic, the length ran to a limit, so it closed the page as <b>dead</b> (✕) instead of reporting the numbers as a result. The fit output is on the left.',
        note: 'Same data, same model, same χ² as SasView: 40.38.',
        async run(c, w) { await c.sleep(300); } },
      { head: 'Open the page', keysLabel: 'In a second terminal', keys: ['firefox sansbook/report/index.html &'],
        say: 'Every page of the book is a tab of one report. <b>S1b</b> holds the question, the method, the result in words, the figures and the parameter tables.',
        async run(c, w) { await openReport(c, w, 'S1b'); } },
      { head: 'Read the page: figures, then numbers',
        say: 'Data and fit with the residuals below, for both planes. Then one table per fit: value, error, limits, and a warning where a parameter stopped <b>at a bound</b>.',
        note: 'Scroll in the page yourself, or press ↻ to watch again.',
        async run(c, w) {
          const to = scroller(c, w);
          await c.sleep(700); await to('#tab-S1b .gallery', 3200); await to('#tab-S1b .gallery + h3', 3200);
        } },
    ],
  };

  const orderDemo = {
    part: 'Part 3 of 3', title: 'Order parameter by asking',
    build(screen) {
      const w = windows(screen);
      // the same session, a little later: the fit page is in the tree and its answer is the last thing in the chat
      w.term.title('sansbook (v0.3.11)'); w.sb.on();
      w.sb.status({ title: 'IPTS-37681 sansbook', path: `${MINE}/sansbook`, page: 'S1b', red: 'R1', out: `${GPFS}/output`, cost: 0.026 });
      w.sb.tree(treeFit('dead')); w.sb.runlog('$ zero_shear_wlc.py\n' + A.fitlog);
      w.sb.add('assistant', A_FIT.split('\n\n').pop()); w.sb.add('tool', '[21 call(s), $0.026]'); w.sb.promptText();
      return w;
    },
    steps: [
      { head: 'Ask for the order parameter', keys: [P_OP],
        say: 'I(Q) averages over the angle. The 2D maps keep it: <b>how anisotropic</b> is the scattering at each shear rate? Ask for one number per map, the equation, a table and a plot.',
        note: 'Name the page (<b>s1</b>): the current page is still the fit.',
        async run(c, w) {
          w.term.show();
          await w.sb.send(c, P_OP);
          await w.sb.work(c, [
            { call: 'revise_page {"page": "S1", "reason": "Add a second-order order-parameter calculation and equation, summarize all 8m 2D profiles in a table, and plot order parameter…', ret: 'S1 reopened for revision 4 and made current. Edit its script, re-run, close it again.', cost: 0.027,
              do: () => { w.sb.status({ page: 'S1' }); w.sb.tree(treeOrder(true)); } },
            { call: `read_file {"path": "${PG}/reduction_summary.py"}`, ret: `${GPFS}/sansbook/${PG}/reduction_summary.py (38 lines, 1 KB)`, cost: 0.028 },
            { call: `inspect_data {"path": "${SRC_B}/CTAB_1,3_100shear_8m10a_8m10a_Iqxqy.dat"}`, ret: 'ERROR: FileNotFoundError: [Errno 2] No such file or directory', cost: 0.029 },
            { call: `list_dir {"path": "${SRC_B}/data", "max_entries": 25}`, ret: `${GPFS}/sansbook/${SRC_B}/data  (14 entries matching '*')`, cost: 0.030 },
            { call: `inspect_data {"path": "${SRC_B}/data/CTAB_1,3_100shear_8m10a_8m10a_Iqxqy.dat"}`, ret: 'CTAB_1,3_100shear_8m10a_8m10a_Iqxqy: 2D 80x80, qx -0.04003–0.04268, qy -0.0401–0.03856 1/A', cost: 0.031 },
            { think: 900, cost: 0.032 },
          ]);
          w.sb.add('question', ask('For S₂ = Σ Iᵢ cos[2(φᵢ−φ₀)] / Σ Iᵢ, I need the angular reference and q range, and how to handle the two CTAB concentrations/return run. What should I use?', Q1));
          w.sb.add('tool', '[9 call(s), $0.032, question]'); w.sb.promptText();
        } },
      { head: 'Answer: which maps, which direction', keys: ['1'],
        say: 'It does not guess a definition. It shows the formula it will use and asks what is yours to decide: which maps, the reference direction φ₀, and which pixels.',
        note: 'It calls the 1,3 and 2,3 planes “concentrations”. They are the two beam paths through the cell; the numbers are not affected.',
        async run(c, w) {
          await w.sb.send(c, '1', `1  → ${Q1[0]}`);
          await w.sb.work(c, [
            { call: 'record_decision {"text": "For the 8m 2D order parameter, use all CTAB maps and exclude EmptyCupBob; set φ₀=0° along +qx; include the 0-shear return as a separate point; sum…', ret: 'D3 recorded (user): For the 8m 2D order parameter, use all CTAB maps and exclude EmptyCupBob; set φ₀=0° along +qx; include the 0-shear return as a separate point; sum over all q pixels.', cost: 0.034 },
            { think: 700, cost: 0.035 },
          ]);
          w.sb.add('question', ask('The requested lin–log axes are ambiguous, and the dataset includes zero-shear points. Which axis should be logarithmic? A standard log axis cannot include zero shear; logarithmic order parameter also requires positive values.', Q2));
          w.sb.add('tool', '[2 call(s), $0.035, question]'); w.sb.promptText();
        } },
      { head: 'Answer: which axis is logarithmic', keys: ['2'],
        say: 'Now it works: the calculation goes into the page’s script, the first run <b>fails</b>, it reads its own code, repairs the pattern that reads the shear rate from the file name, runs again and <b>looks at the figures</b> before it answers.',
        async run(c, w) {
          await w.sb.send(c, '2', `2  → ${Q2[1]}`);
          await w.sb.work(c, [
            { call: 'record_decision {"text": "Plot order parameter versus shear rate with logarithmic x (shear rate) and linear y (S₂); omit zero-shear points from the plot but retain them…', ret: 'D4 recorded (user): Plot order parameter versus shear rate with logarithmic x (shear rate) and linear y (S₂); omit zero-shear points from the plot but retain them in the results table.', cost: 0.037 },
            { think: 1500, call: 'edit_script reduction_summary.py (2 changes)', ret: `edited ${PG}/reduction_summary.py: 2 change(s), 94 lines; run it with run_script`, cost: 0.040 },
            { call: 'run_script reduction_summary.py', runlog: '$ reduction_summary.py\nValueError: Cannot parse shear rate from CTAB_1,3_0shear_8m10a_8m10a_Iqxqy.dat', wait: 2200, ret: 'S1 run 6: FAILED rc=1 in 7.5 s — ValueError: Cannot parse shear rate from CTAB_1,3_0shear_8m10a_8m10a_Iqxqy.dat', cost: 0.042 },
            { call: `read_file {"path": "${PG}/reduction_summary.py", "start_line": 40, "max_lines": 22}`, ret: `${GPFS}/sansbook/${PG}/reduction_summary.py (94 lines, 4 KB)`, cost: 0.043 },
            { think: 900, call: 'edit_script reduction_summary.py (1 change)', ret: `edited ${PG}/reduction_summary.py: 1 change(s), 94 lines; run it with run_script`, cost: 0.045 },
            { call: 'run_script reduction_summary.py', runlog: '$ reduction_summary.py', wait: 2200, ret: 'S1 run 7: OK in 7.6 s', cost: 0.046 },
            { call: `read_file {"path": "${PG}/order_parameter_table.csv"}`, ret: `${GPFS}/sansbook/${PG}/order_parameter_table.csv (13 lines, 1 KB)`, cost: 0.047 },
            { call: `look_at_figure ${PG}/figures/s1_order_parameter_vs_shear_rate.png`, wait: 150, cost: 0.048 },
            { think: 150, call: `look_at_figure ${PG}/figures/s1_order_parameter_equation.png`, ret: `figure ${PG}/figures/s1_order_parameter_vs_shear_rate.png attached; look for: Check logarithmic shear-rate x axis, linear S2 y axis, legends and plotted points.`, cost: 0.049 },
            { think: 800, call: 'edit_script reduction_summary.py (1 change)', ret: `edited ${PG}/reduction_summary.py: 1 change(s), 94 lines; run it with run_script`, cost: 0.050 },
            { call: 'run_script reduction_summary.py', wait: 2000, ret: 'S1 run 8: OK in 7.4 s', cost: 0.051 },
            { call: `look_at_figure ${PG}/figures/s1_order_parameter_equation.png`, ret: `figure ${PG}/figures/s1_order_parameter_equation.png attached; look for: Verify the equation notes render cleanly and describe phi_i and phi_0 legibly.`, cost: 0.052 },
            { call: 'close_page {"verdict": "live", "result": "Added the S₂ equation figure and computed S₂ for all 10 CTAB 8m10a maps, excluding the two EmptyCupBob maps; each calculation used 6,389…', ret: 'S1 closed as live; log entry written, STATE.md updated.', cost: 0.053,
              do: () => w.sb.tree(treeOrder(false)) },
            { think: 1000, cost: 0.054 },
          ]);
          w.sb.add('assistant', A_OP);
          w.sb.add('tool', '[13 call(s), $0.054]'); w.sb.promptText();
        } },
      { head: 'Ask for the definition in words', keys: [P_PARA],
        say: 'A number is only as good as its definition. Have the page say <b>exactly what was computed</b>, so that the report can be read without this conversation.',
        async run(c, w) {
          await w.sb.send(c, P_PARA);
          await w.sb.work(c, [
            { call: 'revise_page {"page": "S1", "reason": "Add a written paragraph explaining the order parameter and the exact equation used to calculate it."}', ret: 'S1 reopened for revision 5 and made current. Edit its script, re-run, close it again.', cost: 0.056, do: () => w.sb.tree(treeOrder(true)) },
            { call: `read_file {"path": "${PG}/reduction_summary.py", "start_line": 30, "max_lines": 70}`, ret: `${GPFS}/sansbook/${PG}/reduction_summary.py (94 lines, 3 KB)`, cost: 0.058 },
            { think: 1100, call: 'edit_script reduction_summary.py (1 change)', ret: `edited ${PG}/reduction_summary.py: 1 change(s), 97 lines; run it with run_script`, cost: 0.061 },
            { call: 'run_script reduction_summary.py', wait: 2000, ret: 'S1 run 9: OK in 7.2 s', cost: 0.063 },
            { call: 'close_page {"verdict": "live", "result": "Added a paragraph to S1\'s 2D-profile gallery introduction defining the order parameter exactly as S₂ = Σᵢ Iᵢ cos[2(φᵢ − φ₀)] / Σᵢ Iᵢ, with φᵢ…', ret: 'S1 closed as live; log entry written, STATE.md updated.', cost: 0.065, do: () => w.sb.tree(treeOrder(false)) },
            { think: 700, cost: 0.066 },
          ]);
          w.sb.add('assistant', A_PARA);
          w.sb.add('tool', '[5 call(s), $0.066]'); w.sb.promptText();
        } },
      { head: 'Open the page', keysLabel: 'In the browser', keys: [{ press: 'Reload, then tab S1' }],
        say: 'The report was rebuilt after each answer. Page <b>S1</b> now opens with the definition: the equation, what φᵢ and φ₀ are, which pixels were summed and which maps were left out.',
        async run(c, w) {
          await openReport(c, w, 'S1');
          const to = scroller(c, w); await to('#tab-S1 .pgallery', 2200, 10);
        } },
      { head: 'Read the plot and the table',
        say: 'One S₂ per map. In the <b>1,3</b> plane it goes from 0.015 at rest to <b>−0.53</b> at 1000: the intensity gathers along q<sub>y</sub>. In <b>2,3</b> it starts at 0.37 and falls to 0.19. After the shear, both return to where they started.',
        note: 'The plot comes after the 2D maps, the table of all twelve values after the plot.',
        async run(c, w) {
          const to = scroller(c, w);
          await c.sleep(500); await to('#tab-S1 figure.overview', 4200, 24);
          await to('#tab-S1 a[href$="order_parameter_table.csv"]', 2600, 24);
        } },
    ],
  };

  window.DEMOS = { sasview: sasviewDemo, fit: fitDemo, order: orderDemo };
})();
