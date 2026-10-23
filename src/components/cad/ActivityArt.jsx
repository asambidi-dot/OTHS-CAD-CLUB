import { memo } from "react";
import {
  arc,
  arrowHead,
  box,
  cylinder,
  extrude,
  fit,
  loft,
  planeMatrix,
  pointsOf,
  polygon,
  polyline,
  pt,
  ring,
  roundedRect,
} from "../../lib/iso";
import { ArtSvg, Dim, Ghost, Hole, Solid } from "./primitives";

const W = 320;
const H = 200;

/* Card art is framed by what it draws, so each piece sits optically centred. */
function Frame({ children }) {
  return (
    <ArtSvg className="cad-paper" width={W} height={H} pad={0.05} aria-hidden="true">
      <g data-fit>{children}</g>
    </ArtSvg>
  );
}

/* 01 — Beginner lessons: a constrained sketch, then the same sketch extruded. */
const sketch = roundedRect(0, 0, 44, 30, 7, 5);
const SHIFT = 64; // moving along (+x, −y) slides a part straight to the right on screen
const block = extrude(
  sketch.map(([u, v, s]) => [u + SHIFT, v - SHIFT, s]),
  "z",
  0,
  12,
);
const sketchPlane = [
  [-9, -9, 0],
  [53, -9, 0],
  [53, 39, 0],
  [-9, 39, 0],
];
const P1 = fit(pointsOf(block, sketchPlane), W, H, 30);

function LessonsArt() {
  const from = P1([50, 6, 10]);
  const to = P1([SHIFT - 4, -SHIFT + 6, 22]);
  const control = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 34];
  const knots = sketch.filter((_, i) => i % 6 === 0 || i % 6 === 5);

  return (
    <Frame>
      <path className="cad-plane-paper" d={polygon(sketchPlane.map(P1))} />
      <path className="cad-sketch" d={polygon(sketch.map(([u, v]) => P1([u, v, 0])))} />
      <path className="cad-sketch" d={polygon(ring([22, 15, 0], "z", 5).map(P1))} />
      {knots.map(([u, v], i) => {
        const [x, y] = P1([u, v, 0]);
        return <rect key={i} className="cad-knot" x={x - 2} y={y - 2} width="4" height="4" />;
      })}
      <Dim P={P1} from={[0, 30, 0]} to={[44, 30, 0]} offset={[0, 10, 0]} label="44" dx={-10} dy={12} />

      <path className="cad-flow" d={`M${pt(from)}Q${pt(control)} ${pt(to)}`} />
      <path className="cad-arrow-paper" d={arrowHead(to, control, 8, 3.2)} />

      <Solid part={block} P={P1} tone="paper" />
      <Hole P={P1} at={[SHIFT + 22, -SHIFT + 15, 12]} axis="z" r={5} depth={12} tone="paper" />
    </Frame>
  );
}

/* 02 — CAD-offs: a race against the clock to finish the part. */
const timer = cylinder("z", 0, 0, 30, 0, 8, undefined, 48);
const knob = cylinder("z", 0, 0, 3.2, 8, 10.5, undefined, 20);
const slab = box([46, -64, 0], [84, -36, 9]);
const wallGhost = box([46, -64, 9], [56, -36, 34]);
const P2 = fit(pointsOf(timer, slab, wallGhost), W, H, 30);

function CadOffArt() {
  const progress = arc(0, 0, 24.5, -135, 120, 36).map(([u, v]) => P2([u, v, 8]));
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const inner = P2([27 * Math.cos(a), 27 * Math.sin(a), 8]);
    const outer = P2([29 * Math.cos(a), 29 * Math.sin(a), 8]);
    return `M${pt(inner)}L${pt(outer)}`;
  }).join("");
  const hand = (120 * Math.PI) / 180;
  const [cx, cy] = P2([56, -50, 34]);

  return (
    <Frame>
      <Solid part={timer} P={P2} tone="paper" />
      <path className="cad-tick" d={ticks} />
      <path className="cad-progress" d={polyline(progress)} />
      <path
        className="cad-hand"
        d={`M${pt(P2([0, 0, 8]))}L${pt(P2([19 * Math.cos(hand), 19 * Math.sin(hand), 8]))}`}
      />
      <Solid part={knob} P={P2} tone="paperGreen" />

      <Solid part={slab} P={P2} tone="paper" />
      <Hole P={P2} at={[72, -50, 9]} axis="z" r={4.5} depth={9} tone="paper" />
      <Ghost part={wallGhost} P={P2} />
      <path
        className="cad-cursor"
        d={`M${pt([cx + 8, cy - 4])}l0 15 4-4 3 7 3-1.4-3-6.6 5.6 0z`}
      />
    </Frame>
  );
}

