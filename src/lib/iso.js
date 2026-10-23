/*
 * A tiny isometric "CAD kernel" for the site's artwork.
 *
 * World axes: +x runs to the lower right, +y to the lower left, +z up.
 * Parts are lists of flat faces ({ pts, n }) with outward normals. The
 * <Solid> component projects, shades and outlines them as plain SVG, so the
 * site gets dimensional, lit CAD objects without loading a 3D library.
 */

const COS30 = Math.cos(Math.PI / 6);

export function normalize([x, y, z]) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/* Direction toward the viewer, and the key light (upper left). */
export const VIEW = [1, 1, 1];
const LIGHT = normalize([-0.25, 0.55, 1]);

export const AXIS = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/* Local cross-section (u, v) plus distance w along an axis → world point. */
export const FRAME = {
  x: (u, v, w) => [w, u, v],
  y: (u, v, w) => [u, w, v],
  z: (u, v, w) => [u, v, w],
};

/* ---------- Projection ---------- */

export const project = ([x, y, z]) => [(x - y) * COS30, (x + y) / 2 - z];

export function projection(k = 1, ox = 0, oy = 0) {
  const P = (point) => {
    const [x, y] = project(point);
    return [ox + x * k, oy + y * k];
  };
  P.k = k;
  return P;
}

/* Scale and centre a cloud of 3D points inside a width × height viewBox. */
export function fit(points, width, height, pad = 16, offset = [0, 0]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    const [x, y] = project(point);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const k = Math.min(
    (width - pad * 2) / (maxX - minX),
    (height - pad * 2) / (maxY - minY),
  );
  return projection(
    k,
    (width - (maxX + minX) * k) / 2 + offset[0],
    (height - (maxY + minY) * k) / 2 + offset[1],
  );
}

export const pointsOf = (...parts) =>
  parts.flat().flatMap((face) => (Array.isArray(face) ? [face] : face.pts));

/* ---------- 2D profiles (u, v, smoothEdgeAfter) ---------- */

export function arc(cx, cy, r, from, to, segments = 8) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / segments) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), i < segments];
  });
}

export function circle(cx, cy, r, segments = 32, smooth = true, phase = 0) {
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2 + (phase * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), smooth];
  });
}

export function roundedRect(x0, y0, x1, y1, r, segments = 6) {
  return [
    ...arc(x1 - r, y0 + r, r, -90, 0, segments),
    ...arc(x1 - r, y1 - r, r, 0, 90, segments),
    ...arc(x0 + r, y1 - r, r, 90, 180, segments),
    ...arc(x0 + r, y0 + r, r, 180, 270, segments),
  ];
}

export const rect = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

function signedArea(profile) {
  let area = 0;
  profile.forEach(([u0, v0], i) => {
    const [u1, v1] = profile[(i + 1) % profile.length];
    area += u0 * v1 - u1 * v0;
  });
  return area / 2;
}

/* ---------- Solids ---------- */

/* Sweep a closed 2D profile along an axis from w0 to w1. */
export function extrude(profile, axis, w0, w1, extra = {}) {
  const map = FRAME[axis];
  const n = profile.length;
  // Wind counter-clockwise; each point's flag describes the edge leaving it.
  const pts =
    signedArea(profile) >= 0
      ? profile
      : profile.map((_, i) => {
          const p = profile[n - 1 - i];
          return [p[0], p[1], profile[(2 * n - 2 - i) % n][2]];
        });

  const faces = [
    { pts: pts.map(([u, v]) => map(u, v, w1)), n: map(0, 0, 1), cap: true, ...extra },
    { pts: pts.map(([u, v]) => map(u, v, w0)), n: map(0, 0, -1), cap: true, ...extra },
  ];

  pts.forEach(([u0, v0, smooth], i) => {
    const [u1, v1] = pts[(i + 1) % n];
    const length = Math.hypot(u1 - u0, v1 - v0);
    if (!length) return;
    faces.push({
      pts: [map(u0, v0, w0), map(u1, v1, w0), map(u1, v1, w1), map(u0, v0, w1)],
      n: map((v1 - v0) / length, (u0 - u1) / length, 0),
      smooth: Boolean(smooth),
      ...extra,
    });
  });

  return faces;
}

export const box = ([x0, y0, z0], [x1, y1, z1], extra) =>
  extrude(rect(x0, y0, x1, y1), "z", z0, z1, extra);

export const cylinder = (axis, u, v, r, w0, w1, extra, segments = 36) =>
  extrude(circle(u, v, r, segments), axis, w0, w1, extra);

function newell(pts) {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  });
  return normalize([nx, ny, nz]);
}

const centroid = (pts) =>
  mul(pts.reduce((sum, p) => add(sum, p), [0, 0, 0]), 1 / pts.length);

/* Skin a convex solid through rings of equal length (bottom → top). */
export function loft(rings, extra = {}, smoothSides = false) {
  const middle = centroid(rings.flat());
  const faces = [];
  const addFace = (pts, props = {}) => {
    let n = newell(pts);
    if (dot(n, sub(centroid(pts), middle)) < 0) n = mul(n, -1);
    faces.push({ pts, n, ...extra, ...props });
  };

  addFace(rings[0], { cap: true });
  addFace(rings[rings.length - 1], { cap: true });
  for (let r = 0; r < rings.length - 1; r += 1) {
    const a = rings[r];
    const b = rings[r + 1];
    a.forEach((_, i) => {
      const j = (i + 1) % a.length;
      addFace([a[i], a[j], b[j], b[i]], { smooth: smoothSides });
    });
  }
  return faces;
}

