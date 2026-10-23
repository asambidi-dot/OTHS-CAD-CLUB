import { useId, useLayoutEffect, useRef } from "react";
import {
  AXIS,
  add,
  arrowHead,
  classifyEdges,
  isVisible,
  lightness,
  mul,
  paintOrder,
  polygon,
  polyline,
  pt,
  ring,
  segments,
  shade,
  tint,
} from "../../lib/iso";

/* React ids contain characters that are awkward inside url(#…). */
export function useSafeId(prefix = "c") {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

/*
 * An <svg> whose viewBox hugs what is actually drawn. Isometric parts leave
 * uneven empty space inside a fixed viewBox, so a centred <svg> can still look
 * off-centre. Before paint, this measures the union of every untransformed
 * [data-fit] group (all children when there are none), pads it evenly and sets
 * the viewBox, so preserveAspectRatio centres the visible drawing itself.
 * It re-measures when the box resizes, since CSS can hide labels at small sizes.
 */
export function ArtSvg({ width, height, pad = 0.06, className = "", children, ...rest }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const svg = ref.current;
    const measure = () => {
      const groups = svg.querySelectorAll(":scope > [data-fit]");
      const targets = groups.length ? groups : svg.children;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const node of targets) {
        if (typeof node.getBBox !== "function") continue;
        const box = node.getBBox();
        if (!box.width && !box.height) continue;
        x0 = Math.min(x0, box.x);
        y0 = Math.min(y0, box.y);
        x1 = Math.max(x1, box.x + box.width);
        y1 = Math.max(y1, box.y + box.height);
      }
      if (!Number.isFinite(x0)) return;
      const p = Math.max(x1 - x0, y1 - y0) * pad;
      const viewBox = [x0 - p, y0 - p, x1 - x0 + p * 2, y1 - y0 + p * 2]
        .map((v) => Math.round(v * 10) / 10)
        .join(" ");
      if (svg.getAttribute("viewBox") !== viewBox) svg.setAttribute("viewBox", viewBox);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [pad]);

  return (
    <svg
      ref={ref}
      className={`cad-art ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      {...rest}
    >
      {children}
    </svg>
  );
}

/*
 * Renders one part: visible faces in painter's order, lit by a single key
 * light, then crisp feature edges on top. `sheen` adds a soft gradient to
 * each flat face; `xray` draws hidden edges as faint dashed lines.
 */
export function Solid({ part, P, tone = "emerald", sheen = false, xray = false, className }) {
  const uid = useSafeId("s");
  const faces = part.filter(isVisible).sort(paintOrder);
  const { shown, hidden } = classifyEdges(part);

  return (
    <g className={className}>
      {sheen && (
        <defs>
          {faces.map((face, i) =>
            face.smooth ? null : (
              <linearGradient key={i} id={`${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor={shade(face.tone ?? tone, face.n, 0.07)} />
                <stop offset="1" stopColor={shade(face.tone ?? tone, face.n, -0.07)} />
              </linearGradient>
            ),
          )}
        </defs>
      )}

      {faces.map((face, i) => {
        const fill = shade(face.tone ?? tone, face.n);
        return (
          <path
            key={i}
            d={polygon(face.pts.map(P))}
            fill={sheen && !face.smooth ? `url(#${uid}-${i})` : fill}
            stroke={face.smooth ? fill : "none"}
            strokeWidth={face.smooth ? 0.8 : undefined}
            strokeLinejoin="round"
          />
        );
      })}

      {xray && hidden.length > 0 && <path className="cad-hidden" d={segments(hidden, P)} />}
      <path className="cad-edges" d={segments(shown, P)} />
    </g>
  );
}

/* Every edge of a part as a dashed outline — a feature not built yet. */
export function Ghost({ part, P }) {
  const { shown, hidden } = classifyEdges(part);
  return <path className="cad-ghost" d={segments([...shown, ...hidden], P)} />;
}

/* A drilled hole on a visible face: wall shading plus the far opening. */
export function Hole({ P, at, axis, r, depth, tone = "emerald", sides = 40, phase = 0 }) {
  const uid = useSafeId("h");
  const rim = polygon(ring(at, axis, r, sides, phase).map(P));
  const far = polygon(ring(add(at, mul(AXIS[axis], -depth)), axis, r, sides, phase).map(P));
  const wall = tint(tone, lightness(AXIS[axis]) * 0.45);

  return (
    <g>
      <clipPath id={uid}>
        <path d={rim} />
      </clipPath>
      <path d={rim} fill={wall} />
      <path d={far} className="cad-void" clipPath={`url(#${uid})`} />
      <path d={rim} className="cad-edges" />
    </g>
  );
}

/* Linear dimension with extension lines, arrowheads and a label. */
export function Dim({ P, from, to, offset, label, dx = 0, dy = 0, anchor = "middle" }) {
  const a = P(add(from, offset));
  const b = P(add(to, offset));
  const extension = (p) =>
    `M${pt(P(add(p, mul(offset, 0.18))))}L${pt(P(add(p, mul(offset, 1.16))))}`;

  return (
    <g className="cad-dim">
      <path d={`${extension(from)}${extension(to)}M${pt(a)}L${pt(b)}`} />
      <path className="cad-arrow" d={arrowHead(a, b) + arrowHead(b, a)} />
      <text x={(a[0] + b[0]) / 2 + dx} y={(a[1] + b[1]) / 2 + dy} textAnchor={anchor}>
        {label}
      </text>
    </g>
  );
}

/* Leader with a short shoulder and a part label. */
export function Callout({ P, at, dx, dy, label, side = 1, shoulder = 14 }) {
  const [x, y] = P(at);
  const ex = x + dx;
  const ey = y + dy;
  const sx = ex + shoulder * side;

  return (
    <g className="cad-callout">
      <path d={`M${pt([x, y])}L${pt([ex, ey])}L${pt([sx, ey])}`} />
      <circle className="cad-dot" cx={x} cy={y} r="2" />
      <text x={sx + 5 * side} y={ey} dy=".35em" textAnchor={side > 0 ? "start" : "end"}>
        {label}
      </text>
    </g>
  );
}
