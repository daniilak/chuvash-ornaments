# Validation — 2026-10-31

Environment: macOS, Node.js 24.22.1, TypeScript 5.9.3, React/React DOM 19.3.1,
Vite 7.3.7, jsdom 26.1.0, resvg 2.6.2.

## Final checks

- 33 core, composition, language and React tests passed.
- 7 integration checks of the production demo bundle passed.
- TypeScript checks for core, React and demo passed.
- Production demo build passed.
- npm pack dry-run and the file allowlist passed; the generated tarball was
  installed offline in an isolated temporary consumer without React or DOM.
- Core and opt-in React consumer declarations compiled successfully.

The core suite checks exact preservation of all 16 original figures against
both source JSON and the live-editor snapshot; Y conversion, negative and
shifted coordinates, every source edge, explicit bird fills, no mutation,
versioned deterministic JSON roundtrips, layout bounds and non-overlapping
neighbor motifs. Raster checks cover all 16 motifs at three stroke widths
and two orientations. Grid/checkerboard seams are checked on 3×3 repeats.
Square, wide, tall, tiny and extreme frames keep their content insets clear.
Multiple inline SVGs share no IDs or external resources.

React checks cover SSR without browser globals, accessible/decorative output,
hydration, ResizeObserver updates and cleanup, stable padding and fallback
without ResizeObserver. Existing schema-v1 SVG snapshots remain unchanged.

New composition checks cover all twelve recipes, complete parameter restoration,
unchanged source data, source motif separation, raster margins on wide/small/
tall canvases at normal and heavy stroke widths, and the React Composition
component's SSR. The extra filled shapes are explicitly authored geometry,
not automatically filled source contours or claimed historical tracings.

The built-page checks run the production bundle in jsdom. They verify system
RU/EN selection and unsupported-locale fallback, manual language persistence,
returning to system language, all 18 design/layout choices, visible code,
twelve composition previews, and absence of navigation, tabs, collapsed code
and the removed original-motif gallery.

## Browser and visual inspection

The Alembic reference https://alembic.space/ornaments was opened successfully
after a transient automatic access-review timeout. Its arrangement was
inspected: presets/settings at left, a large specimen/context view at right.
The local page follows that arrangement with the explicitly requested white
specimen and permanently visible code. No Alembic implementation code was copied.

The updated page was inspected in Russian and English. The language selector
changes labels and html lang; system mode was restored afterward. Computed
preview background is rgb(255, 255, 255). Navigation and layout tabs are gone;
layouts now have descriptive names and short explanations. The separate
"Исходные фигуры" gallery was removed at the user's request; source data and
motif selection remain available to the library and basic generator layouts.

A 390px CSS viewport had clientWidth = scrollWidth = 390px. The background,
code visibility and a text-containing frame were checked on mobile. The prior
live React resize check changed its SVG from 1017×280 to 615×374 while keeping
padding stable at 48px. Temporary browser viewport overrides were reset.

Download SVG produced chuvash-sun-weave-42.svg in the browser. Its contents
matched the selected public API output byte for byte. The copy action's
Clipboard API resolved and the page showed its translated success notice;
a separate system clipboard paste was not independently verified.

All twelve generated SVGs were rasterized and inspected together on white:
`docs/new-compositions.png`. Standalone SVGs and complete reproduction JSON
are in `examples/ornaments/`; regenerate with `npm run examples:render`.
Browser screenshots are retained in `docs/playground-ru.jpg`,
`docs/playground-en.jpg` and `docs/playground-mobile.jpg`.

## Boundaries

No full Safari/Firefox/CPU/React-18 matrix was run; universal byte identity is
not claimed. SVG raster antialiasing may vary. Small fixed CSS frames can
require content scrolling because SSR padding deliberately stays stable.
No npm publication, repository upload or hosting deployment was performed.
The proposed npm name previously returned registry HTTP 404; scope ownership
and availability must be checked again at publication time.


## Second book reference batch

Six additional designs were added: hooked meander, hatched lozenges, tree
headpiece, book frame, comb rosette and hooked rosette. The existing
source-data/geometry guarantees remain in force for the 16 source motifs.
New frame tests verify separation of motif regions from the content inset
on square, wide, tall and tiny canvases. Hatching tests verify actual bounded
SVG segments without shared clip/mask IDs. A line-only recipe verifies that
fillOpacity does not fade strokes. The new designs were rendered and inspected
on the white contact sheet `docs/book-additions.png`.

