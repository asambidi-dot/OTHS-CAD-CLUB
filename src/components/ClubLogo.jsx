/*
 * OTHS CAD Club mark, rebuilt from the flyer logo.
 *
 * The flyer symbol is one closed loop of 18 square bars seen in isometric
 * view. One lobe is three bars — [-2,-1]×[0,5]×[6,7], [-2,5]×[4,5]×[6,7] and
 * [-2,-1]×[0,1]×[0,7] — and the other five lobes are its X/Y/Z axis
 * permutations. These paths are that model's visible faces after exact
 * hidden-surface removal, so every bar is exactly one unit thick. The
 * shadowed faces follow the flyer's shading.
 *
 * A full-silhouette underlay in the deepest tone sits beneath the lit faces so
 * no background shows through the seams at small sizes.
 */
const VIEWBOX = "0 0 31.177 32";
const ASPECT = 31.177 / 32;

const SHAPES = {
  silhouette:
    "M0 11L1.732 10L8.66 14L10.392 13L10.392 11L3.464 7L3.464 5L12.124 0L13.856 1L13.856 9L15.588 10L17.321 9L17.321 1L19.053 0L27.713 5L27.713 7L20.785 11L20.785 13L22.517 14L29.445 10L31.177 11L31.177 21L29.445 22L22.517 18L20.785 19L20.785 21L27.713 25L27.713 27L19.053 32L17.321 31L17.321 23L15.588 22L13.856 23L13.856 31L12.124 32L3.464 27L3.464 25L10.392 21L10.392 19L8.66 18L1.732 22L0 21ZM3.464 15L3.464 17L5.196 16ZM8.66 6L10.392 7L10.392 5ZM8.66 26L10.392 27L10.392 25ZM12.124 16L13.856 17L13.856 19L15.588 18L17.321 19L17.321 17L19.053 16L17.321 15L17.321 13L15.588 14L13.856 13L13.856 15ZM20.785 5L20.785 7L22.517 6ZM20.785 25L20.785 27L22.517 26ZM25.981 16L27.713 17L27.713 15Z",
  right:
    "M3.464 17L5.196 16L6.928 17L3.464 19ZM8.66 14L10.392 13L10.392 11L12.124 12L12.124 14L10.392 15ZM10.392 5L12.124 4L12.124 8L10.392 7ZM12.124 18L13.856 17L13.856 31L12.124 32ZM15.588 12L27.713 5L27.713 7L15.588 14ZM19.053 18L31.177 11L31.177 21L29.445 22L29.445 14L20.785 19L20.785 29L27.713 25L27.713 27L19.053 32Z",
  left:
    "M0 11L12.124 18L12.124 32L3.464 27L3.464 25L10.392 29L10.392 19L1.732 14L1.732 22L0 21ZM3.464 5L15.588 12L15.588 14L3.464 7ZM17.321 1L24.249 5L22.517 6L19.053 4L19.053 8L17.321 9ZM17.321 13L19.053 12L19.053 14L20.785 15L19.053 16L17.321 15ZM17.321 17L19.053 18L19.053 32L17.321 31ZM22.517 18L24.249 17L27.713 19L27.713 15L29.445 14L29.445 22Z",
  top:
    "M0 11L1.732 10L13.856 17L12.124 18ZM3.464 5L12.124 0L13.856 1L6.928 5L15.588 10L24.249 5L17.321 1L19.053 0L27.713 5L15.588 12ZM3.464 25L10.392 21L10.392 23L6.928 25L10.392 27L10.392 29ZM13.856 19L15.588 18L17.321 19L17.321 21L15.588 20L13.856 21ZM17.321 17L29.445 10L31.177 11L19.053 18ZM20.785 21L27.713 25L20.785 29L20.785 27L24.249 25L20.785 23Z",
};

const PALETTES = {
  // The flyer's colours, lifted slightly so the shaded faces still read on the dark site.
  dark: { deep: "#24532f", right: "#2f7040", left: "#3d8a4f", top: "#7fdf96" },
  // The flyer's exact colours, for light backgrounds.
  flyer: { deep: "#1d3d27", right: "#24572f", left: "#30693c", top: "#6fd687" },
};

export default function ClubLogo({ size = 28, variant = "dark", className = "", title }) {
  const tone = PALETTES[variant] ?? PALETTES.dark;
  return (
    <svg
      className={`club-logo ${className}`.trim()}
      width={Math.round(size * ASPECT * 100) / 100}
      height={size}
      viewBox={VIEWBOX}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path fill={tone.deep} d={SHAPES.silhouette} />
      <path fill={tone.right} d={SHAPES.right} />
      <path fill={tone.left} d={SHAPES.left} />
      <path fill={tone.top} d={SHAPES.top} />
    </svg>
  );
}
