# Licenses and provenance

New library code, React components, demonstration and documentation: MIT,
Copyright (c) 2026 daniilak. See LICENSE.

Original motif coordinates, names, IDs, segments and fill polygons:
CC0-1.0. Full dedication: data/LICENSE-CC0.

- Data: https://github.com/daniilak/chuvash-patterns
- Coordinate source: https://raw.githubusercontent.com/daniilak/chuvash-patterns/main/patterns.json
- Original editor: https://daniilak.ru/pattern_editor
- Retrieved: 2026-10-31. Exact source revision and SHA-256 hashes are recorded
  in the development repository's sources/manifest.json.
  Data revision: 72de7df08b1a19ca68781bceec69527d3bf5868a.

The complete original patterns.json is included without modification. The
16 large motifs are embedded in the core, preserving all source coordinates.
Normalization, orientation and placement operate on derived geometry only.
No data is fetched at runtime.

The upstream data describes digital versions of traditional Chuvash ornaments,
some assembled from other patterns and older sources. It is provided as-is,
without warranty. This library does not assign historical meanings to motifs.
Generated layouts are contemporary compositions, not historical specimens.

API and product reference:
https://github.com/lauriparonen/alembic-ornaments (MIT, Lauri Paronen).
No Alembic implementation code is incorporated into the distributed library.
The reference snapshot in sources/reference is for development study only,
is excluded from the npm package, and retains its upstream MIT LICENSE.

The user's original editor snapshots in sources/editor are retained for
geometry regression checks and source comparison. They are excluded from npm.
This notice does not assert a new license for those editor source snapshots.

## Playground theme

The standalone demo imports the original Hemingway 1 CSS by Anders Norén
(Copyright 2014), licensed GPL-2.0. Its unmodified stylesheet, copyright
notice, changelog and full license are retained in demo/vendor/hemingway.
Source: https://themes.svn.wordpress.org/hemingway/1/
Author: https://andersnoren.se/teman/hemingway-wordpress-theme/

New application/integration code remains available under MIT. The combined
themed demo is distributed under GPL-2.0, with these MIT notices retained.
The theme and demo are excluded from npm; the library remains MIT with CC0 data.

## New book-inspired compositions

The 24 recipes in src/compositions.ts, src/book-recipes.ts, src/additional-recipes.ts, src/reference-recipes.ts and their explicitly authored stepped
shapes/rings are new MIT-licensed work, inspired by the geometric rhythms
of the book images supplied by the user across both reference batches. They are not historical tracings
and no historical symbol meanings are assigned. Existing source motif
coordinates remain unchanged under CC0-1.0. The recipe metadata identifies
the newly composed work separately from the original 16-motif catalog.

## Aesthetic revisions and open-source lattice study

Eight recipes have an opt-in/saved revision 5; older revision parameters remain
supported. The revisions balance authored negative spaces, source line weights,
outline weights, continuous color fields and the neutral eight-point panel suns.
Original motif coordinates, segments and fills are not edited.

The woven-lattice background adapts the diagonal repeat construction from
PatternFills crosshatch.svg (Copyright (c) 2014 Irene Ros, MIT):
https://github.com/iros/patternfills/blob/master/src/patterns/6-other/crosshatch.svg
The modification replaces the plain crossing with transparent double strands,
explicit over/under gaps, fitted rectangular cells and intact Chuvash source
motifs. It is a contemporary composition, not a historical Chuvash specimen.
Full upstream permission/copyright text is included in data/LICENSE-PatternFills.
The study sources and SHA-256 records are in sources/patternfills (excluded
from the npm package). Houndstooth and diagonal stripes were evaluated but are
not incorporated. No extra runtime dependency was added.
