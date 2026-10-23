/* The static render shown while the 3D viewer loads, and whenever it can't run. */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export function Poster({ src, alt, hidden = false }) {
  return (
    <img
      className="cad-model-poster"
      src={asset(src)}
      alt={hidden ? "" : alt}
      aria-hidden={hidden || undefined}
      data-hidden={hidden || undefined}
      decoding="async"
    />
  );
}

/* Same footprint as the live viewer, so swapping in WebGL never shifts the layout. */
export default function ViewerPoster({ poster, posterAlt, caption, className = "" }) {
  return (
    <figure className={`cad-viewer ${className}`.trim()}>
      <div className="cad-viewer-stage">
        <Poster src={poster} alt={posterAlt} />
      </div>
      {caption && <figcaption className="cad-viewer-help">{caption}</figcaption>}
    </figure>
  );
}