The updated production page passes functional checks for all 18 choices and
for RU/EN switching. Direct browser reinspection of this last update was
unavailable because the browser content API returned "browser.user is
unavailable"; tab metadata remained readable. No alternative browser-control
mechanism was used. This limitation does not affect SVG raster inspection,
built-page DOM checks or the packaging checks.


## Interface review: readability and controls

All twelve compositions were inspected on the contact sheet, their generator
code was reviewed, and all sixteen original motifs were checked visually in
`docs/source-review.png`. A raster comparison of each recipe's settings is
recorded in `docs/control-audit.json`. It identified the inactive outline
control in Kĕskĕ lace, inactive fill/opacity for the line-only tree, negligible
opacity effects for hatching, and unused count/gap controls on single figures.

The interface now uses short localized display names, with canonical library
names retained. Settings precede the pattern chooser. Labels are 14px/600 in
#383b40; numeric inputs are 16px; code is 14px. All text uses darker colors.
Opacity is labelled correctly and shown as a percentage. Inapplicable controls
are hidden, repetition counts fit automatically, and size slider limits mirror
the actual geometry limits. Exact file dimensions can be entered numerically.

A fresh agent-owned browser tab resolved the old unavailable user-tab API.
All eighteen options were exercised in the real browser. Both languages were
inspected; a 390px viewport had matching clientWidth/scrollWidth with no
horizontal overflow. Changing the file width from 400 to 240 correctly limited
the figure size to 211 and updated the SVG/code together. The system language
and the default browser viewport were restored. Screenshots are saved as
`docs/interface-desktop.png`, `docs/interface-mobile.png` and
`docs/interface-patterns.png`.

The production-page suite now includes contextual controls and percentage
semantics. Its initial-render wait uses a readiness condition rather than a
fixed short delay. Core geometry was unchanged by this interface revision.


## Geometry revision after the artistic review — 2026-11-01

The earlier visual acceptance was too permissive; passing functional tests
did not establish stylistic quality. All 14 supplied references were inspected
again and the twelve outputs compared directly. See `ART-REVIEW.md` and
`art-before-after.png` for the per-recipe findings and actual changes.

The six book studies have revised silhouettes, negative space and repetition.
The six source-motif arrangements use larger centers and coherent sequences.
New output uses compositionVersion 2; explicit version 1 retains the former
renderer and is covered by saved SVG hashes. Rosette raster checks verify
quarter-turn symmetry and uniform opacity without dark overlapping shapes.
The margin test found a heavy-stroke clipping edge on the small frame; its
outer margin and content inset were increased before final verification.

The updated hook band, text-containing frame, all twelve thumbnails and the
version-2 example code were inspected in the real browser. New screenshots
are `art-interface-desktop.png` and `art-interface-patterns.png`. Solid rosettes
hide the line-width control until outline mode is enabled. The previous
control audit was regenerated for the current version.


## Six further book studies — 2026-11-01

The catalog now has eighteen compositions. The six new IDs are
lozenge-ligature, toothed-diamonds, horn-band, comb-band, branch-medallion
and lozenge-frame. Their structural references are the blue intertwined
border, red notched lozenges, the paired angular horns, the stepped hatched
comb band, the large paired-branch medallions and the nested-lozenge borders.
They are contemporary vector studies, not certified historical tracings.

Version 3 corrects the unequal horizontal/vertical pitch of the star frame,
centers the stepped silhouettes and terminates the earlier hook/hatching
bands with end rules. New ligature joins are single polylines rather than
three butt-ended strokes with visible dark seam artifacts. Explicit versions
1 and 2 retain their saved SVG hashes; new recipes reject those older versions.

The full check pipeline passed: 29 core/React/composition tests, four built-page
checks, both TypeScript projects, production demo build and offline package
installation. Raster checks cover all eighteen designs on wide, narrow and
small canvases with normal/heavy strokes. New tests verify that both frames
leave the actual rasterized text area empty, and that the new medallion has
both mirror symmetries and even opacity. The current control audit confirms
visible seed changes for all five new repeated/framed designs.

