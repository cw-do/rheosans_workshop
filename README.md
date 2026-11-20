# RheoSANS Workshop — EQ-SANS decks

Slides for the RheoSANS Workshop at the Spallation Neutron Source, Oak Ridge National Laboratory,
18–19 November 2026, by Changwoo Do (EQ-SANS).

**Open: https://cw-do.github.io/rheosans_workshop/**

The front page has four cards:

1. **Introduction to EQ-SANS** — the instrument as a live 3D model, its Q range, the sample environments,
   and the rheometer in the beam (1–3 and 2–3 planes).
2. **From Runs to I(Q)** — data reduction three ways: a drtsans script, asking sansbook, browsing with sansdir.
3. **From I(Q) to Structure** — a flexible-cylinder fit in SasView, the same fit by asking sansbook,
   and the order parameter from the 2D maps.
4. **Micelles in the Gap** — one interactive page: CTAB wormlike micelles aligning in the Couette gap, with the
   gap, the molecules and the detector pattern beside the cell. Schematic, not a simulation of the data.
   Its corner link opens the page as it was first made (`micelle/original.html`).

Keys: `→` `←` (or Space / PgDn / PgUp) move; on a demo slide they move step by step. `O` shows all slides,
`F` toggles full screen, `R` replays a demo step. The pill at the top right has the same as buttons:
⌂ front page, ‹ ›, all slides, full screen. `0` then Enter also returns to the front page.

## What the demos are

The demo slides are replays, not live sessions.

- **SasView** — screenshots of the real SasView 6.1.3 window on the SNS analysis cluster, taken after each
  action; the fit was really run. The pointer, the orange frames and the magnified cut-outs are drawn on top.
  The folder shown in the file dialog is relabelled to the example user `abc`.
- **sansbook** — the prompts, tool calls and answers are those of recorded sessions of 3 November 2026.
  Long lines are shortened, the folder names are changed to the example user, and two sessions from two
  different books are shown as one conversation. In the reduction deck, the summary-page request and the
  page it produces are a reconstruction.
- **ONCat** — the pages are screenshots of the real catalog; the run list is redrawn so rows can be lit up.
  Names of the experiment team are blurred.
- **drtsans** — the script is the experiment's reduction script with its run lists emptied
  (`reduce_template.py`); the console output shown is assembled from a real log file.
- The time bar under a demo is an estimate of the step's length.

Intensities in the figures are in relative units.

The front page counts its visits with GoatCounter (no cookies, no IP addresses stored); the number is
shown at the bottom. The local copy started with `serve.py` does not count.

## Run it locally

The first deck embeds a 3D model built from ES modules, which browsers do not load from `file://`.
Clone the repository and run `python serve.py` (or double-click `Start RheoSANS workshop.cmd` on Windows);
it serves the folder on `127.0.0.1:8718` and opens the front page.

The 3D model is a copy of https://github.com/cw-do/eqsans-model with a Rheo-SANS mode added.
This repository is generated from a working folder; it holds the finished pages, not the scripts that build them.