/* A ring of 3D points around a centre, in the plane normal to an axis. */
export const ring = (center, axis, r, segments = 36, phase = 0) =>
  circle(0, 0, r, segments, true, phase).map(([u, v]) =>
    add(center, FRAME[axis](u, v, 0)),
  );

/* ---------- Shading ---------- */

export const PALETTES = {
  emerald: ["#03100a", "#0b3320", "#1a6a3f", "#2fa862", "#86e8ad", "#d2fde2"],
  mint: ["#0a2c19", "#1b7344", "#47c983", "#98f0bc", "#e6fff1"],
  steel: ["#070c0a", "#1a2420", "#394842", "#7a8c83", "#c7d5ce", "#f1f7f3"],
  paper: ["#8ea898", "#b7cfbf", "#d8e8dd", "#f0f7f2", "#ffffff"],
  paperGreen: ["#0f4a2a", "#1f7d48", "#3db06c", "#86dca7", "#d4f7e1"],
  ink: ["#030c07", "#0a1e14", "#143524", "#22523a", "#3f7a5c"],
};

const rgbCache = new Map();
function rgb(hex) {
  if (!rgbCache.has(hex)) {
    const n = parseInt(hex.slice(1), 16);
    rgbCache.set(hex, [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  return rgbCache.get(hex);
}

export function tint(tone, t) {
  const stops = PALETTES[tone] ?? PALETTES.emerald;
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const a = rgb(stops[i]);
  const b = rgb(stops[i + 1]);
  const f = x - i;
  const mix = a.map((c, k) => Math.round(c + (b[k] - c) * f));
  return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`;
}

export function lightness(n) {
  const wrap = Math.max(0, (dot(n, LIGHT) + 0.45) / 1.45);
  return 0.08 + 0.92 * wrap;
}

export const shade = (tone, n, bias = 0) => tint(tone, lightness(n) + bias);

/* ---------- Visibility, ordering and edges ---------- */

export const isVisible = (face) => dot(face.n, VIEW) > 1e-6;

const depthOf = (face) =>
  face.pts.reduce((sum, p) => sum + p[0] + p[1] + p[2], 0) / face.pts.length;

/* Painter's order: side walls back to front, then end caps on top. */
export function paintOrder(a, b) {
  if (Boolean(a.cap) !== Boolean(b.cap)) return a.cap ? 1 : -1;
  return depthOf(a) - depthOf(b);
}

const keyOf = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)},${p[2].toFixed(2)}`;

/*
 * Feature edges: silhouettes (visible next to hidden), creases between
 * visible faces, and — separately — fully hidden edges for dashed x-ray lines.
 * Seams between two smooth facets (cylinders, fillets) are skipped.
 */
export function classifyEdges(faces) {
  const edges = new Map();
  faces.forEach((face, index) => {
    face.pts.forEach((a, i) => {
      const b = face.pts[(i + 1) % face.pts.length];
      const ka = keyOf(a);
      const kb = keyOf(b);
      if (ka === kb) return;
      const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      if (!edges.has(key)) edges.set(key, { a, b, faces: [] });
      edges.get(key).faces.push(index);
    });
  });

  const shown = [];
  const hidden = [];
  for (const edge of edges.values()) {
    const owners = edge.faces.map((i) => faces[i]);
    const visible = owners.filter(isVisible);
    if (!visible.length) {
      hidden.push(edge);
    } else if (visible.length === owners.length && owners.length > 1) {
      const [f, g] = owners;
      const seam = f.smooth && g.smooth;
      const flat = dot(f.n, g.n) > 0.9999;
      if (!seam && !flat) shown.push(edge);
    } else {
      shown.push(edge);
    }
  }
  return { shown, hidden };
}

/* ---------- SVG path helpers ---------- */

export const fmt = (n) => Math.round(n * 100) / 100;
export const pt = ([x, y]) => `${fmt(x)} ${fmt(y)}`;

export const polygon = (pts) => `M${pts.map(pt).join("L")}Z`;
export const polyline = (pts) => `M${pts.map(pt).join("L")}`;

export const segments = (edges, P) =>
  edges.map(({ a, b }) => `M${pt(P(a))}L${pt(P(b))}`).join("");

/* SVG transform that lays text flat on a world plane (x, y or z = const). */
export function planeMatrix(plane, P, at, size = 1) {
  const [tx, ty] = P(at);
  const k = P.k * size;
  const basis = {
    z: [COS30, 0.5, -COS30, 0.5],
    y: [COS30, 0.5, 0, 1],
    x: [COS30, -0.5, 0, 1],
  }[plane];
  return `matrix(${basis.map((v) => fmt(v * k)).join(" ")} ${fmt(tx)} ${fmt(ty)})`;
}

export function arrowHead([tx, ty], [fx, fy], size = 7, half = 2.6) {
  const length = Math.hypot(tx - fx, ty - fy) || 1;
  const ux = (tx - fx) / length;
  const uy = (ty - fy) / length;
  const bx = tx - ux * size;
  const by = ty - uy * size;
  return `M${pt([tx, ty])}L${pt([bx - uy * half, by + ux * half])}L${pt([
    bx + uy * half,
    by - ux * half,
  ])}Z`;
}
