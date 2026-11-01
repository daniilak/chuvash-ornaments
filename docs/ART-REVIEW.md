# Visual review against the supplied book images

The previous functional checks were insufficient as an artistic acceptance
criterion. Twelve valid SVGs did not mean twelve convincing book ornaments.
The main problems were disconnected repeats, weak hierarchy, tiny inserted
motifs, inconsistent filled/outline birds, and rosette details that competed
with their silhouettes.

All 14 user-supplied images were inspected again. The relevant structural
references are the continuous hook band in the seven-band screenshot, the
hatched diamond/X border on the book page, the three tree headpieces, the
black and cream stepped-star book frames, and the two pages of comb/branch
rosettes. The first blue lozenge border and red stepped borders also inform
rhythm and weight, without claiming an exact reconstruction.

| Recipe | Previous problem | Revision 2 |
| --- | --- | --- |
| Diamond ribbon | Small, changing complex centers | One coherent central figure per band; larger center and stronger outlines |
| Stepped frieze | Alternating cell orientation distracted from the repeat | Consistent orientation and solid weight across the whole band |
| Paired birds | Filled and outline birds randomly mixed | One filled bird form, stable mirrored pairs and larger figures |
| Kĕskĕ lace | Detailed centers became faint in the thumbnail | Larger intact source motifs |
| Sun weave | Sun was too small inside its outer ring | Larger source figure and opaque outer silhouette |
| Trees and hearts | Small isolated hairline forms | Larger intact forms and a clearer common rhythm |
| Hooked meander | Floating diagonal icons | Opposed square hooks, an even diagonal repeat and restrained hatched edge triangles |
| Hatched lozenges | Loose diamonds/X forms | Denser hatching, edge triangles and a shared pitch between double rules |
| Tree headpiece | Tiny tree, decorative dots and weak branching | Larger central tree, paired angular branches, square basal hooks and a continuous triangle baseline |
| Book frame | Stars sitting on a straight rail | Stepped eight-point figures, paired square hooks and broad diamond links; clear content inset |
| Comb rosette | Hairline triangles and weak diagonal teeth | Solid diagonal combs, four teeth per cardinal crown and a narrow open central cross |
| Branch rosette | Overlapping strokes, floating diamonds and detached details | Broad L-shaped wings with authored white cutouts and four connected forked axes |

The six recipes that arrange the original catalog are supplementary modern
arrangements. They are not reproductions of the book borders. The six book
studies are also new vector interpretations: the references contain print
irregularities and more local detail than these regular-grid constructions.
No historical meanings or exact historical authenticity are asserted.

All sixteen original source figures remain unchanged. New geometry uses
`compositionVersion: 2`. Explicit version 1 still reproduces saved old output;
the demo and downloadable examples use version 2. Filled book geometry is
combined into a nonzero path so that shared edges do not leave pale seams and
fill opacity does not darken overlapping pieces of the rosettes.

Rendered review artifacts:

- `art-before-after.png`: all twelve recipes, old/new side by side.
- `art-review.png`: the six revised book studies at a larger scale.
- `art-interface-patterns.png`: actual browser screenshot of all twelve cards.
- `art-interface-desktop.png`: actual browser screenshot of the revised hook band.

Reproduce the two vector review sheets with
`node scripts/render-art-review.mjs` after `npm run build`.


## Further studies and remaining corrections

Six new designs form a second distinct group: a fine lozenge ligature, heavy
toothed diamond rings, a pair-of-horns border, a horizontally hatched comb
border, an axis-symmetric branch medallion and a nested-lozenge frame. Their
weights and negative spaces were inspected at full specimen size as well as
in the page thumbnails (`more-ornaments-large.png`, `more-ornaments-browser.png`).

The new medallion follows the two-axis paired arrangement in the last book
page, rather than repeating another four-way snowflake. The horn border uses
large mirrored filled silhouettes with a fine central stem and a small lower
fringe. The hatched comb border gives adjacent cells a shared separator instead
of doubling it. The ligature uses continuous loops across each repeat seam.

The earlier star frame's vertical links were visibly longer than its horizontal
links because the fit always rounded down. Version 3 uses the closest whole
number of nodes, keeping the rhythm much closer on both axes. The earlier
hook and hatching bands also gain deliberate end rules. Saved versions 1 and
2 remain available; their geometry is not silently replaced.
