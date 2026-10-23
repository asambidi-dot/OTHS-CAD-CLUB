/*
 * Icons on a 24-unit grid. Each glyph's ink is centred on (12, 12) so it
 * sits in the middle of any square frame without per-icon nudging.
 * All are decorative; the controls that use them carry their own text.
 */
const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

const solid = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
};

export const ArrowRight = (props) => (
  <svg {...stroke} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = (props) => (
  <svg {...stroke} {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ArrowUpRight = (props) => (
  <svg {...stroke} {...props}>
    <path d="M7 17 17 7M8.5 7H17v8.5" />
  </svg>
);

export const ArrowUp = (props) => (
  <svg {...stroke} {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const Close = (props) => (
  <svg {...stroke} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/* Onshape runs in a browser: a window with a small cube inside. */
export const Browser = (props) => (
  <svg {...stroke} {...props}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M3 8.5h18" />
    <path d="M12 10.6l3 1.7v3.4L12 17.4l-3-1.7v-3.4ZM9 12.3l3 1.7 3-1.7M12 14v3.4" />
  </svg>
);

/* Help from other members: a life ring. */
export const Help = (props) => (
  <svg {...stroke} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.6" />
    <path d="M6 6l3.4 3.4M18 6l-3.4 3.4M6 18l3.4-3.4M18 18l-3.4-3.4" />
  </svg>
);

/* Share designs: three linked nodes. */
export const Share = (props) => (
  <svg {...stroke} {...props}>
    <circle cx="17" cy="6" r="2.5" />
    <circle cx="7" cy="12" r="2.5" />
    <circle cx="17" cy="18" r="2.5" />
    <path d="M9.2 10.8l5.6-3.6M9.2 13.2l5.6 3.6" />
  </svg>
);

/* A drafting pencil, for "start sketching". */
export const Pencil = (props) => (
  <svg {...stroke} {...props}>
    <path d="M5 19l1-4.2L15.6 5.2a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L9.2 18Z" />
    <path d="M13.8 7l3.2 3.2" />
  </svg>
);

/* A notebook page, for the meeting log. */
export const Log = (props) => (
  <svg {...stroke} {...props}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
  </svg>
);

export const Photo = (props) => (
  <svg {...stroke} {...props}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M20.5 15.5 15.5 11 7 19" />
  </svg>
);

/* Brand marks — Discord logomark and Instagram glyph. */
export const Discord = (props) => (
  <svg {...solid} {...props}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

export const Instagram = (props) => (
  <svg {...stroke} strokeWidth="2" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5.2" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

/* ---------- 3D viewer controls ---------- */

export const RotateLeft = (props) => (
  <svg {...stroke} {...props}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4.5v4.2h4.2" />
  </svg>
);

export const RotateRight = (props) => (
  <svg {...stroke} {...props}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4.2h-4.2" />
  </svg>
);

export const ZoomIn = (props) => (
  <svg {...stroke} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.4-4.4M11 8v6M8 11h6" />
  </svg>
);

export const ZoomOut = (props) => (
  <svg {...stroke} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.4-4.4M8 11h6" />
  </svg>
);

export const Play = (props) => (
  <svg {...stroke} {...props}>
    <path d="M8.5 6.2v11.6L17.8 12Z" />
  </svg>
);

export const Pause = (props) => (
  <svg {...stroke} {...props}>
    <path d="M9 6.5v11M15 6.5v11" strokeWidth="2.4" />
  </svg>
);

/* Advance one step, for the mechanism when motion is reduced. */
export const Step = (props) => (
  <svg {...stroke} {...props}>
    <path d="M6.5 6.5v11L14.5 12Z" />
    <path d="M17.5 6.5v11" />
  </svg>
);

/* Parts pushed out from a centre, for the exploded view. */
export const Explode = (props) => (
  <svg {...stroke} {...props}>
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3M4 4h3M4 4v3M20 4h-3M20 4v3M4 20h3M4 20v-3M20 20h-3M20 20v-3" />
  </svg>
);

export const Wireframe = (props) => (
  <svg {...stroke} {...props}>
    <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9M8 5.25l8 4.5M16 5.25l-8 4.5" strokeWidth="1.2" />
  </svg>
);

export const Reset = (props) => (
  <svg {...stroke} {...props}>
    <path d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const Hand = (props) => (
  <svg {...stroke} {...props}>
    <path d="M8.5 12V6.5a1.5 1.5 0 0 1 3 0V11M11.5 10.5V5a1.5 1.5 0 0 1 3 0v5.5M14.5 10.5V7a1.5 1.5 0 0 1 3 0v6.5c0 3.6-2.4 6.5-6 6.5-2.4 0-3.9-1.1-5.1-3.1L4.6 14a1.4 1.4 0 0 1 2.3-1.6l1.6 2.1" />
  </svg>
);
