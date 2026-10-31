import { useMediaQuery } from "../hooks/useMediaQuery";
import DitherVeil from "./reactbits/DitherVeil";

const folder = `${import.meta.env.BASE_URL}shapes/`;

/*
 * Geometric solids floating around the hero. Each is a DitherVeil from React Bits: a
 * mint-white dither of a rendered shape, with the full-colour render showing under the
 * pointer. Black is the dither's ink and the shapes are screen-blended, so the black drops
 * out and the stars show through. Tablets get the shapes marked `tablet`. Phones get those
 * marked `phone`, plus the bottom one on phones tall enough for it to clear the text.
 */
const shapes = [
  { name: "torus", tablet: true, phone: true },
  { name: "cube" },
  { name: "cone", tablet: true },
  { name: "puck", tablet: true, phone: true },
  { name: "gem" },
  { name: "pyramid", tablet: true, phone: "tall" },
];

export default function HeroShapes() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const tablet = useMediaQuery("(min-width: 720px)");
  const tallPhone = useMediaQuery("(min-height: 760px)");
  const shown = shapes.filter((shape) => {
    if (desktop) return true;
    if (tablet) return shape.tablet;
    return shape.phone === true || (shape.phone === "tall" && tallPhone);
  });

  return (
    <div className="hero-shapes" aria-hidden="true">
      {shown.map(({ name }) => (
        <div key={name} className={`hero-shape hero-shape-${name}`}>
          <DitherVeil
            src={`${folder}${name}.webp`}
            pattern="floyd"
            pixelSize={2}
            inkColor="#000000"
            paperColor="#d9f7e6"
            brightness={0.05}
            revealRadius={90}
            rimColor="#a3ebc0"
            clickBurst={false}
          />
        </div>
      ))}
    </div>
  );
}