All six new designs were selected in the real browser; their SVGs and version-3
example code were inspected. The first six new cards are saved in
`more-ornaments-browser.png`. A 390px English mobile frame had equal client
and scroll widths, a white background and readable real text inside its frame
(`more-ornaments-mobile.png`). System language and temporary viewport settings
were restored and the agent-owned test tab was closed. The large specimen
sheet is `more-ornaments-large.png`; the twelve older recipes can be compared
across versions in `art-v3-comparison.png`. All sheets regenerate through
`npm run examples:render`.


## Contextual typesetting preview — 2026-11-01

The supplied Alembic screenshots show the role of an ornament in a page. The
playground now defaults to a localized live-text example: bands between
paragraphs, tree headpieces before chapter titles, rosettes after a story,
framed verse inside the computed inset and a tiled notebook cover. A separate
Specimen button shows the same bare SVG. Both views retain identical export
parameters, SVG and permanently visible code; no text enters the download.

Core library geometry was unchanged. TypeScript and production build pass.
All six built-page tests pass, including six contextual roles, localized copy,
DOM ordering and SVG/code identity when switching modes. A stricter URI encoder
keeps parentheses in SVG transforms compatible with CSS URL parsers, including
the built-page test environment. The background is centered to balance its
visible repeats on opposite sides of the page. Its context description no
longer incorrectly promises a 3×3 specimen.

Real-browser inspection covered band, tailpiece, chapter headpiece, framed
verse and background layouts. At 390px the English frame text fits without
vertical scrolling, clientWidth equals scrollWidth, and the page remains white.
The system language and temporary viewport override were restored. Screenshots:
`context-band.png`, `context-tailpiece.png`, `context-headpiece.png`,
`context-frame.png`, `context-mobile.png`, and `context-mobile-en.png`.

## Categorized button picker — 2026-11-01

The duplicate pattern select has been removed. Six localized category buttons
select frames, bands, headpieces, tailpieces, dividers or backgrounds. Each
category shows only its own uncaptioned thumbnails, including the six basic
layouts that were previously available through the select. All 24 choices are
reachable with buttons; their accessible names and pressed states are retained.

The production-page suite now navigates categories and clicks actual thumbnails.
It verifies exact category membership and visits all 24 choices. All six demo
checks, TypeScript and production build passed. The real browser verified the
four-frame category and switching to the thirteen-band category on a 390px
viewport, with clientWidth = scrollWidth. `pattern-categories.png` shows the
new selector. Temporary browser viewport settings were reset and the QA tab
closed. Source SVG geometry and exports are unchanged.


## Repeating backgrounds — 2026-11-01

The former background was a sparse single-motif tile, mostly hidden behind a
large white paragraph block. Four dedicated repeat recipes now accompany the
custom tile: lozenge-net, keske-field, stepped-carpet and cross-stitch. They
use exact wrapped neighbors, a consistent lattice or staggered/checkerboard
rhythm, and uniform source scaling. The sixteen original source figures and
existing generator versions remain unchanged.

The new generateBackground API returns a transparent SVG repeat unit and full
versioned parameters. PatternBackground accepts its optional background prop;
existing uses still call generateTile. Both work without DOM in core/SSR.
The demo exposes all five background choices, hides inapplicable controls and
separates exported tile dimensions from CSS display scale. The visible example
code now applies backgroundImage/backgroundRepeat/backgroundSize rather than
placing a single SVG in the container. Scaling changes CSS while preserving
the exported SVG geometry.

The full check passed: 33 core/React/composition/background tests, seven built
page checks, core/demo types, production build and offline tarball installation
without React or DOM. The package consumer also compiles the new core and
React background declarations. New tests check deterministic restoration,
source preservation, actual seed differences, coverage, small/rectangular tiles,
translated edge partners, continuous horizontal/vertical carpet links without
doubled opacity, SSR color fallback and scaling/code consistency.

Four 4×3 fields were rasterized and inspected in `backgrounds.png`. The real
browser exercised all four recipes, CSS repeats, the clean specimen and the
scale slider. The cover layout leaves a substantial patterned area around a
short, readable label. Its 390px English mobile check had clientWidth =
scrollWidth = 390 and a 430px cover. Screenshot artifacts are
`background-cover.png`, `background-carpet-cover.png`, `background-specimen.png`
and `background-mobile.png`. Raw tiles and restoration JSON are in
`examples/backgrounds/`; regeneration is part of `npm run examples:render`.

