/* Редактор чувашских узоров — UI и логика холста */
(() => {
  "use strict";

  const G = window.PatternGeometry;
  const { BASE } = window.PatternShapes;
  const {
    EPS, GRID, COLORS,
    applyBgColor, applyInkColor,
    canon, snap, snapPoint, cloneSegs, cloneFills,
    translate, translateFills, pointsOf, boundsOf, boundsOfSegsAndFills, centroid,
    rotateSegs90, rotateFills90, scaleSegs, scaleFills,
    mirrorSegs, mirrorFills,
    normalizeName, segsToPython, fillsToPython, segsToJson, fmt,
    segsToPolylines,
  } = G;

  const CANVAS_KEY = "chuvash_canvas";
  let saveCanvasTimer = null;

  let nextId = 1;
  /** @type {{libId:string, segs:number[][][]}[]} */
  let clipBoard = [];
  let pasteCount = 0;
  let lineWidth = 2.5;

  function allLib() {
    return [...BASE];
  }

  function findLib(id) {
    return allLib().find((c) => c.id === id);
  }

  // --- canvas state ---
  /** @type {{id:number, libId:string, segs:number[][][], selected:boolean}[]} */
  let pieces = [];
  let tool = "select"; // select | pan
  let showGrid = localStorage.getItem("chuvash_show_grid") !== "0";
  let showCoords = localStorage.getItem("chuvash_show_coords") === "1";
  let view = {
    x: 0,
    y: 0,
    // на телефоне сразу более мелкий масштаб — узор целиком влезает в экран
    scale: window.matchMedia("(max-width: 980px)").matches ? 14 : 28,
  };
  let history = [];
  let histIdx = -1;

  // interaction
  let drag = null;
  /*
    drag kinds:
      - place: from palette {libId, ghostSegs, attachDx, attachDy}
      - move: moving selected pieces
      - box: marquee select
      - pan: panning view
  */

  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const exportOut = document.getElementById("exportOut");
  const exportName = document.getElementById("exportName");

  function setStatus(t) {
    statusEl.textContent = t;
  }

  function pushHistory() {
    const snapState = JSON.stringify(pieces.map((p) => ({
      id: p.id, libId: p.libId, segs: p.segs, fills: p.fills || [], selected: p.selected,
    })));
    history = history.slice(0, histIdx + 1);
    history.push(snapState);
    if (history.length > 80) history.shift();
    histIdx = history.length - 1;
    scheduleSaveCanvas();
  }

  function restoreHistory(i) {
    if (i < 0 || i >= history.length) return;
    histIdx = i;
    pieces = JSON.parse(history[i]).map((p) => ({ ...p }));
    nextId = Math.max(1, ...pieces.map((p) => p.id + 1), nextId);
    draw();
  }

  function undo() {
    if (histIdx > 0) restoreHistory(histIdx - 1);
  }
  function redo() {
    if (histIdx < history.length - 1) restoreHistory(histIdx + 1);
  }

  // --- coordinate transforms ---
  function resize() {
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function screenToWorld(sx, sy) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    return [
      (sx - w / 2 - view.x) / view.scale,
      -(sy - h / 2 - view.y) / view.scale, // Y up like matplotlib
    ];
  }

  function worldToScreen(wx, wy) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    return [
      wx * view.scale + w / 2 + view.x,
      -wy * view.scale + h / 2 + view.y,
    ];
  }

  function clientToCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  // --- attach / snap ---
  function saveCanvas() {
    try {
      localStorage.setItem(CANVAS_KEY, JSON.stringify({
        pieces: pieces.map((p) => ({
          id: p.id,
          libId: p.libId,
          segs: p.segs,
          fills: p.fills || [],
        })),
        nextId,
        view: { x: view.x, y: view.y, scale: view.scale },
      }));
    } catch { /* quota */ }
  }

  function scheduleSaveCanvas() {
    clearTimeout(saveCanvasTimer);
    saveCanvasTimer = setTimeout(saveCanvas, 350);
  }

  function loadCanvas() {
    try {
      const raw = localStorage.getItem(CANVAS_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.pieces)) return false;
      pieces = data.pieces.map((p) => ({
        id: p.id,
        libId: p.libId || "imported",
        segs: p.segs,
        fills: p.fills || [],
        selected: false,
      }));
      nextId = data.nextId || Math.max(1, ...pieces.map((p) => p.id + 1), 1);
      if (data.view) {
        view.x = data.view.x ?? view.x;
        view.y = data.view.y ?? view.y;
        view.scale = data.view.scale ?? view.scale;
      }
      history = [];
      histIdx = -1;
      pushHistory();
      return true;
    } catch {
      return false;
    }
  }

  function normalizeImportedSegs(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const s of raw) {
      if (!Array.isArray(s) || s.length < 2) continue;
      const a = s[0], b = s[1];
      if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) continue;
      out.push([[Number(a[0]), Number(a[1])], [Number(b[0]), Number(b[1])]]);
    }
    return out;
  }

  function normalizeImportedFills(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((poly) => {
      if (!Array.isArray(poly)) return [];
      return poly
        .filter((p) => Array.isArray(p) && p.length >= 2)
        .map((p) => [Number(p[0]), Number(p[1])]);
    }).filter((poly) => poly.length >= 3);
  }

  function importMotifsFromData(data, { replace = false } = {}) {
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.pieces)) {
      if (replace) {
        pieces = data.pieces.map((p) => ({
          id: p.id || nextId++,
          libId: p.libId || "imported",
          segs: cloneSegs(normalizeImportedSegs(p.segs || p.segments)),
          fills: cloneFills(normalizeImportedFills(p.fills)),
          selected: false,
        }));
        nextId = Math.max(nextId, ...pieces.map((p) => p.id + 1), 1);
        if (data.view) {
          view.x = data.view.x ?? view.x;
          view.y = data.view.y ?? view.y;
          view.scale = data.view.scale ?? view.scale;
        }
        pushHistory();
        scheduleSaveCanvas();
        draw();
        return pieces.length;
      }
      items = data.pieces;
    } else if (data) {
      items = [data];
    }

    if (!items.length) return 0;
    if (replace) pieces = [];
    clearSelection();
    let added = 0;
    const offset = replace ? 0 : 2 * (pasteCount + 1);
    for (const item of items) {
      const segs = normalizeImportedSegs(item.segments || item.segs);
      if (!segs.length) continue;
      const fills = normalizeImportedFills(item.fills);
      pieces.push({
        id: nextId++,
        libId: item.libId || "imported",
        segs: cloneSegs(translate(segs, offset, offset)),
        fills: cloneFills(translateFills(fills, offset, offset)),
        selected: true,
      });
      added += 1;
    }
    if (!added) return 0;
    pushHistory();
    scheduleSaveCanvas();
    draw();
    return added;
  }

  function importFromText(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      setStatus("Нечего импортировать");
      return 0;
    }
    let data;
    try {
      data = JSON.parse(trimmed);
    } catch {
      setStatus("Ошибка: неверный JSON");
      return 0;
    }
    const replace = pieces.length > 0 && confirm("Заменить текущий холст импортом?");
    const n = importMotifsFromData(data, { replace });
    if (n > 0) {
      const name = data.name || (Array.isArray(data) ? null : data.pieces ? "CANVAS" : null);
      if (name) exportName.value = normalizeName(name);
      setStatus(replace ? `Импортирован холст (${n})` : `Добавлено компонентов: ${n}`);
    } else {
      setStatus("В файле нет сегментов");
    }
    return n;
  }

  function snapMotifPoints(motifSegs) {
    const pts = pointsOf(motifSegs);
    if (pts.length <= 24) return pts;
    const b = boundsOf(motifSegs);
    const key = new Map();
    for (const p of pts) key.set(p[0] + "," + p[1], p);
    for (const p of [
      [b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1],
      [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2],
    ]) key.set(p[0] + "," + p[1], canon(p));
    return [...key.values()].slice(0, 32);
  }

  function buildAnchorMap(worldCursor, excludeIds, radius = 10) {
    const map = new Map();
    for (const p of pieces) {
      if (excludeIds.has(p.id)) continue;
      for (const pt of pointsOf(p.segs)) map.set(pt[0] + "," + pt[1], pt);
    }
    const cx = snap(worldCursor[0]);
    const cy = snap(worldCursor[1]);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        map.set((cx + dx) + "," + (cy + dy), [cx + dx, cy + dy]);
      }
    }
    return map;
  }

  /** Лучший сдвиг: совмещение точки мотива с якорем рядом с курсором. */
  function bestAttach(motifSegs, worldCursor, excludeIds = new Set(), preferRaw = null) {
    const mpts = snapMotifPoints(motifSegs);
    if (!mpts.length) return { dx: 0, dy: 0, hit: null };

    const b = boundsOf(motifSegs);
    const mcx = (b.x0 + b.x1) / 2;
    const mcy = (b.y0 + b.y1) / 2;
    const tcx = worldCursor[0];
    const tcy = worldCursor[1];
    const anchorMap = buildAnchorMap(worldCursor, excludeIds);
    const penWeight = preferRaw ? 0.15 : 0;

    let best = null;
    let bestDist = Infinity;
    for (const mp of mpts) {
      for (const ap of anchorMap.values()) {
        const dx = ap[0] - mp[0];
        const dy = ap[1] - mp[1];
        const ncx = mcx + dx;
        const ncy = mcy + dy;
        let d = (ncx - tcx) ** 2 + (ncy - tcy) ** 2;
        if (preferRaw) {
          d += penWeight * ((dx - preferRaw[0]) ** 2 + (dy - preferRaw[1]) ** 2);
        }
        if (d < bestDist) {
          bestDist = d;
          best = { dx, dy, hit: ap };
        }
      }
    }
    return best || { dx: snap(tcx - mcx), dy: snap(tcy - mcy), hit: null };
  }


  function hitTestPiece(world, pad = 0.35) {
    // reverse order — topmost first
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      for (const [a, b] of p.segs) {
        if (distToSeg(world, a, b) <= pad) return p;
      }
      for (const pt of pointsOf(p.segs)) {
        const d = Math.hypot(pt[0] - world[0], pt[1] - world[1]);
        if (d <= pad) return p;
      }
    }
    return null;
  }

  function distToSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    if (len2 < EPS) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }

  function selectedPieces() {
    return pieces.filter((p) => p.selected);
  }

  function clearSelection() {
    for (const p of pieces) p.selected = false;
  }

  function selectedSegs() {
    return selectedPieces().flatMap((p) => p.segs);
  }

  // --- drawing ---
  function drawGrid() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const [x0, yBottom] = screenToWorld(0, h);
    const [x1, yTop] = screenToWorld(w, 0);
    const gx0 = Math.floor(Math.min(x0, x1));
    const gx1 = Math.ceil(Math.max(x0, x1));
    const gy0 = Math.floor(Math.min(yBottom, yTop));
    const gy1 = Math.ceil(Math.max(yBottom, yTop));

    ctx.save();
    // minor lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = gx0; x <= gx1; x++) {
      const [sx] = worldToScreen(x, 0);
      ctx.moveTo(sx + 0.5, 0);
      ctx.lineTo(sx + 0.5, h);
    }
    for (let y = gy0; y <= gy1; y++) {
      const [, sy] = worldToScreen(0, y);
      ctx.moveTo(0, sy + 0.5);
      ctx.lineTo(w, sy + 0.5);
    }
    ctx.stroke();

    // major every 4
    ctx.strokeStyle = COLORS.major;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (let x = gx0; x <= gx1; x++) {
      if (x % 4 !== 0) continue;
      const [sx] = worldToScreen(x, 0);
      ctx.moveTo(sx + 0.5, 0);
      ctx.lineTo(sx + 0.5, h);
    }
    for (let y = gy0; y <= gy1; y++) {
      if (y % 4 !== 0) continue;
      const [, sy] = worldToScreen(0, y);
      ctx.moveTo(0, sy + 0.5);
      ctx.lineTo(w, sy + 0.5);
    }
    ctx.stroke();

    // axes — серые, не цвет узора
    ctx.strokeStyle = COLORS.axis;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    {
      const [sx0] = worldToScreen(0, 0);
      const [, sy0] = worldToScreen(0, 0);
      ctx.moveTo(sx0, 0); ctx.lineTo(sx0, h);
      ctx.moveTo(0, sy0); ctx.lineTo(w, sy0);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // grid points
    const showPts = view.scale >= 18;
    if (showPts) {
      ctx.fillStyle = COLORS.point;
      for (let x = gx0; x <= gx1; x++) {
        for (let y = gy0; y <= gy1; y++) {
          const [sx, sy] = worldToScreen(x, y);
          ctx.beginPath();
          ctx.arc(sx, sy, x % 4 === 0 && y % 4 === 0 ? 2.2 : 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function keyPt(p) {
    return p[0] + "," + p[1];
  }

  /** Угол исходящего ребра в мировых координатах (Y вверх). */
  function edgeAngle(from, to) {
    return Math.atan2(to[1] - from[1], to[0] - from[0]);
  }

  /** Точка строго внутри отрезка a—b (не на концах). */
  function pointOnSegmentInterior(p, a, b) {
    const ax = a[0], ay = a[1], bx = b[0], by = b[1];
    const px = p[0], py = p[1];
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    if (Math.abs(apx * aby - apy * abx) > 1e-9) return false;
    const dot = apx * abx + apy * aby;
    if (dot <= 0) return false;
    const len2 = abx * abx + aby * aby;
    if (dot >= len2) return false;
    return true;
  }

  /**
   * Точка только продолжает прямую — координату не рисуем:
   * 1) два+ соседа на одной линии по обе стороны (цепочка отрезков);
   * 2) точка лежит внутри другого отрезка (наложение / длинная диагональ).
   */
  function shouldSkipCoord(pt, neighbors, allSegs) {
    for (const [a, b] of allSegs) {
      if (keyPt(a) === keyPt(pt) || keyPt(b) === keyPt(pt)) continue;
      if (pointOnSegmentInterior(pt, a, b)) return true;
    }

    const uniq = [];
    const seen = new Set();
    for (const n of neighbors) {
      const k = keyPt(n);
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(n);
    }
    if (uniq.length < 2) return false;

    const rx = uniq[0][0] - pt[0];
    const ry = uniq[0][1] - pt[1];
    for (let i = 1; i < uniq.length; i++) {
      const dx = uniq[i][0] - pt[0];
      const dy = uniq[i][1] - pt[1];
      if (Math.abs(rx * dy - ry * dx) > 1e-9) return false;
    }

    let pos = false;
    let neg = false;
    for (const n of uniq) {
      const dot = (n[0] - pt[0]) * rx + (n[1] - pt[1]) * ry;
      if (dot > 0) pos = true;
      else if (dot < 0) neg = true;
    }
    return pos && neg;
  }

  /**
   * Смещение подписи: рядом с точкой, в сторону от линий.
   * Конец линии — перпендикулярно ребру; угол/стык — в самый широкий зазор.
   */
  function coordLabelOffset(angles) {
    const dist = 6;
    let bestMid = Math.PI / 4;
    if (angles.length === 1) {
      bestMid = angles[0] + Math.PI / 2;
    } else if (angles.length) {
      const sorted = angles.slice().sort((a, b) => a - b);
      let bestGap = -1;
      let bestA = sorted[0];
      let bestB = sorted[0] + Math.PI * 2;
      for (let i = 0; i < sorted.length; i++) {
        const a = sorted[i];
        const b = sorted[(i + 1) % sorted.length] + (i + 1 === sorted.length ? Math.PI * 2 : 0);
        const gap = b - a;
        if (gap > bestGap) {
          bestGap = gap;
          bestA = a;
          bestB = b;
        }
      }
      bestMid = (bestA + bestB) / 2;
      if (bestMid > Math.PI) bestMid -= Math.PI * 2;
    }
    return {
      ox: Math.cos(bestMid) * dist,
      oy: -Math.sin(bestMid) * dist,
    };
  }

  function drawCoordLabels() {
    if (!showCoords || view.scale < 12) return;

    /** @type {number[][][]} */
    const allSegs = [];
    /** @type {Map<string, {pt:number[], neighbors:number[][], angles:number[]}>} */
    const nodes = new Map();
    function touch(a, b) {
      if (keyPt(a) === keyPt(b)) return;
      allSegs.push([a, b]);
      const ka = keyPt(a);
      const kb = keyPt(b);
      if (!nodes.has(ka)) nodes.set(ka, { pt: a, neighbors: [], angles: [] });
      if (!nodes.has(kb)) nodes.set(kb, { pt: b, neighbors: [], angles: [] });
      nodes.get(ka).neighbors.push(b);
      nodes.get(kb).neighbors.push(a);
      nodes.get(ka).angles.push(edgeAngle(a, b));
      nodes.get(kb).angles.push(edgeAngle(b, a));
    }

    for (const p of pieces) {
      for (const [a, b] of p.segs) touch(a, b);
    }
    if (drag && (drag.kind === "move" || drag.kind === "place") && drag.ghostSegs) {
      for (const [a, b] of drag.ghostSegs) touch(a, b);
    }
    if (!nodes.size) return;

    ctx.save();
    ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";

    const placed = [];
    for (const { pt, neighbors, angles } of nodes.values()) {
      if (shouldSkipCoord(pt, neighbors, allSegs)) continue;

      const [sx, sy] = worldToScreen(pt[0], pt[1]);
      let { ox, oy } = coordLabelOffset(angles);
      const label = pt[0] + "," + pt[1];
      const metrics = ctx.measureText(label);
      const tw = metrics.width;
      const th = 10;

      for (let tryN = 0; tryN < 6; tryN++) {
        const alignL = ox >= 0;
        const alignT = oy >= 0;
        const tx = sx + ox;
        const ty = sy + oy;
        const left = alignL ? tx : tx - tw;
        const top = alignT ? ty : ty - th;
        const box = { left, top, right: left + tw, bottom: top + th };
        let hit = false;
        for (const prev of placed) {
          if (box.left < prev.right + 1 && box.right > prev.left - 1 &&
              box.top < prev.bottom + 1 && box.bottom > prev.top - 1) {
            hit = true;
            break;
          }
        }
        if (!hit) {
          ctx.textAlign = alignL ? "left" : "right";
          ctx.textBaseline = alignT ? "top" : "bottom";
          ctx.strokeStyle = COLORS.bg;
          ctx.fillStyle = "#3a3a3a";
          ctx.strokeText(label, tx, ty);
          ctx.fillText(label, tx, ty);
          placed.push(box);
          break;
        }
        const ang = Math.atan2(-oy, ox) + Math.PI / 3;
        const dist = Math.hypot(ox, oy) + 2;
        ox = Math.cos(ang) * dist;
        oy = -Math.sin(ang) * dist;
      }
    }
    ctx.restore();
  }

  function strokeSegs(segs, color, lw, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    // butt + miter: острые углы при любой толщине (round «размывает» геометрию)
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.miterLimit = 8;
    for (const pts of segsToPolylines(segs)) {
      if (pts.length < 2) continue;
      ctx.beginPath();
      const [ax, ay] = worldToScreen(pts[0][0], pts[0][1]);
      ctx.moveTo(ax, ay);
      for (let i = 1; i < pts.length; i++) {
        const [bx, by] = worldToScreen(pts[i][0], pts[i][1]);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function fillPolys(fills, color, alpha = 1) {
    if (!fills || !fills.length) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (const poly of fills) {
      if (!poly || poly.length < 3) continue;
      ctx.beginPath();
      const [sx0, sy0] = worldToScreen(poly[0][0], poly[0][1]);
      ctx.moveTo(sx0, sy0);
      for (let i = 1; i < poly.length; i++) {
        const [sx, sy] = worldToScreen(poly[i][0], poly[i][1]);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPiece(p, opts = {}) {
    const base = lineWidth;
    const color = opts.color || (p.selected ? COLORS.select : COLORS.ink);
    const fillColor = opts.fillColor || (p.selected ? "rgba(29, 78, 216, 0.75)" : COLORS.fill);
    const lw = opts.lw || (p.selected ? base + 0.6 : base);
    const alpha = opts.alpha ?? 1;
    fillPolys(p.fills, fillColor, alpha);
    strokeSegs(p.segs, color, lw, alpha);
    if (p.selected && !opts.ghost) {
      // endpoints
      ctx.save();
      ctx.fillStyle = COLORS.select;
      const r = Math.max(2.2, Math.min(4.5, lineWidth * 1.1));
      for (const pt of pointsOf(p.segs)) {
        const [sx, sy] = worldToScreen(pt[0], pt[1]);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    if (showGrid) drawGrid();

    // pieces (non-ghost)
    const movingIds = drag && drag.kind === "move" ? new Set(drag.ids) : null;
    for (const p of pieces) {
      if (movingIds && movingIds.has(p.id)) {
        // original faint
        drawPiece(p, { alpha: 0.2, color: COLORS.ink, lw: lineWidth });
        continue;
      }
      drawPiece(p);
    }

    // ghost for move
    if (drag && drag.kind === "move" && drag.ghostSegs) {
      fillPolys(drag.ghostFills, COLORS.fillGhost, 1);
      strokeSegs(drag.ghostSegs, COLORS.ghost, lineWidth + 0.4, 1);
      if (drag.hit) {
        const [sx, sy] = worldToScreen(drag.hit[0], drag.hit[1]);
        ctx.save();
        ctx.fillStyle = COLORS.attach;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ghost for place
    if (drag && drag.kind === "place" && drag.ghostSegs) {
      fillPolys(drag.ghostFills, COLORS.fillGhost, 1);
      strokeSegs(drag.ghostSegs, COLORS.ghost, lineWidth + 0.4, 1);
      if (drag.hit) {
        const [sx, sy] = worldToScreen(drag.hit[0], drag.hit[1]);
        ctx.save();
        ctx.fillStyle = COLORS.attach;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // marquee
    if (drag && drag.kind === "box") {
      const [ax, ay] = worldToScreen(drag.x0, drag.y0);
      const [bx, by] = worldToScreen(drag.x1, drag.y1);
      const x = Math.min(ax, bx), y = Math.min(ay, by);
      const ww = Math.abs(bx - ax), hh = Math.abs(by - ay);
      ctx.save();
      ctx.fillStyle = COLORS.selectFill;
      ctx.strokeStyle = COLORS.select;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.fillRect(x, y, ww, hh);
      ctx.strokeRect(x, y, ww, hh);
      ctx.restore();
    }
    if (showCoords) drawCoordLabels();
    syncSelectionUI();
  }

  // --- palette thumbnails ---
  function paintThumb(cv, segs, fills) {
    const parent = cv.parentElement;
    // не перетирать CSS-высоту инлайном — иначе ломаются компактные превью
    const css = getComputedStyle(cv);
    let cssH = parseFloat(css.height);
    if (!Number.isFinite(cssH) || cssH < 8) {
      cssH = cv.clientHeight || 40;
    }
    let cssW = cv.clientWidth;
    if (!cssW || cssW < 8) {
      cssW = parent ? Math.floor(parent.getBoundingClientRect().width - 8) : 0;
    }
    if (!cssW || cssW < 8) cssW = 56;

    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(cssW * dpr));
    cv.height = Math.max(1, Math.round(cssH * dpr));

    const c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, cssW, cssH);
    c.fillStyle = COLORS.bg;
    c.fillRect(0, 0, cssW, cssH);

    if (!segs || !segs.length) return;

    const b = boundsOf(segs);
    const pad = 0.9;
    const bw = Math.max(b.x1 - b.x0, 0.1) + pad * 2;
    const bh = Math.max(b.y1 - b.y0, 0.1) + pad * 2;
    const sc = Math.min(cssW / bw, cssH / bh) * 0.88;
    const ox = cssW / 2 - ((b.x0 + b.x1) / 2) * sc;
    const oy = cssH / 2 + ((b.y0 + b.y1) / 2) * sc;

    if (fills && fills.length) {
      c.fillStyle = COLORS.fill;
      for (const poly of fills) {
        if (!poly || poly.length < 3) continue;
        c.beginPath();
        c.moveTo(ox + poly[0][0] * sc, oy - poly[0][1] * sc);
        for (let i = 1; i < poly.length; i++) {
          c.lineTo(ox + poly[i][0] * sc, oy - poly[i][1] * sc);
        }
        c.closePath();
        c.fill();
      }
    }

    c.strokeStyle = COLORS.ink;
    c.lineWidth = Math.max(1.1, Math.min(2.0, 22 / Math.max(bw, bh)));
    c.lineCap = "butt";
    c.lineJoin = "miter";
    c.miterLimit = 8;
    c.beginPath();
    for (const pts of segsToPolylines(segs)) {
      if (pts.length < 2) continue;
      c.moveTo(ox + pts[0][0] * sc, oy - pts[0][1] * sc);
      for (let i = 1; i < pts.length; i++) {
        c.lineTo(ox + pts[i][0] * sc, oy - pts[i][1] * sc);
      }
    }
    c.stroke();
  }

  function scheduleThumb(cv, segs, fills) {
    // два кадра — дождаться CSS grid layout, иначе clientWidth=0 и превью кривит
    requestAnimationFrame(() => {
      requestAnimationFrame(() => paintThumb(cv, segs, fills));
    });
  }

  function renderPalette() {
    const smallEl = document.getElementById("basePaletteSmall");
    const largeEl = document.getElementById("basePaletteLarge");
    smallEl.innerHTML = "";
    largeEl.innerHTML = "";

    function card(comp, parent, { showTag = false } = {}) {
      const el = document.createElement("div");
      el.className = "comp-card";
      el.draggable = true;
      el.dataset.libId = comp.id;
      el.title = comp.name + (showTag && comp.tag ? " · " + comp.tag : "");
      el.innerHTML = showTag
        ? `<div class="name"><span>${comp.name}</span><span class="tag">${comp.tag}</span></div>`
        : `<div class="name"><span>${comp.name}</span></div>`;
      const cv = document.createElement("canvas");
      el.appendChild(cv);
      parent.appendChild(el);
      scheduleThumb(cv, comp.segs, comp.fills);

      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/libId", comp.id);
        e.dataTransfer.effectAllowed = "copy";
        const img = document.createElement("canvas");
        img.width = 1; img.height = 1;
        e.dataTransfer.setDragImage(img, 0, 0);
      });

      el.addEventListener("click", () => {
        startPlace(comp.id);
      });
    }

    for (const c of BASE) {
      card(c, c.compact ? smallEl : largeEl, { showTag: false });
    }
  }

  function startPlace(libId) {
    const lib = findLib(libId);
    if (!lib) return;
    tool = "select";
    syncTools();
    drag = {
      kind: "place",
      libId,
      baseSegs: cloneSegs(lib.segs),
      ghostSegs: cloneSegs(lib.segs),
      baseFills: cloneFills(lib.fills),
      ghostFills: cloneFills(lib.fills),
      hit: null,
    };
    setStatus("Размещение: «" + lib.name + "» — кликните по сетке, Esc — отмена");
    canvas.classList.add("dragging");
  }

  // --- actions ---
  function placePiece(libId, segs, fills) {
    clearSelection();
    const p = {
      id: nextId++,
      libId,
      segs: cloneSegs(segs),
      fills: cloneFills(fills),
      selected: true,
    };
    pieces.push(p);
    pushHistory();
    draw();
  }

  function deleteSelected() {
    const n = selectedPieces().length;
    if (!n) return;
    pieces = pieces.filter((p) => !p.selected);
    pushHistory();
    draw();
    setStatus("Удалено: " + n);
  }

  function clearAll() {
    if (!pieces.length) return;
    if (!confirm("Очистить весь холст?")) return;
    pieces = [];
    pushHistory();
    draw();
  }

  function transformSelected(fnSegs, fnFills) {
    const sel = selectedPieces();
    if (!sel.length) {
      setStatus("Сначала выделите компоненты");
      return;
    }
    const all = selectedSegs();
    const [cx, cy] = centroid(all);
    for (const p of sel) {
      p.segs = fnSegs(p.segs, cx, cy);
      if (fnFills && p.fills && p.fills.length) {
        p.fills = fnFills(p.fills, cx, cy);
      }
    }
    pushHistory();
    draw();
  }

  function rotateSelected90(dir) {
    transformSelected(
      (segs, cx, cy) => rotateSegs90(segs, dir, cx, cy),
      (fills, cx, cy) => rotateFills90(fills, dir, cx, cy)
    );
    setStatus(dir > 0 ? "Поворот вправо 90°" : "Поворот влево 90°");
  }

  function nudgeSelected(dx, dy) {
    const sel = selectedPieces();
    if (!sel.length) {
      setStatus("Сначала выделите компоненты");
      return;
    }
    for (const p of sel) {
      p.segs = translate(p.segs, dx, dy);
      if (p.fills && p.fills.length) {
        p.fills = translateFills(p.fills, dx, dy);
      }
    }
    pushHistory();
    draw();
    setStatus("Сдвиг " + (dx ? (dx > 0 ? "→" : "←") : (dy > 0 ? "↑" : "↓")));
  }

  function flipSelected(axis) {
    transformSelected(
      (segs, cx, cy) => mirrorSegs(segs, axis, cx, cy),
      (fills, cx, cy) => mirrorFills(fills, axis, cx, cy)
    );
    setStatus(axis === "h" ? "Отражение по горизонтали" : "Отражение по вертикали");
  }

  function scaleSelected(factor) {
    transformSelected(
      (segs, cx, cy) => scaleSegs(segs, factor, cx, cy),
      (fills, cx, cy) => scaleFills(fills, factor, cx, cy)
    );
    setStatus(factor > 1 ? "Увеличение ×2" : "Уменьшение ÷2");
  }

  function syncSelectionUI() {
    const has = selectedPieces().length > 0;
    for (const id of ["btnScaleUp", "btnScaleDown"]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !has;
    }
  }

  function copySelection() {
    const sel = selectedPieces();
    if (!sel.length) {
      setStatus("Нечего копировать — выделите область");
      return;
    }
    clipBoard = sel.map((p) => ({
      libId: p.libId,
      segs: cloneSegs(p.segs),
      fills: cloneFills(p.fills),
    }));
    pasteCount = 0;
    setStatus("Скопировано: " + sel.length + " компонент(ов)");
  }

  function pasteSelection() {
    if (!clipBoard.length) {
      setStatus("Буфер пуст — сначала Ctrl+C");
      return;
    }
    pasteCount += 1;
    // сдвиг от копии, чтобы не накладывалось
    const dx = 2 * pasteCount;
    const dy = 2 * pasteCount;
    clearSelection();
    for (const item of clipBoard) {
      pieces.push({
        id: nextId++,
        libId: item.libId,
        segs: translate(item.segs, dx, dy),
        fills: translateFills(item.fills, dx, dy),
        selected: true,
      });
    }
    pushHistory();
    draw();
    setStatus("Вставлено: " + clipBoard.length + " (сдвиг +" + dx + ",+" + dy + ")");
  }

  function exportSelection() {
    const segs = selectedSegs();
    if (!segs.length) {
      setStatus("Нет выделения");
      return;
    }
    const fills = selectedPieces().flatMap((p) => p.fills || []);
    const name = exportName.value || "SELECTION";
    const py = segsToPython(name, segs) + (fills.length ? "\n\n" + fillsToPython(name, fills) : "");
    exportOut.value = py + "\n\n# JSON\n" + segsToJson(name, segs, fills);
    setStatus("Экспорт выделения (" + segs.length + " сегм.)");
  }

  function exportAll() {
    const segs = pieces.flatMap((p) => p.segs);
    if (!segs.length) {
      setStatus("Холст пуст");
      return;
    }
    const fills = pieces.flatMap((p) => p.fills || []);
    const name = exportName.value || "CANVAS";
    const py = segsToPython(name, segs) + (fills.length ? "\n\n" + fillsToPython(name, fills) : "");
    exportOut.value = py + "\n\n# JSON\n" + segsToJson(name, segs, fills);
    setStatus("Экспорт холста (" + segs.length + " сегм.)");
  }

  function exportCanvas() {
    if (!pieces.length) {
      setStatus("Холст пуст");
      return;
    }
    const name = normalizeName(exportName.value || "CANVAS");
    const data = {
      name,
      pieces: pieces.map((p) => ({
        id: p.id,
        libId: p.libId,
        segs: p.segs,
        fills: p.fills || [],
      })),
      nextId,
      view: { x: view.x, y: view.y, scale: view.scale },
    };
    exportOut.value = JSON.stringify(data, null, 2);
    setStatus("JSON холста (" + pieces.length + " компонентов)");
  }

  function fmtSvgNum(n) {
    if (!Number.isFinite(n)) return "0";
    const r = Math.round(n * 1000) / 1000;
    return String(r);
  }

  function canvasToSvg(segs, fills, title) {
    const b = boundsOfSegsAndFills(segs, fills);
    // толщина в мировых единицах ≈ текущий вид на холсте
    const strokeW = Math.max(0.04, lineWidth / Math.max(view.scale, 1));
    const pad = strokeW * 0.6;
    const x0 = b.x0 - pad;
    const y0 = b.y0 - pad;
    const x1 = b.x1 + pad;
    const y1 = b.y1 + pad;
    const w = Math.max(x1 - x0, EPS);
    const h = Math.max(y1 - y0, EPS);
    const ink = COLORS.ink;
    const fillOpacity = 0.82;
    const safeTitle = String(title || "Chuvash pattern")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const parts = [];
    parts.push(
      `<!-- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/` +
      ` Based on traditional Chuvash ornaments. Provided as-is, no warranty. -->`
    );
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmtSvgNum(x0)} ${fmtSvgNum(-y1)} ${fmtSvgNum(w)} ${fmtSvgNum(h)}" fill="none">`
    );
    parts.push(
      `<metadata>` +
      `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">` +
      `<cc:Work rdf:about="">` +
      `<dc:title>${safeTitle}</dc:title>` +
      `<dc:description>Based on traditional Chuvash ornaments</dc:description>` +
      `<cc:license rdf:resource="http://creativecommons.org/publicdomain/zero/1.0/"/>` +
      `</cc:Work>` +
      `<cc:License rdf:about="http://creativecommons.org/publicdomain/zero/1.0/">` +
      `<cc:permits rdf:resource="http://creativecommons.org/ns#Reproduction"/>` +
      `<cc:permits rdf:resource="http://creativecommons.org/ns#Distribution"/>` +
      `<cc:permits rdf:resource="http://creativecommons.org/ns#DerivativeWorks"/>` +
      `</cc:License>` +
      `</rdf:RDF>` +
      `</metadata>`
    );
    // Y вверх как на холсте; фона нет — прозрачный
    parts.push(
      `<g transform="scale(1,-1)" stroke="${ink}" stroke-width="${fmtSvgNum(strokeW)}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="8">`
    );

    for (const poly of fills || []) {
      if (!poly || poly.length < 3) continue;
      const pts = poly.map((p) => `${fmtSvgNum(p[0])},${fmtSvgNum(p[1])}`).join(" ");
      parts.push(
        `<polygon points="${pts}" fill="${ink}" fill-opacity="${fillOpacity}" stroke="none"/>`
      );
    }

    for (const pts of segsToPolylines(segs)) {
      if (pts.length < 2) continue;
      const d = pts.map((p) => `${fmtSvgNum(p[0])},${fmtSvgNum(p[1])}`).join(" ");
      parts.push(`<polyline points="${d}" fill="none"/>`);
    }

    parts.push("</g></svg>");
    return parts.join("\n");
  }

  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportCanvasSvg() {
    const segs = pieces.flatMap((p) => p.segs);
    if (!segs.length) {
      setStatus("Холст пуст");
      return;
    }
    const fills = pieces.flatMap((p) => p.fills || []);
    const name = normalizeName(exportName.value || "CANVAS");
    const svg = canvasToSvg(segs, fills, name);
    exportOut.value = svg;
    downloadText(name.toLowerCase() + ".svg", svg, "image/svg+xml;charset=utf-8");
    setStatus("SVG скачан (без фона, " + segs.length + " сегм.)");
  }

  // --- pointer events ---
  function updatePlaceGhost(world) {
    if (!drag || drag.kind !== "place") return;
    const att = bestAttach(drag.baseSegs, world);
    drag.ghostSegs = translate(drag.baseSegs, att.dx, att.dy);
    drag.ghostFills = translateFills(drag.baseFills, att.dx, att.dy);
    drag.hit = att.hit;
    drag.dx = att.dx;
    drag.dy = att.dy;
  }

  function updateMoveGhost(world) {
    if (!drag || drag.kind !== "move") return;
    const rawDx = world[0] - drag.originWorld[0];
    const rawDy = world[1] - drag.originWorld[1];
    const combined = drag.ids.flatMap((id) => drag.baseById[id]);
    const exclude = new Set(drag.ids);
    const bestT = bestAttach(combined, world, exclude, [rawDx, rawDy]);
    drag.dx = bestT.dx;
    drag.dy = bestT.dy;
    drag.hit = bestT.hit;
    drag.ghostSegs = translate(combined, bestT.dx, bestT.dy);
    const fillsCombined = drag.ids.flatMap((id) => (drag.baseFillsById && drag.baseFillsById[id]) || []);
    drag.ghostFills = translateFills(fillsCombined, bestT.dx, bestT.dy);
  }


  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 1 || tool === "pan" || (e.button === 0 && e.altKey)) {
      canvas.setPointerCapture(e.pointerId);
      drag = { kind: "pan", x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      canvas.classList.add("panning");
      return;
    }
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    const [sx, sy] = clientToCanvas(e);
    const world = screenToWorld(sx, sy);

    if (drag && drag.kind === "place") {
      placePiece(drag.libId, drag.ghostSegs || drag.baseSegs, drag.ghostFills || drag.baseFills);
      drag = null;
      canvas.classList.remove("dragging");
      setStatus("Компонент размещён");
      return;
    }

    const hit = hitTestPiece(world);
    if (hit) {
      if (!e.shiftKey && !hit.selected) clearSelection();
      hit.selected = true;
      const ids = selectedPieces().map((p) => p.id);
      const baseById = {};
      const baseFillsById = {};
      for (const p of selectedPieces()) {
        baseById[p.id] = cloneSegs(p.segs);
        baseFillsById[p.id] = cloneFills(p.fills);
      }
      drag = {
        kind: "move",
        ids,
        baseById,
        baseFillsById,
        originWorld: world,
        dx: 0,
        dy: 0,
        ghostSegs: selectedSegs(),
        ghostFills: selectedPieces().flatMap((p) => cloneFills(p.fills)),
        hit: null,
        moved: false,
      };
      canvas.classList.add("dragging");
      draw();
      return;
    }

    // marquee
    if (!e.shiftKey) clearSelection();
    drag = {
      kind: "box",
      x0: world[0], y0: world[1],
      x1: world[0], y1: world[1],
      additive: e.shiftKey,
    };
    draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    const [sx, sy] = clientToCanvas(e);
    const world = screenToWorld(sx, sy);

    if (!drag) {
      const g = snapPoint(world);
      setStatus(`x=${fmt(g[0])}, y=${fmt(g[1])} · масштаб ${view.scale.toFixed(0)}px`);
      const over = tool === "select" && !!hitTestPiece(world);
      canvas.classList.toggle("over-piece", over);
      return;
    }
    canvas.classList.remove("over-piece");

    if (drag.kind === "pan") {
      view.x = drag.vx + (e.clientX - drag.x);
      view.y = drag.vy + (e.clientY - drag.y);
      draw();
      return;
    }

    if (drag.kind === "place") {
      updatePlaceGhost(world);
      draw();
      return;
    }

    if (drag.kind === "move") {
      drag.moved = true;
      updateMoveGhost(world);
      draw();
      return;
    }

    if (drag.kind === "box") {
      drag.x1 = world[0];
      drag.y1 = world[1];
      draw();
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!drag) return;

    if (drag.kind === "pan") {
      drag = null;
      canvas.classList.remove("panning");
      scheduleSaveCanvas();
      return;
    }

    if (drag.kind === "move") {
      if (drag.moved) {
        for (const p of pieces) {
          if (!drag.ids.includes(p.id)) continue;
          p.segs = translate(drag.baseById[p.id], drag.dx, drag.dy);
          p.fills = translateFills((drag.baseFillsById && drag.baseFillsById[p.id]) || [], drag.dx, drag.dy);
        }
        pushHistory();
        setStatus("Перенесено");
      }
      drag = null;
      canvas.classList.remove("dragging");
      draw();
      return;
    }

    if (drag.kind === "box") {
      const x0 = Math.min(drag.x0, drag.x1);
      const x1 = Math.max(drag.x0, drag.x1);
      const y0 = Math.min(drag.y0, drag.y1);
      const y1 = Math.max(drag.y0, drag.y1);
      const tiny = Math.hypot(drag.x1 - drag.x0, drag.y1 - drag.y0) < 0.15;
      if (!tiny) {
        for (const p of pieces) {
          const pts = pointsOf(p.segs);
          const inside = pts.some(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
          if (inside) p.selected = true;
          else if (!drag.additive) p.selected = false;
        }
        setStatus("Выделено: " + selectedPieces().length);
      } else if (!drag.additive) {
        clearSelection();
      }
      drag = null;
      draw();
      return;
    }

    // place stays until click — handled in pointerdown
  });

  canvas.addEventListener("pointercancel", () => {
    if (drag && drag.kind !== "place") {
      drag = null;
      canvas.classList.remove("dragging", "panning");
      draw();
    }
  });

  // HTML5 drop from palette
  canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    const libId = e.dataTransfer.getData("text/libId");
    // during dragover, data may be empty in some browsers — use active drag
    const [sx, sy] = clientToCanvas(e);
    const world = screenToWorld(sx, sy);
    if (!drag || drag.kind !== "place") {
      // try from current dragging card
      const id = canvas._dragLibId || libId;
      if (id) {
        const lib = findLib(id);
        if (lib) {
          drag = {
            kind: "place",
            libId: id,
            baseSegs: cloneSegs(lib.segs),
            ghostSegs: cloneSegs(lib.segs),
            baseFills: cloneFills(lib.fills),
            ghostFills: cloneFills(lib.fills),
            hit: null,
          };
          canvas.classList.add("dragging");
        }
      }
    }
    if (drag && drag.kind === "place") {
      updatePlaceGhost(world);
      draw();
    }
  });

  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    const [sx, sy] = clientToCanvas(e);
    const world = screenToWorld(sx, sy);
    let libId = e.dataTransfer.getData("text/libId") || canvas._dragLibId;
    if (drag && drag.kind === "place") libId = drag.libId;
    const lib = findLib(libId);
    if (!lib) return;
    if (!drag || drag.kind !== "place") {
      drag = {
        kind: "place",
        libId,
        baseSegs: cloneSegs(lib.segs),
        ghostSegs: null,
        baseFills: cloneFills(lib.fills),
        ghostFills: null,
        hit: null,
      };
    }
    updatePlaceGhost(world);
    placePiece(libId, drag.ghostSegs, drag.ghostFills);
    drag = null;
    canvas.classList.remove("dragging");
    canvas._dragLibId = null;
    setStatus("Компонент размещён");
  });

  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest && e.target.closest(".comp-card");
    if (card) canvas._dragLibId = card.dataset.libId;
  });

  function zoomView(factor, sx, sy) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (sx == null) sx = w / 2;
    if (sy == null) sy = h / 2;
    const before = screenToWorld(sx, sy);
    view.scale = Math.max(8, Math.min(80, view.scale * factor));
    view.x = sx - before[0] * view.scale - w / 2;
    view.y = sy + before[1] * view.scale - h / 2;
    draw();
    scheduleSaveCanvas();
    setStatus("масштаб " + view.scale.toFixed(0) + "px");
  }

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [sx, sy] = clientToCanvas(e);
    zoomView(e.deltaY > 0 ? 0.9 : 1.1, sx, sy);
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    const mod = e.ctrlKey || e.metaKey;
    const code = e.code;

    if (e.key === "Escape") {
      if (drag) {
        drag = null;
        canvas.classList.remove("dragging", "panning");
        draw();
        setStatus("Отменено");
      } else {
        clearSelection();
        draw();
      }
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
    }

    // стрелки — сдвиг выделения на 1 клетку
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudgeSelected(-1, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nudgeSelected(1, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nudgeSelected(0, 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nudgeSelected(0, -1);
    }

    // Ctrl+C / Ctrl+V — по code, чтобы работало и на русской раскладке (С / М)
    if (mod && code === "KeyC") {
      e.preventDefault();
      copySelection();
    }
    if (mod && (code === "KeyV" || e.key.toLowerCase() === "м")) {
      e.preventDefault();
      pasteSelection();
    }
    if (mod && code === "KeyD") {
      e.preventDefault();
      copySelection();
      pasteSelection();
    }
    if (mod && code === "KeyZ") {
      e.preventDefault();
      undo();
    }
    if (mod && code === "KeyY") {
      e.preventDefault();
      redo();
    }
    if (mod && code === "KeyA") {
      e.preventDefault();
      for (const p of pieces) p.selected = true;
      draw();
    }

    if (!mod && code === "KeyR" && !e.shiftKey) rotateSelected90(1);
    if (!mod && code === "KeyR" && e.shiftKey) rotateSelected90(-1);
    if (!mod && code === "KeyH") flipSelected("h");
    if (!mod && code === "KeyV") flipSelected("v");
  });

  function syncTools() {
    document.getElementById("toolSelect").classList.toggle("active", tool === "select");
    document.getElementById("toolPan").classList.toggle("active", tool === "pan");
    canvas.classList.toggle("mode-pan", tool === "pan");
  }

  document.getElementById("toolSelect").onclick = () => { tool = "select"; syncTools(); };
  document.getElementById("toolPan").onclick = () => { tool = "pan"; syncTools(); };
  (function syncGridBtn() {
    const btn = document.getElementById("btnGrid");
    btn.classList.toggle("active", showGrid);
    btn.textContent = showGrid ? "Сетка: вкл" : "Сетка: выкл";
  })();
  document.getElementById("btnGrid").onclick = () => {
    showGrid = !showGrid;
    localStorage.setItem("chuvash_show_grid", showGrid ? "1" : "0");
    document.getElementById("btnGrid").classList.toggle("active", showGrid);
    document.getElementById("btnGrid").textContent = showGrid ? "Сетка: вкл" : "Сетка: выкл";
    draw();
  };
  (function syncCoordsBtn() {
    const btn = document.getElementById("btnCoords");
    if (!btn) return;
    btn.classList.toggle("active", showCoords);
    btn.textContent = showCoords ? "Коорд: вкл" : "Коорд: выкл";
  })();
  document.getElementById("btnCoords").onclick = () => {
    showCoords = !showCoords;
    localStorage.setItem("chuvash_show_coords", showCoords ? "1" : "0");
    document.getElementById("btnCoords").classList.toggle("active", showCoords);
    document.getElementById("btnCoords").textContent = showCoords ? "Коорд: вкл" : "Коорд: выкл";
    draw();
  };
  document.getElementById("btnRot90L").onclick = () => rotateSelected90(-1);
  document.getElementById("btnRot90R").onclick = () => rotateSelected90(1);
  document.getElementById("btnFlipH").onclick = () => flipSelected("h");
  document.getElementById("btnFlipV").onclick = () => flipSelected("v");
  document.getElementById("btnScaleUp").onclick = () => scaleSelected(2);
  document.getElementById("btnScaleDown").onclick = () => scaleSelected(0.5);
  document.getElementById("btnCopySel").onclick = copySelection;

  const lwInput = document.getElementById("lineWidth");
  const lwVal = document.getElementById("lineWidthVal");
  function syncLineWidthUI() {
    // явная установка — иначе thumb у range с дробным min часто «съезжает»
    const v = Math.round(lineWidth * 2) / 2;
    lineWidth = Math.min(8, Math.max(1, v));
    lwInput.min = "1";
    lwInput.max = "8";
    lwInput.step = "0.5";
    lwInput.value = String(lineWidth);
    lwVal.textContent = String(lineWidth);
  }
  syncLineWidthUI();
  lwInput.addEventListener("input", () => {
    lineWidth = parseFloat(lwInput.value) || 2.5;
    lwVal.textContent = String(lineWidth);
    draw();
  });

  const colorBgInput = document.getElementById("colorBg");
  const colorInkInput = document.getElementById("colorInk");
  (function initCanvasColors() {
    const savedBg = localStorage.getItem("chuvash_color_bg");
    const savedInk = localStorage.getItem("chuvash_color_ink");
    if (savedBg) applyBgColor(savedBg);
    if (savedInk) applyInkColor(savedInk);
    colorBgInput.value = COLORS.bg;
    colorInkInput.value = COLORS.ink;
  })();
  colorBgInput.addEventListener("input", () => {
    applyBgColor(colorBgInput.value);
    localStorage.setItem("chuvash_color_bg", COLORS.bg);
    draw();
    repaintAllThumbs();
  });
  colorInkInput.addEventListener("input", () => {
    applyInkColor(colorInkInput.value);
    localStorage.setItem("chuvash_color_ink", COLORS.ink);
    draw();
    repaintAllThumbs();
  });

  document.getElementById("btnZoomIn").onclick = () => zoomView(1.25);
  document.getElementById("btnZoomOut").onclick = () => zoomView(0.8);

  document.getElementById("btnPasteSel").onclick = pasteSelection;
  document.getElementById("btnDelete").onclick = deleteSelected;
  document.getElementById("btnClear").onclick = clearAll;
  document.getElementById("btnUndo").onclick = undo;
  document.getElementById("btnRedo").onclick = redo;
  document.getElementById("btnExportSel").onclick = exportSelection;
  document.getElementById("btnExportAll").onclick = exportAll;
  document.getElementById("btnExportCanvas").onclick = exportCanvas;
  document.getElementById("btnExportSvg").onclick = exportCanvasSvg;

  const appRoot = document.querySelector(".app");
  const appHeader = document.getElementById("appHeader");
  const btnTools = document.getElementById("btnTools");
  const btnExportPanel = document.getElementById("btnExportPanel");

  function refreshMobileLayout() {
    requestAnimationFrame(() => resize());
  }

  btnTools.addEventListener("click", () => {
    const open = appHeader.classList.toggle("tools-open");
    btnTools.setAttribute("aria-expanded", open ? "true" : "false");
    btnTools.textContent = open ? "Скрыть" : "Инструменты";
    if (open) {
      appRoot.classList.remove("export-open");
      btnExportPanel.setAttribute("aria-expanded", "false");
      btnExportPanel.textContent = "Экспорт";
    }
    refreshMobileLayout();
  });

  btnExportPanel.addEventListener("click", () => {
    const open = appRoot.classList.toggle("export-open");
    btnExportPanel.setAttribute("aria-expanded", open ? "true" : "false");
    btnExportPanel.textContent = open ? "Скрыть" : "Экспорт";
    if (open) {
      appHeader.classList.remove("tools-open");
      btnTools.setAttribute("aria-expanded", "false");
      btnTools.textContent = "Инструменты";
    }
    refreshMobileLayout();
  });


  document.getElementById("btnImport").onclick = () => {
    importFromText(exportOut.value);
  };

  const importFile = document.getElementById("importFile");
  document.getElementById("btnImportFile").onclick = () => importFile.click();
  importFile.addEventListener("change", async () => {
    const file = importFile.files && importFile.files[0];
    importFile.value = "";
    if (!file) return;
    try {
      importFromText(await file.text());
    } catch {
      setStatus("Не удалось прочитать файл");
    }
  });

  document.getElementById("btnCopy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(exportOut.value);
      setStatus("Скопировано в буфер");
    } catch {
      exportOut.select();
      setStatus("Выделите текст и скопируйте вручную");
    }
  };

  function repaintAllThumbs() {
    document.querySelectorAll(
      "#basePaletteSmall .comp-card, #basePaletteLarge .comp-card"
    ).forEach((el) => {
      const id = el.dataset.libId;
      const lib = findLib(id);
      const cv = el.querySelector("canvas");
      if (lib && cv) paintThumb(cv, lib.segs, lib.fills);
    });
  }

  renderPalette();
  if (!loadCanvas()) {
    const starter = findLib("bolshoe_serdtse");
    pieces.push({
      id: nextId++,
      libId: "bolshoe_serdtse",
      segs: cloneSegs(starter.segs),
      fills: cloneFills(starter.fills),
      selected: false,
    });
    pushHistory();
    saveCanvas();
  }
  window.addEventListener("resize", () => {
    resize();
    repaintAllThumbs();
  });
  resize();
  setStatus(pieces.length ? "Готово" : "Готово — основа: большое сердце");
})();
