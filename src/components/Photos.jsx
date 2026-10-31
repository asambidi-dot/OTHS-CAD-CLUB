import { useRef } from "react";
import { featuredPhotos, meetingPhotos } from "../data/club";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Close, Grid } from "./Icons";
import Carousel from "./reactbits/Carousel";

const folder = `${import.meta.env.BASE_URL}photos/`;
const byName = Object.fromEntries(meetingPhotos.map((photo) => [photo.name, photo]));

/* Both saved widths of a photo; the larger file is the full photo when it is under 1280px wide. */
function photoSources({ name, width }) {
  return {
    src: `${folder}${name}-640.webp`,
    srcSet: `${folder}${name}-640.webp 640w, ${folder}${name}-1280.webp ${Math.min(1280, width)}w`,
  };
}

/* The carousel's dark theme has a purple tint; match the site's neutral surfaces instead. */
const carouselColors = {
  "--carousel-frame": "rgb(255 255 255 / 3.5%)",
  "--carousel-tile": "linear-gradient(180deg, #2a2b2e 0%, #1c1d20 100%)",
};

export default function Photos() {
  const galleryRef = useRef(null);
  const wide = useMediaQuery("(min-width: 720px)");

  const openGallery = () => galleryRef.current?.showModal();
  const closeGallery = () => galleryRef.current?.close();

  const slides = featuredPhotos.map(({ name, caption, position }) => (
    <figure key={name} className="photo-slide">
      <img
        {...photoSources(byName[name])}
        sizes="(min-width: 1048px) 680px, (min-width: 720px) calc(100vw - 368px), calc(100vw - 108px)"
        alt={byName[name].alt}
        style={position ? { objectPosition: position } : undefined}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <figcaption>{caption}</figcaption>
    </figure>
  ));

  return (
    <section className="section" id="photos" aria-labelledby="photos-title">
      <div className="shell">
        <header className="section-head">
          <h2 id="photos-title" className="section-title">
            Meeting photos
          </h2>
          <p className="section-lede">
            Photos from our meetings: a paper airplane challenge, an Onshape lesson and a cube
            puzzle.
          </p>
        </header>

        {/* Clicking the photo in the middle opens the full set; the side photos slide into place. */}
        <div
          className="photos-carousel"
          onClick={(event) => {
            if (event.target.closest(".carousel-slide")?.hasAttribute("data-current")) openGallery();
          }}
        >
          <Carousel
            items={slides}
            baseWidth={1000}
            aspectRatio={wide ? 1.5 : 1.25}
            peek={wide ? 150 : 28}
            radius={18}
            effect="slide"
            indicator="dots"
            arrows
            loop
            style={carouselColors}
          />
        </div>

        <div className="photos-actions">
          <button type="button" className="button button-secondary" onClick={openGallery}>
            <Grid />
            See all {meetingPhotos.length} photos
          </button>
        </div>
      </div>

      <dialog
        ref={galleryRef}
        className="gallery"
        aria-labelledby="gallery-title"
        onClick={(event) => {
          // A click on the dimmed backdrop lands on the dialog itself.
          if (event.target === event.currentTarget) closeGallery();
        }}
      >
        <header className="gallery-head">
          <h2 id="gallery-title">Meeting photos</h2>
          <p>{meetingPhotos.length} photos</p>
          <button type="button" className="gallery-close" onClick={closeGallery} aria-label="Close photos">
            <Close />
          </button>
        </header>

        <ul className="gallery-grid" role="list">
          {meetingPhotos.map((photo) => (
            <li key={photo.name}>
              <img
                {...photoSources(photo)}
                sizes="(min-width: 1000px) 360px, (min-width: 600px) 45vw, 92vw"
                width={photo.width}
                height={photo.height}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </dialog>
    </section>
  );
}
