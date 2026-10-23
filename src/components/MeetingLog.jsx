import { useEffect, useRef, useState } from "react";
import { meetings } from "../data/meetings";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { IconFrame } from "./IconFrame";
import { ArrowLeft, ArrowRight, ArrowUpRight, Close, Discord, Log } from "./Icons";

const PREVIEW_COUNT = 3;
const THUMBS = 4;

/* Paths in meetings.js are relative to public/, so they also work under a subfolder base. */
const asset = (src) =>
  /^(https?:|data:|blob:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\/+/, "")}`;

function describeDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  if (!match) return null;
  const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return {
    iso: date,
    month: day.toLocaleString("en-US", { month: "short" }),
    day: day.getDate(),
    year: day.getFullYear(),
  };
}

function PhotoViewer({ meeting, index, onClose, onStep }) {
  const ref = useRef(null);
  const photo = meeting?.photos[index];
  const total = meeting?.photos.length ?? 0;

  useEffect(() => {
    const dialog = ref.current;
    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo]);

  return (
    <dialog
      ref={ref}
      className="photo-viewer"
      aria-label={meeting ? `Photos from ${meeting.title}` : "Meeting photos"}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onStep(1);
        if (event.key === "ArrowLeft") onStep(-1);
      }}
      // A click that lands on the dialog element itself is a click on the backdrop.
      onClick={(event) => event.target === ref.current && ref.current.close()}
    >
      {photo && (
        <div className="photo-viewer-inner">
          <button type="button" className="icon-button dialog-close" onClick={() => ref.current.close()}>
            <Close />
            <span className="sr-only">Close photos</span>
          </button>
          <img src={asset(photo.src)} alt={photo.alt ?? ""} />
          <div className="photo-viewer-bar">
            <p>
              <strong>{meeting.title}</strong>
              {photo.alt && <span>{photo.alt}</span>}
            </p>
            {total > 1 && (
              <div className="dialog-pager">
                <button type="button" className="icon-button" onClick={() => onStep(-1)}>
                  <ArrowLeft />
                  <span className="sr-only">Previous photo</span>
                </button>
                <span aria-live="polite">
                  {index + 1} / {total}
                </span>
                <button type="button" className="icon-button" onClick={() => onStep(1)}>
                  <ArrowRight />
                  <span className="sr-only">Next photo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function MeetingEntry({ meeting, id, onOpenPhoto }) {
  const date = describeDate(meeting.date);
  const photos = meeting.photos ?? [];
  const links = meeting.links ?? [];
  const extra = photos.length - THUMBS;

  return (
    <li className="log-entry">
      <time className="log-date" dateTime={date?.iso}>
        {date ? (
          <>
            <span className="log-month">{date.month}</span>
            <span className="log-day">{date.day}</span>
            <span className="log-year">{date.year}</span>
          </>
        ) : (
          meeting.date
        )}
      </time>

      <article className="log-body" aria-labelledby={id}>
        {(meeting.type || photos.length > 0) && (
          <p className="log-meta">
            {meeting.type && <span>{meeting.type}</span>}
            {photos.length > 0 && (
              <span>
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </span>
            )}
          </p>
        )}
        <h3 id={id}>{meeting.title}</h3>
        {meeting.summary && <p className="log-summary">{meeting.summary}</p>}

        {photos.length > 0 && (
          <ul className="log-photos" role="list">
            {photos.slice(0, THUMBS).map((photo, i) => (
              <li key={photo.src}>
                <button
                  type="button"
                  className="log-photo"
                  aria-haspopup="dialog"
                  aria-label={`View photo ${i + 1} of ${photos.length}${photo.alt ? `: ${photo.alt}` : ""}`}
                  onClick={() => onOpenPhoto(i)}
                >
                  <img src={asset(photo.src)} alt="" loading="lazy" decoding="async" />
                  {i === THUMBS - 1 && extra > 0 && (
                    <span className="log-photo-more" aria-hidden="true">
                      +{extra}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {links.length > 0 && (
          <ul className="log-links" role="list">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} {...external}>
                  {link.label}
                  <ArrowUpRight />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  );
}

export default function MeetingLog() {
  const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState(null); // { meeting, photo } as indexes into `sorted`
  const sorted = [...meetings].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const shown = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const openMeeting = viewer ? sorted[viewer.meeting] : null;

  const step = (direction) =>
    setViewer((current) => {
      if (!current) return current;
      const total = sorted[current.meeting].photos.length;
      return { ...current, photo: (current.photo + direction + total) % total };
    });

  return (
    <section className="page-section meetings-section" id="meetings" aria-labelledby="meetings-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Meeting log</p>
            <h2 id="meetings-title" className="section-title">
              Meeting recaps.
            </h2>
          </div>
          <p className="body-copy">
            Recaps and photos from club meetings. Upcoming meeting times and rooms are
            posted on the Discord.
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="log-empty">
            <IconFrame>
              <Log />
            </IconFrame>
            <div className="log-empty-text">
              <h3>No meetings logged yet</h3>
              <p>Recaps with photos will show up here after each meeting.</p>
            </div>
            <a href={CLUB_LINKS.discord} className="button button-secondary" {...external}>
              <Discord />
              Meeting updates on Discord
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        ) : (
          <>
            <ol className="log-list" role="list">
              {shown.map((meeting, i) => (
                <MeetingEntry
                  key={`${meeting.date}-${meeting.title}`}
                  id={`meeting-${i}`}
                  meeting={meeting}
                  onOpenPhoto={(photo) => setViewer({ meeting: i, photo })}
                />
              ))}
            </ol>
            {sorted.length > PREVIEW_COUNT && (
              <button
                type="button"
                className="button button-secondary log-more"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Show fewer meetings" : `Show all ${sorted.length} meetings`}
              </button>
            )}
          </>
        )}
      </div>

      <PhotoViewer
        meeting={openMeeting}
        index={viewer?.photo ?? 0}
        onClose={() => setViewer(null)}
        onStep={step}
      />
    </section>
  );
}