/* 03 — Real-world challenges: a phone stand designed around a 65° viewing angle. */
const standProfile = [
  [0, 0],
  [50, 0],
  [50, 5],
  [46, 5],
  [46, 13],
  [40, 13],
  [40, 5],
  [32, 5],
  [10, 52.1],
  [4.6, 49.6],
  [25.3, 5],
  [0, 5],
];
const stand = extrude(standProfile, "y", 0, 50);
const phone = extrude(
  [
    [33, 5],
    [37.5, 7.1],
    [10.5, 65.1],
    [6, 63],
  ],
  "y",
  9,
  41,
).map((face) => (face.n[0] > 0.8 ? { ...face, tone: "ink" } : face));
const P3 = fit(pointsOf(stand, phone), W, H, 30);

function RealWorldArt() {
  const angle = arc(25.3, 5, 15, 180, 115, 16).map(([x, z]) => P3([x, 51, z]));
  const [lx, ly] = P3([25.3 + 22 * Math.cos(2.6), 51, 5 + 22 * Math.sin(2.6)]);

  return (
    <Frame>
      <Solid part={stand} P={P3} tone="paper" />
      <Solid part={phone} P={P3} tone="paper" />
      <path className="cad-sketch" d={polyline(angle)} />
      <text className="cad-label" x={lx - 6} y={ly + 4} textAnchor="end">
        65°
      </text>
      <Dim P={P3} from={[50, 0, 0]} to={[50, 50, 0]} offset={[12, 0, 0]} label="50" dx={14} dy={10} />
    </Frame>
  );
}

/* 04 — Future tournaments: a podium and a trophy. */
const podium = [
  { n: "2", part: box([0, 0, 0], [30, 30, 24]), x: 15, z: 24 },
  { n: "1", part: box([30, 0, 0], [60, 30, 36]), x: 45, z: 36 },
  { n: "3", part: box([60, 0, 0], [90, 30, 16]), x: 75, z: 16 },
];
const trophyBase = box([38, 8, 36], [52, 22, 41]);
const stem = cylinder("z", 45, 15, 2.2, 41, 48, undefined, 18);
const cup = loft(
  [ring([45, 15, 48], "z", 3, 28), ring([45, 15, 53], "z", 8.5, 28), ring([45, 15, 63], "z", 10.5, 28)],
  {},
  true,
);
const P4 = fit(pointsOf(...podium.map((p) => p.part), cup), W, H, 30);

function TournamentArt() {
  const handle = (side) =>
    polyline(arc(0, 0, 4.6, -80, 80, 12).map(([a, b]) => P4([45 + side * (9.6 + a), 15, 57 + b])));
  const sparkle = ([x, y], s) =>
    `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;
  const top = P4([45, 15, 70]);

  return (
    <Frame>
      {podium.map(({ n, part, x, z }) => (
        <g key={n}>
          <Solid part={part} P={P4} tone="paper" />
          <text className="podium-number" transform={planeMatrix("y", P4, [x, 30, z / 2 + 4])} textAnchor="middle" fontSize="11">
            {n}
          </text>
        </g>
      ))}
      <path className="cad-handle" d={handle(-1)} />
      <Solid part={trophyBase} P={P4} tone="paperGreen" />
      <Solid part={stem} P={P4} tone="paperGreen" />
      <Solid part={cup} P={P4} tone="paperGreen" />
      <Hole P={P4} at={[45, 15, 63]} axis="z" r={9.4} depth={9} tone="paperGreen" />
      <path className="cad-handle" d={handle(1)} />
      <path className="cad-sparkle" d={sparkle([top[0] + 30, top[1] - 4], 6) + sparkle([top[0] - 28, top[1] + 10], 4) + sparkle([top[0] + 12, top[1] - 22], 3)} />
    </Frame>
  );
}

export const activityArt = {
  lessons: memo(LessonsArt),
  cadoffs: memo(CadOffArt),
  realworld: memo(RealWorldArt),
  tournaments: memo(TournamentArt),
};
