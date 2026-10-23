import { memo } from "react";
import {
  classifyEdges,
  extrude,
  fit,
  planeMatrix,
  polygon,
  pt,
  rect,
  ring,
  roundedRect,
} from "../../lib/iso";
import { ArtSvg, Callout, Dim, Hole, Solid } from "./primitives";

/* One keychain tag, four stages: idea → sketch → model → refined part. */
const W = 480;
const H = 300;
const HOLE = [16, 18];
const plane = [
  [-14, -14, 0],
  [76, -14, 0],
  [76, 50, 0],
  [-14, 50, 0],
];
const roughPlate = extrude(rect(0, 0, 60, 36), "z", 0, 8);
const finalPlate = extrude(roundedRect(0, 0, 60, 36, 9, 6), "z", 0, 8);
const P = fit([...plane, [0, 0, 8], [60, 0, 8]], W, H, 44);

/* Deterministic pencil wobble so the "idea" looks hand drawn. */
function pencil(a, b, seed) {
  const [ax, ay] = P(a);
  const [bx, by] = P(b);
  const length = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / length;
  const ny = (bx - ax) / length;
  const steps = Math.max(3, Math.round(length / 14));
  let d = `M${pt([ax - nx, ay - ny])}`;
  for (let i = 1; i <= steps; i += 1) {
    const f = i / steps;
    const j = Math.sin(seed * 12.9 + i * 2.3) * 1.6;
    d += `L${pt([ax + (bx - ax) * f + nx * j, ay + (by - ay) * f + ny * j])}`;
  }
  // overshoot a little past the corner, like a quick sketch stroke
  return `${d}l${((bx - ax) / length) * 5} ${((by - ay) / length) * 5}`;
}

function Imagine() {
  const { shown } = classifyEdges(roughPlate);
  const scribble = ring([HOLE[0], HOLE[1], 8], "z", 6.5, 20).map(P);
  const [nx, ny] = P([60, 0, 8]);
  const [hx, hy] = P([HOLE[0], HOLE[1], 8]);
  const [bx, by] = P([60, 36, 0]);

  return (
    <>
      <path className="cad-pencil" d={shown.map(({ a, b }, i) => pencil(a, b, i + 1)).join("")} />
      <path className="cad-pencil" d={`M${scribble.map((p, i) => pt([p[0] + Math.sin(i) * 1.2, p[1]])).join("L")}`} />
      <text className="cad-note" x={nx + 18} y={ny - 6}>≈ 6 cm long?</text>
      <path className="cad-pencil thin" d={`M${pt([hx - 18, hy - 58])}q-16 24 8 46`} />
      <text className="cad-note" x={hx - 70} y={hy - 66}>hole for a key ring</text>
      <text className="cad-note" x={bx} y={by + 34} textAnchor="middle">sturdy, not too thick</text>
      <g className="cad-idea" transform={`translate(${nx + 54} ${ny - 64})`}>
        <path d="M0-18a12 12 0 0 1 7 21.8V8h-14V3.8A12 12 0 0 1 0-18ZM-5 12h10M-3.5 16h7" />
        <path d="M-18-26l5 5M18-26l-5 5M0-34v7" />
      </g>
    </>
  );
}

function Sketch() {
  const corners = rect(0, 0, 60, 36).map(([x, y]) => P([x, y, 0]));
  return (
    <>
      <path className="cad-plane" d={polygon(plane.map(P))} />
      <text className="cad-plane-label" transform={planeMatrix("z", P, [-11, -8, 0])} fontSize="4.2">
        Top
      </text>
      <path className="cad-sketch" d={polygon(corners)} />
      <path className="cad-sketch" d={polygon(ring([HOLE[0], HOLE[1], 0], "z", 6).map(P))} />
      {corners.map(([x, y], i) => (
        <rect key={i} className="cad-knot" x={x - 2.5} y={y - 2.5} width="5" height="5" />
      ))}
      <Dim P={P} from={[0, 36, 0]} to={[60, 36, 0]} offset={[0, 11, 0]} label="60" dx={-12} dy={14} />
      <Dim P={P} from={[60, 0, 0]} to={[60, 36, 0]} offset={[11, 0, 0]} label="36" dx={14} dy={12} />
      <Callout P={P} at={[HOLE[0] - 4.2, HOLE[1] - 4.2, 0]} dx={-30} dy={-30} label="Ø12" side={-1} />
    </>
  );
}

function Model() {
  return (
    <>
      <Solid part={roughPlate} P={P} sheen />
      <Hole P={P} at={[HOLE[0], HOLE[1], 8]} axis="z" r={6} depth={8} />
      <Dim P={P} from={[60, 36, 0]} to={[60, 36, 8]} offset={[12, 0, 0]} label="8" dx={12} dy={4} anchor="start" />
    </>
  );
}

function Refine() {
  const top = roundedRect(0, 0, 60, 36, 9, 6).map(([x, y]) => P([x, y, 8]));
  return (
    <>
      <Solid part={finalPlate} P={P} sheen />
      <path className="cad-highlight" d={polygon(top)} />
      <Hole P={P} at={[HOLE[0], HOLE[1], 8]} axis="z" r={6} depth={8} />
      <path className="cad-sketch thin" d={polygon(ring([HOLE[0], HOLE[1], 8], "z", 7.6).map(P))} />
      <text className="cad-engrave" transform={planeMatrix("z", P, [29, 23, 8])} fontSize="8.5">
        OTHS
      </text>
      <Callout P={P} at={[60 - 2.6, 36 - 2.6, 8]} dx={30} dy={34} label="FILLET R9" />
      <Callout P={P} at={[HOLE[0] - 5.4, HOLE[1] - 5.4, 8]} dx={-30} dy={-36} label="CHAMFER 1" side={-1} />
    </>
  );
}

const layers = { imagine: Imagine, sketch: Sketch, model: Model, refine: Refine };

function ProcessArt({ active }) {
  return (
    // Every layer counts toward the frame, so the part stays put between steps.
    <ArtSvg className="cad-dark process-art" width={W} height={H} pad={0.05} aria-hidden="true">
      {Object.entries(layers).map(([id, Layer]) => (
        <g key={id} data-fit className="process-layer" data-active={id === active}>
          <Layer />
        </g>
      ))}
    </ArtSvg>
  );
}

export default memo(ProcessArt);
