/*
 * MEETING LOG — one entry per meeting. The site sorts them newest first.
 *
 * 1. Put the meeting's photos in public/meetings/<date>/
 *    (for example public/meetings/2026-10-21/01.jpg). Resize them first:
 *    about 1600px on the long side keeps the page fast.
 * 2. Add an entry to the list below. Only `date` and `title` are required.
 *
 *   {
 *     date: "2026-10-21",                  // YYYY-MM-DD
 *     title: "Sketch workspace basics",
 *     type: "Lesson",                      // e.g. Lesson, CAD-off, Challenge
 *     summary: "One or two sentences about what the club did.",
 *     photos: [
 *       { src: "meetings/2026-10-21/01.jpg", alt: "What the photo shows" },
 *     ],
 *     links: [{ label: "Slides", href: "https://example.com/slides" }],
 *   },
 *
 * Only post photos that everyone in them is comfortable sharing.
 */
export const meetings = [];
