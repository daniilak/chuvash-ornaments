# Contributing

Use Node.js 20.19+ or 22.12+, `npm ci`, then `npm run check`.
Run `npm run build && npm run demo` for the local playground.

Preserve the original IDs, names, segments and fills. Do not edit the embedded
catalog by hand: update the pinned data snapshot and regenerate the catalog
with `node scripts/sync-catalog.mjs`, review the source revision and license,
then run geometry checks. Keep data under CC0 and new code under MIT.

Core must remain free of runtime dependencies, browser globals and React.
Do not introduce random globals, clocks, trigonometry for rectangular transforms,
resource IDs that collide across inline instances, or inferred historical
symbol meanings. New composition behavior must preserve existing schema-v1
snapshots or introduce an explicit new schema. Do not blindly refresh snapshots.

Test layout boxes, actual raster margins, repeated 3×3 tiles, extreme frame
aspects, SSR/hydration and ResizeObserver behavior. Inspect desktop and mobile
playground views after visual changes. Document the environment and limitations.
Do not publish to npm or deploy a demo as part of routine checks.