## Six new book studies — 2026-11-01

Added six separate recipes from the six distinct latest book scans (the seventh
attachment duplicates the diagonal-scroll scan): stitch-ribbon, nested-chevrons,
stepped-scrolls, diagonal-scrolls, forked-frieze and panel-headpiece. These are
new vector studies of the references, not replacements for existing recipes or
claims of historical tracing. All 18 previously saved composition SVG examples
were compared byte for byte before regeneration and remained unchanged. The
sixteen original source motifs and raw source data are unchanged.

The new recipes use compositionVersion 4. Five support an independently
normalized accentColor in core, React, saved parameters, SVG downloads and the
visible example code. The stitched recipe uses one ink. The chooser places five
new miniatures first under Bands and the three-panel piece first under
Headpieces, without visible names. The panel has no ineffective spacing control.

The full check passed: 34 core/React/geometry tests, eight built-page checks,
core/demo TypeScript, production build and offline package installation without
React or DOM. New raster checks detect hidden/occluded inks; new tests cover
version compatibility, roundtrip parameters, distinct seeds and unsafe colors.
Existing tests cover thick strokes on wide, tall and small canvases, saved v1/v2
SVGs, original motif integrity and React SSR. After expanding a study metadata
box to include the fringe, examples and the package were rebuilt successfully.
The resulting tarball has 36 files. Nothing was published.

All six were inspected at large scale in reference-studies.png; initial
chevron crossings, ink stacking and diagonal hook geometry were corrected.
The real browser confirmed band placement between paragraphs and the new
headpiece above a chapter. At 390px, the page had clientWidth = scrollWidth = 390.
Screenshots: new-book-studies-interface.png and new-book-studies-mobile.png.
Temporary viewport settings were reset and the QA tab closed. SVG/JSON examples
are in examples/book-studies/ and regenerate with npm run examples:render.

## Aesthetic review and open-source lattice — 2026-11-01

Reviewed the complete starting catalog: 24 compositions at readable scale, seed
42/43, outline and thumbnail, four backgrounds on 4×3 repeat fields, six basic
layouts and the original sixteen-source-motif sheet. The per-recipe findings and
selection rationale are in AESTHETIC-REVIEW.md. Eight targeted revisions have
compositionVersion 5. The remaining recipe geometries were retained. The demo
uses COMPOSITIONS.version in its visible reproduction code and larger, more
legible thumbnail samples without adding captions or pattern descriptions.

PatternFills (MIT, Copyright 2014 Irene Ros) was studied alongside Inkjet and
Pattern Monster. Only its crosshatch construction was adapted: woven-lattice
adds double strands, transparent over/under gaps, original source motifs and
rectangular fitting. A houndstooth experiment was rejected visually and removed.
The source snapshots and SHA-256 records are in sources/patternfills. The MIT
license is included in the distributed data/LICENSE-PatternFills, with a precise
adaptation notice in NOTICE.md. No runtime dependency, bitmap, mask or shared
resource ID was added. The demo now has 35 choices.

Full checks passed: 38 core/React/geometry tests, eight production-page tests,
core/demo type checks, production build, offline tarball import without React
or DOM, and optional React consumer declarations including revision 5. After
adjusting thumbnail sample widths, the demo was rebuilt and all eight page
checks and package consumer checks passed again. All 24 prior default composition
SVGs and four prior background SVGs reproduce their pre-review hashes when
using their saved parameters. New tests also measure uniform actual stroke
weight across unlike source motifs, revision-5 step symmetry, lighter frame
outlines, and woven seams compared with an uncut field across a 3×3 repeat.

The real browser verified the revised step band between paragraphs, the revised
frame in outline mode around the poem, and the woven field in both cover and
specimen modes. At 390 CSS pixels the new cover had clientWidth = scrollWidth =
390 and readable text. Browser zoom was left unchanged; the temporary viewport
was reset and the owned QA tab closed. Screenshots are in aesthetic-review:
woven-interface.png, woven-mobile.png and frame-outline-interface.png.
Before/after comparison and complete large review sheets are regenerated by
npm run examples:render. No package or website was published.
