# Architecture and source review

Reviewed on 2026-10-31:

- Data repository README, CC0 dedication, index.json, complete patterns.json.
- Editor pattern_shapes.js, pattern_geometry.js and pattern_editor.js:
  15 compact / 16 large motifs, exact 90-degree transforms, explicit fill
  polygons, endpoint-based polyline joining, Y-up coordinates and SVG export.
- Alembic README, package.json, public index.ts, React components, frame and
  renderer implementation, RNG, preset builder, geometry and growth entry points.
  The study snapshot retains its MIT license and is excluded from npm.

The useful reference concepts are a small pure ESM core, deterministic parameters,
complete SVG results and an optional measuring React wrapper. Its curve growth,
woodcut filled outlines, trigonometry, masks and defs do not fit this source
geometry. This implementation instead preserves segments/fills and uses plain
SVG polylines and polygons without IDs.

## Modules

- `catalog.ts`: frozen lossless subset of the full original JSON, 16 large motifs.
- `params.ts`: versioned normalized JSON parameters, explicit compatible pools,
  strict bounded numeric handling, stateless integer seeded choice.
- `geometry.ts`: lossless edge joining, exact sign/swap transforms, bounding all
  segments and fills; stroke/miter envelope. Never modifies source arrays.
- `index.ts`: public generation API, uniform scale-to-cell rendering, row and
  supercell layouts, conservative neighbor boxes and frame insets.
- `react.tsx`: SVG display, CSS data-image background and effect-only container
  measurement. Fixed padding breaks any feedback from measurements to layout.
- `demo/`: React playground importing package public exports, no private helpers.

## Geometry and safety

A transformed motif has a padded axis-aligned box. Scaling is uniform. All
placements are contained in non-overlapping square cells. Divider reflection
pairs use the same motif at matching distances from the center. Bands retain
whole motifs and reduce count to fit. Frame side cells exclude all four corner
cells. Corner-only frames retain the main motif on one diagonal and place a
compatible sequence-selected accent on the other. The actual drawing never touches the reserved content rectangle.

Tiles deliberately route seams through empty margins. The checkerboard is a
2×2 supercell, so both axis periods are even. No clipping or partial motifs
are necessary. Repeated inline SVGs share no resource IDs or references.

Explicit colors are restricted to hex/currentColor. Titles are XML-escaped.
Generators do not take arbitrary SVG, CSS or HTML. No external references,
image elements, script elements, time, randomness, DOM or React enter the core.

Input work is bounded: at most 16 selected IDs, 128 band placements, 4 tile
placements and 500 frame placements. Each source motif has finite data. The
largest source has 360 segments. Arbitrary JSON objects are not modified.

## Versioning

schemaVersion and GENERATOR_VERSION are 1. Complete normalized output params
are the persistence format, including mode, dimensions, selected pool, color,
style, spacing and orientation. Future explicit schemas are rejected. Eighteen
representative generated SVG hashes pin existing compositions. Geometry and
layout tests also cover all motifs, presets, multiple seeds and extreme boxes.
No promise of identical raster antialiasing or all-engine byte identity is made.

## Deliberate tradeoffs

Square cells simplify robust layout for extremely different source bounds.
They preserve every figure's aspect and ensure no neighbor collisions, at the
cost of extra whitespace around narrow figures. Conservative miter padding
adds whitespace at very heavy stroke widths. Seed is a finite composition
selector, not a unique identifier. No historical interpretation is assigned.

React padding is reserved from SSR using requested size, independently of the
observed dimensions. Small frames scale down, while their content reservation
stays stable. A deliberately undersized fixed CSS box can require overflow
handling; no measuring code rewrites padding or produces resize oscillation.

## Book-inspired compositions and localized demo

`drawing.ts` holds the existing source-motif SVG renderer shared by basic
layouts and `compositions.ts`. Its extraction preserves the old schema-v1
SVG strings (the regression hashes pass unchanged).

`COMPOSITIONS` and `generateComposition` add twelve explicitly versioned recipes.
They combine unchanged source motifs with newly authored diamond outlines,
stepped hooks, small separators and stepped cut-out rings. Source motif
placements and new geometric-study regions are reported separately. The
React entry point adds Composition. These recipes restore through
`generateComposition(result.params)` and have compositionVersion 1.

The demo has no navigation or ambiguous tabs. Miniature recipes and settings
sit at left; a white specimen and visible code sit at right. The original
motif gallery was removed from the page. Basic layouts retain motif selection.
`demo/i18n.ts` supplies matching English/Russian/Chuvash dictionaries and a pure
supported-language resolver. A system/manual selector follows navigator.languages
by default and saves only manual overrides in localStorage. The cv and cv-RU system locales select Chuvash. Localized accessible names
cover all 24 compositions, five backgrounds and sixteen source motifs; six
book-context examples also have Chuvash text. Original catalog IDs/names stay intact. No network data is required.


`book-recipes.ts` adds an exact quarter-turn local frame for the second book
reference batch. Rosette silhouettes are fixed polygonal elements, while
seed selects limited details and their placement. Horizontal hatching uses
scanline intersections of outer/inner polygon rings, without SVG clip IDs.
The book frame joins bounded motifs intentionally along a perimeter and
returns safe insets. New shapes are distinct contemporary geometric studies.
