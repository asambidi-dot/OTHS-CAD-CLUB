/*
 * Icons on a 24-unit grid. Each glyph's ink is centred on (12, 12) so it
 * sits in the middle of any square frame without per-icon nudging.
 * All are decorative; the controls that use them carry their own text.
 */
const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
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

/* Opens an accordion row; rotates into a cross when open. */
export const Plus = (props) => (
  <svg {...stroke} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Close = (props) => (
  <svg {...stroke} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/* A grid of pictures, for opening the full set of meeting photos. */
export const Grid = (props) => (
  <svg {...stroke} {...props}>
    <rect x="4" y="4" width="7" height="7" rx="1.6" />
    <rect x="13" y="4" width="7" height="7" rx="1.6" />
    <rect x="4" y="13" width="7" height="7" rx="1.6" />
    <rect x="13" y="13" width="7" height="7" rx="1.6" />
  </svg>
);

/* A drafting pencil, for lessons that start with a sketch. */
export const Pencil = (props) => (
  <svg {...stroke} {...props}>
    <path d="M5 19l1-4.2L15.6 5.2a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L9.2 18Z" />
    <path d="M13.8 7l3.2 3.2" />
  </svg>
);

/* A stopwatch, for timed CAD-offs. */
export const Timer = (props) => (
  <svg {...stroke} {...props}>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 13.5V10M10 3.5h4M18.4 7.1l1.1-1.1" />
  </svg>
);

/* A ruler, for parts that have to fit the real world. */
export const Ruler = (props) => (
  <svg {...stroke} {...props}>
    <path d="M3.9 15.6 15.6 3.9l4.5 4.5L8.4 20.1Z" />
    <path d="m7.6 11.9 1.8 1.8M10.4 9.1l1.2 1.2M13.2 6.3l1.8 1.8" />
  </svg>
);

export const Trophy = (props) => (
  <svg {...stroke} {...props}>
    <path d="M8 4.5h8v5a4 4 0 0 1-8 0Z" />
    <path d="M8 6.5H5.5a2.5 2.5 0 0 0 2.6 3.3M16 6.5h2.5a2.5 2.5 0 0 1-2.6 3.3M12 13.5v3.5M8.5 19.5h7" />
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

/* Brand marks: the Discord logomark and the Instagram glyph. */
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
