/*
 * Site content for the OTHS CAD Club.
 *
 *  - Discord and Instagram links: src/components/ClubSocialLinks.jsx
 *
 * Meeting times, rooms and announcements are posted on the Discord, so the
 * site points people there instead of listing dates.
 */
export const club = {
  name: "OTHS CAD Club",
  summary: "A student club at OTHS for learning computer-aided design.",
};

/* Section ids double as the nav's anchors, in page order. */
export const navLinks = [
  { id: "about", label: "About" },
  { id: "activities", label: "What we do" },
  { id: "photos", label: "Photos" },
  { id: "faq", label: "FAQ" },
  { id: "join", label: "Join" },
];

export const facts = [
  {
    title: "No experience needed",
    text: "Beginner lessons start from the first sketch, and other members help when you get stuck.",
  },
  {
    title: "Bring a laptop or Chromebook",
    text: "We design in Onshape, which runs in a web browser, so there is nothing to install.",
  },
  {
    title: "Everything is on Discord",
    text: "Meeting times, rooms and announcements are posted in our Discord server.",
  },
];

/* The bento grid. `size` sets how many columns a tile spans. */
export const activities = [
  {
    id: "lessons",
    size: "wide",
    title: "Beginner lessons",
    description:
      "Learn Onshape one step at a time, starting with sketches and simple parts. No experience needed.",
  },
  {
    id: "cadoffs",
    title: "CAD-offs",
    description:
      "Timed design challenges: everyone gets the same prompt, then we compare how each person solved it.",
  },
  {
    id: "realworld",
    title: "Real-world challenges",
    description:
      "Design parts for everyday problems, like a phone stand or a desk organizer, and check that they actually fit.",
  },
  {
    id: "help",
    title: "Help from members",
    description:
      "Stuck on a constraint or an extrude? Ask the person next to you, or post a screenshot in the Discord.",
  },
  {
    id: "share",
    title: "Share your designs",
    description:
      "Post what you're making, compare approaches after a CAD-off, and try the challenges other members set.",
  },
  {
    id: "tournaments",
    size: "full",
    title: "Future tournaments",
    description:
      "Build the skills now for possible local and national CAD competitions later on.",
    tag: "Later on",
  },
];

export const processSteps = [
  {
    id: "imagine",
    name: "Imagine",
    title: "Start with an idea",
    text: "Every design begins with a question: what should it do, and roughly how big should it be? A quick doodle on paper is plenty.",
  },
  {
    id: "sketch",
    name: "Sketch",
    title: "Sketch it in 2D",
    text: "Draw a flat outline on a plane, then lock in exact sizes with dimensions and constraints so the shape behaves.",
  },
  {
    id: "model",
    name: "Model",
    title: "Model it in 3D",
    text: "Extrude the sketch into a solid part. Cut holes, add thickness, and combine simple shapes into something real.",
  },
  {
    id: "refine",
    name: "Refine",
    title: "Refine and repeat",
    text: "Round the sharp edges, check the fit, and improve. Change one dimension and the whole model updates with it.",
  },
];

/*
 * Photos from club meetings, in public/photos/. Each one is saved as WebP twice:
 * <name>-640.webp and <name>-1280.webp (the photo's full width when that is less).
 * Blur any readable names or student ID numbers before adding a photo.
 * `width` and `height` are the full photo's size in pixels.
 */
export const meetingPhotos = [
  {
    name: "agenda",
    width: 1200,
    height: 1600,
    alt: "Two members stand by a screen showing the agenda for the club's third meeting.",
  },
  {
    name: "airplane-rules",
    width: 1200,
    height: 1600,
    alt: "A member presents the rules of the paper airplane challenge to the club.",
  },
  {
    name: "airplane-briefing",
    width: 1200,
    height: 1600,
    alt: "A member smiles and makes a peace sign, with the paper airplane challenge on the screen behind.",
  },
  {
    name: "airplane-folding",
    width: 1200,
    height: 1600,
    alt: "Members fold a paper airplane at their table while the design steps are shown on screen.",
  },
  {
    name: "airplanes",
    width: 1600,
    height: 1200,
    alt: "Members hold up their finished paper airplanes.",
  },
  {
    name: "questions",
    width: 1200,
    height: 1600,
    alt: "Members sit at lab tables, and one raises a hand to answer a question.",
  },
  {
    name: "onshape-workspace",
    width: 1200,
    height: 1600,
    alt: "A member points out the parts of the Onshape workspace on a classroom screen.",
  },
  {
    name: "onshape-sketch",
    width: 1200,
    height: 1600,
    alt: "A member explains the sketch tools in Onshape, next to a slide on what sketch colours mean.",
  },
  {
    name: "cube-pieces",
    width: 900,
    height: 1600,
    alt: "Members fit the pieces of a cube puzzle together.",
  },
  {
    name: "cube-solving",
    width: 1600,
    height: 900,
    alt: "Members crowd around a table, working on a cube puzzle together.",
  },
  {
    name: "cube-huddle-1",
    width: 900,
    height: 1600,
    alt: "Members lean in around a table to work on a puzzle.",
  },
  {
    name: "cube-huddle-2",
    width: 900,
    height: 1600,
    alt: "Members watch as one of them works on a puzzle at the table.",
  },
  {
    name: "cube-team",
    width: 1600,
    height: 900,
    alt: "A group of members stands behind a table with the finished cube puzzle.",
  },
];

/*
 * The three photos in the carousel, centre one first. `position` picks which part of
 * a tall photo stays in view when the card crops it.
 */
export const featuredPhotos = [
  { name: "airplanes", caption: "Paper airplane challenge" },
  { name: "cube-team", caption: "Cube puzzle" },
  { name: "onshape-workspace", caption: "Onshape lesson", position: "50% 22%" },
];

export const faqs = [
  {
    question: "Do I need any CAD experience?",
    answer:
      "No. Beginner lessons start from the very first sketch, and other members are happy to help when you get stuck. Every skill level is welcome.",
  },
  {
    question: "What do I need to bring?",
    answer:
      "A laptop or Chromebook. We design in Onshape, which runs in a web browser, so there's nothing to install.",
  },
  {
    question: "When and where do you meet?",
    answer:
      "Meeting times, rooms and announcements are all posted on our Discord. Join the server and you'll see when the next one is.",
  },
  {
    question: "How do I join?",
    answer:
      "Join our Discord server. That is how you become a member. Then come to a meeting and start your first part.",
  },
  {
    question: "What's a CAD-off?",
    answer:
      "A timed design challenge. Everyone gets the same prompt, then we compare how each person solved it.",
  },
];
