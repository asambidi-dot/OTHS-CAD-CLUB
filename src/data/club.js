/*
 * Site content for the OTHS CAD Club.
 *
 *  - Discord and Instagram links: src/components/ClubSocialLinks.jsx
 *  - Meeting recaps and photos:   src/data/meetings.js
 *
 * Meeting times, rooms and announcements are posted on the Discord, so the
 * site points people there instead of listing dates.
 */
export const club = {
  name: "OTHS CAD Club",
  tagline: "One passion. Infinite creativity.",
};

export const navLinks = [
  { id: "about", label: "About" },
  { id: "activities", label: "Activities" },
  { id: "projects", label: "Projects" },
  { id: "meetings", label: "Meetings" },
  { id: "join", label: "Join" },
];

export const activities = [
  {
    id: "lessons",
    number: "01",
    title: "Beginner lessons",
    description:
      "Learn Onshape one step at a time, starting with sketches and simple parts. No experience needed.",
  },
  {
    id: "cadoffs",
    number: "02",
    title: "CAD-offs",
    description:
      "Timed design challenges: everyone gets the same prompt, then we compare how each person solved it.",
  },
  {
    id: "realworld",
    number: "03",
    title: "Real-world challenges",
    description:
      "Design parts for everyday problems, like a phone stand or a desk organizer, and check that they actually fit.",
  },
  {
    id: "tournaments",
    number: "04",
    title: "Future tournaments",
    description:
      "Build the skills now for possible local and national CAD competitions later on.",
  },
];

export const processSteps = [
  {
    id: "imagine",
    name: "Imagine",
    title: "Start with an idea",
    text: "Every design begins with a question: what should it do, and roughly how big should it be? A quick doodle on paper is plenty.",
    feature: "Idea",
  },
  {
    id: "sketch",
    name: "Sketch",
    title: "Sketch it in 2D",
    text: "Draw a flat outline on a plane, then lock in exact sizes with dimensions and constraints so the shape behaves.",
    feature: "Sketch 1",
  },
  {
    id: "model",
    name: "Model",
    title: "Model it in 3D",
    text: "Extrude the sketch into a solid part. Cut holes, add thickness, and combine simple shapes into something real.",
    feature: "Extrude 1",
  },
  {
    id: "refine",
    name: "Refine",
    title: "Refine and repeat",
    text: "Round the sharp edges, check the fit, and improve. Change one dimension and the whole model updates with it.",
    feature: "Fillet 1",
  },
];

export const projectCategories = [
  { id: "all", label: "All" },
  { id: "mechanical", label: "Mechanical" },
  { id: "everyday", label: "Everyday objects" },
  { id: "geometric", label: "Geometric" },
];

export const projects = [
  {
    id: "bracket",
    model: "models/projects/bracket.glb",
    thumb: "images/projects/bracket.webp",
    title: "Mechanical bracket",
    category: "mechanical",
    level: "Beginner",
    summary: "A bent L-bracket with stiffening ribs and bolt holes.",
    description:
      "Brackets hold the world together — shelves, robots, bike racks. This concept starts from one side profile, then adds the details that make a part strong and easy to bolt in place.",
    skills: ["Sketch constraints", "Extrude", "Fillet", "Hole", "Mirror"],
    steps: [
      "Sketch the L-shaped side profile and dimension the thickness.",
      "Extrude it to width and fillet the inside bend.",
      "Add one triangular rib, then mirror it to the other side.",
      "Place four mounting holes and check their spacing.",
    ],
  },
  {
    id: "gear",
    model: "models/projects/gear.glb",
    thumb: "images/projects/gear.webp",
    title: "Spur gear",
    category: "mechanical",
    level: "Intermediate",
    summary: "An 18-tooth gear with a keyed hub and a lightened web.",
    description:
      "Gears turn rotation into useful motion. Here you model a single tooth carefully, let a pattern do the repetitive work, and finish with a hub that fits a shaft.",
    skills: ["Construction geometry", "Circular pattern", "Extrude remove", "Variables"],
    steps: [
      "Sketch the root and tip circles as construction geometry.",
      "Draw one tooth and extrude the gear blank.",
      "Circular-pattern the tooth 18 times around the center.",
      "Add the hub, bore, keyway, and six lightening holes.",
    ],
  },
  {
    id: "organizer",
    model: "models/projects/organizer.glb",
    thumb: "images/projects/organizer.webp",
    title: "Desk organizer",
    category: "everyday",
    level: "Beginner",
    summary: "A tray with a pen cup and compartments sized to real supplies.",
    description:
      "Measure what lives on your desk, then design around it. This concept is all about planning space: wall thickness, compartment sizes, and leaving room for your fingers.",
    skills: ["Measuring", "Shell", "Extrude", "Fillet"],
    steps: [
      "Measure pens, sticky notes, and clips you want to store.",
      "Sketch the footprint and extrude the base block.",
      "Shell it into a tray, then add divider walls.",
      "Add the pen cup and soften the top edges.",
    ],
  },
  {
    id: "hook",
    model: "models/projects/hook.glb",
    thumb: "images/projects/hook.webp",
    title: "Headphone hook",
    category: "everyday",
    level: "Beginner",
    summary: "An under-desk hook with a curved saddle that cradles the band.",
    description:
      "A small part with a real job. Model the hook from one sketch, then tune the saddle radius and arm length so it fits your desk and your headphones.",
    skills: ["Arcs & tangency", "Extrude", "Hole", "Design for fit"],
    steps: [
      "Sketch the hook's side profile with tangent arcs.",
      "Extrude it to a comfortable width.",
      "Add countersunk screw holes to the mounting arm.",
      "Test the fit against your desk thickness and adjust.",
    ],
  },
  {
    id: "assembly",
    model: "models/projects/assembly.glb",
    thumb: "images/projects/assembly.webp",
    title: "Geometric assembly",
    category: "geometric",
    level: "Intermediate",
    summary: "Three solids stacked on one axis, mated and shown exploded.",
    description:
      "An introduction to assemblies: separate parts that fit together. Build a hexagonal base, a rotated block, and a pyramid, then mate them on a shared axis.",
    skills: ["Multiple parts", "Assemblies", "Mate connectors", "Exploded views"],
    steps: [
      "Model the hex base, the block, and the pyramid as separate parts.",
      "Insert all three into an assembly.",
      "Add mate connectors on each touching face.",
      "Fasten them on one axis and create an exploded view.",
    ],
  },
  {
    id: "planter",
    model: "models/projects/planter.glb",
    thumb: "images/projects/planter.webp",
    title: "Faceted planter",
    category: "geometric",
    level: "Intermediate",
    summary: "A low-poly hexagonal pot that swells out and tapers in.",
    description:
      "Simple shapes can look sculpted. Loft between three hexagons to get crisp facets, then hollow the pot out so it's ready for soil.",
    skills: ["Planes", "Loft", "Shell", "Chamfer"],
    steps: [
      "Create three offset planes for the bottom, middle, and top.",
      "Sketch a hexagon on each plane at a different size.",
      "Loft through all three profiles.",
      "Shell the top face open and chamfer the rim.",
    ],
  },
];
