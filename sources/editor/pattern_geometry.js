/* Геометрия и экспорт (mirror of pattern_core) */
window.PatternGeometry = (function () {
  "use strict";
  // --- geometry helpers (mirror of pattern_core) ---
  const EPS = 1e-9;
  const GRID = 1; // unit grid
  const COLORS = {
    bg: "#f3ebe0",
    ink: "#8b1a1a",
    soft: "#5c1010",
    // сетка — только серые, без красных/тёплых оттенков
    grid: "#c8c8c8",
    major: "#a8a8a8",
    axis: "#b0b0b0",
    point: "#9a9a9a",
    select: "#1d4ed8",
    selectFill: "rgba(29, 78, 216, 0.12)",
    ghost: "rgba(139, 26, 26, 0.38)",
    fill: "rgba(139, 26, 26, 0.82)",
    fillGhost: "rgba(139, 26, 26, 0.28)",
    attach: "#b45309",
  };

  function normalizeHex(hex, fallback) {
    const s = String(hex || "").trim();
    const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(s);
    if (!m) return fallback;
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return "#" + h.toLowerCase();
  }

  function hexToRgb(hex) {
    const h = normalizeHex(hex, "#000000").slice(1);
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbaFromHex(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function applyBgColor(hex) {
    COLORS.bg = normalizeHex(hex, COLORS.bg);
  }

  function applyInkColor(hex) {
    const ink = normalizeHex(hex, COLORS.ink);
    COLORS.ink = ink;
    COLORS.soft = ink;
    COLORS.fill = rgbaFromHex(ink, 0.82);
    COLORS.fillGhost = rgbaFromHex(ink, 0.28);
    COLORS.ghost = rgbaFromHex(ink, 0.38);
  }

  function canon(p) {
    return [Math.round(p[0] * 1e9) / 1e9, Math.round(p[1] * 1e9) / 1e9];
  }

  function snap(v, step = GRID) {
    return Math.round(v / step) * step;
  }

  function snapPoint(p, step = GRID) {
    return [snap(p[0], step), snap(p[1], step)];
  }

  function cloneSegs(segs) {
    return segs.map(([a, b]) => [canon(a), canon(b)]);
  }

  function cloneFills(fills) {
    return (fills || []).map((poly) => poly.map((p) => canon(p)));
  }

  function translate(segs, dx, dy) {
    return segs.map(([a, b]) => [
      canon([a[0] + dx, a[1] + dy]),
      canon([b[0] + dx, b[1] + dy]),
    ]);
  }

  function translateFills(fills, dx, dy) {
    return (fills || []).map((poly) =>
      poly.map((p) => canon([p[0] + dx, p[1] + dy]))
    );
  }

  function pointsOf(segs) {
    const set = new Map();
    for (const [a, b] of segs) {
      set.set(a[0] + "," + a[1], a);
      set.set(b[0] + "," + b[1], b);
    }
    return [...set.values()];
  }

  function boundsOf(segs) {
    const pts = pointsOf(segs);
    if (!pts.length) return { x0: 0, y0: 0, x1: 0, y1: 0 };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    return { x0, y0, x1, y1 };
  }

  function boundsOfSegsAndFills(segs, fills) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    let any = false;
    const absorb = (x, y) => {
      any = true;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    };
    for (const [a, b] of segs || []) {
      absorb(a[0], a[1]);
      absorb(b[0], b[1]);
    }
    for (const poly of fills || []) {
      for (const p of poly || []) absorb(p[0], p[1]);
    }
    if (!any) return { x0: 0, y0: 0, x1: 0, y1: 0 };
    return { x0, y0, x1, y1 };
  }

  function centroid(segs) {
    const pts = pointsOf(segs);
    if (!pts.length) return [0, 0];
    let sx = 0, sy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; }
    return snapPoint([sx / pts.length, sy / pts.length]);
  }

  /** Поворот на 90° (dir: +1 вправо/по часовой, −1 влево). Точные целые координаты. */
  function rotateSegs90(segs, dir, cx, cy) {
    return segs.map(([a, b]) => {
      const map = (p) => {
        const x = p[0] - cx, y = p[1] - cy;
        // CW: (x,y)->(y,-x); CCW: (x,y)->(-y,x)
        const nx = dir > 0 ? y : -y;
        const ny = dir > 0 ? -x : x;
        return canon([cx + nx, cy + ny]);
      };
      const na = map(a), nb = map(b);
      return na[0] === nb[0] && na[1] === nb[1] ? null : [na, nb];
    }).filter(Boolean);
  }

  function rotateFills90(fills, dir, cx, cy) {
    return (fills || []).map((poly) =>
      poly.map((p) => {
        const x = p[0] - cx, y = p[1] - cy;
        const nx = dir > 0 ? y : -y;
        const ny = dir > 0 ? -x : x;
        return canon([cx + nx, cy + ny]);
      })
    );
  }

  function scaleSegs(segs, factor, cx, cy) {
    return segs.map(([a, b]) => {
      const map = (p) => snapPoint([
        cx + (p[0] - cx) * factor,
        cy + (p[1] - cy) * factor,
      ]);
      const na = map(a), nb = map(b);
      return na[0] === nb[0] && na[1] === nb[1] ? null : [na, nb];
    }).filter(Boolean);
  }

  function scaleFills(fills, factor, cx, cy) {
    return (fills || []).map((poly) =>
      poly.map((p) => snapPoint([
        cx + (p[0] - cx) * factor,
        cy + (p[1] - cy) * factor,
      ]))
    );
  }

  function mirrorSegs(segs, axis, cx, cy) {
    // axis: 'h' mirror across vertical line x=cx; 'v' across horizontal y=cy
    return segs.map(([a, b]) => {
      const map = (p) => {
        if (axis === "h") return canon([2 * cx - p[0], p[1]]);
        return canon([p[0], 2 * cy - p[1]]);
      };
      return [map(a), map(b)];
    });
  }

  function mirrorFills(fills, axis, cx, cy) {
    return (fills || []).map((poly) =>
      poly.map((p) => {
        if (axis === "h") return canon([2 * cx - p[0], p[1]]);
        return canon([p[0], 2 * cy - p[1]]);
      })
    );
  }

  function normalizeName(s) {
    return (s || "COMP").trim().replace(/\s+/g, "_").toUpperCase() || "COMP";
  }

  function segsToPython(name, segs) {
    const lines = segs.map(([a, b]) =>
      `    ((${fmt(a[0])}, ${fmt(a[1])}), (${fmt(b[0])}, ${fmt(b[1])})),`
    );
    return `${normalizeName(name)}: list[Segment] = [\n${lines.join("\n")}\n]`;
  }

  function fillsToPython(name, fills) {
    if (!fills || !fills.length) return "";
    const blocks = fills.map((poly, i) => {
      const pts = poly.map((p) => `    (${fmt(p[0])}, ${fmt(p[1])}),`).join("\n");
      const suf = fills.length > 1 ? `_${i + 1}` : "";
      return `${normalizeName(name)}_FILL${suf}: list[Point] = [\n${pts}\n]`;
    });
    return blocks.join("\n\n");
  }

  function segsToJson(name, segs, fills) {
    const obj = {
      name: normalizeName(name),
      segments: segs.map(([a, b]) => [[a[0], a[1]], [b[0], b[1]]]),
    };
    if (fills && fills.length) {
      obj.fills = fills.map((poly) => poly.map((p) => [p[0], p[1]]));
    }
    return JSON.stringify(obj, null, 2);
  }

  function fmt(n) {
    if (Number.isInteger(n)) return String(n);
    const r = Math.round(n * 1e6) / 1e6;
    return String(r);
  }

  /** Склеить сегменты с общими концами в полилинии — иначе lineJoin не работает. */
  function segsToPolylines(segs) {
    if (!segs || !segs.length) return [];
    const key = (p) => p[0] + "," + p[1];
    const used = new Array(segs.length).fill(false);
    const adj = new Map();
    for (let i = 0; i < segs.length; i++) {
      const [a, b] = segs[i];
      for (const [p, q] of [[a, b], [b, a]]) {
        const k = key(p);
        if (!adj.has(k)) adj.set(k, { p, links: [] });
        adj.get(k).links.push({ si: i, other: q });
      }
    }
    const unused = (node) => node.links.filter((l) => !used[l.si]);
    function grow(chain) {
      let grew = true;
      while (grew) {
        grew = false;
        for (const atStart of [true, false]) {
          const node = adj.get(key(atStart ? chain[0] : chain[chain.length - 1]));
          if (!node) continue;
          const opts = unused(node);
          if (opts.length !== 1) continue;
          used[opts[0].si] = true;
          if (atStart) chain.unshift(opts[0].other);
          else chain.push(opts[0].other);
          grew = true;
        }
      }
    }
    const out = [];
    for (const node of adj.values()) {
      const opts = unused(node);
      if (opts.length !== 1) continue;
      used[opts[0].si] = true;
      const chain = [node.p, opts[0].other];
      grow(chain);
      out.push(chain);
    }
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const chain = [segs[i][0], segs[i][1]];
      grow(chain);
      out.push(chain);
    }
    return out;
  }

  return {
    EPS, GRID, COLORS,
    normalizeHex, hexToRgb, rgbaFromHex, applyBgColor, applyInkColor,
    canon, snap, snapPoint, cloneSegs, cloneFills,
    translate, translateFills, pointsOf, boundsOf, boundsOfSegsAndFills, centroid,
    rotateSegs90, rotateFills90, scaleSegs, scaleFills,
    mirrorSegs, mirrorFills,
    normalizeName, segsToPython, fillsToPython, segsToJson, fmt,
    segsToPolylines,
  };
})();
