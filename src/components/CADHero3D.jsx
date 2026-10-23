import { lazy, Suspense } from "react";
import { gearboxSpec } from "../data/gearboxSpec";
import ViewerPoster from "./viewer/ViewerPoster";

// three.js loads in its own chunk after the page; the poster holds the space meanwhile.
const ModelViewer = lazy(() => import("./viewer/ModelViewer"));

const HERO = {
  src: gearboxSpec.modelUrl,
  poster: gearboxSpec.posterUrl,
  env: gearboxSpec.environmentUrl,
  posterAlt:
    "Cutaway planetary gearbox with a green housing. A quarter of the housing and covers is cut away to show the ring gear, a planet gear on its carrier, the shafts and ball bearings.",
  label: "Interactive 3D model of a cutaway planetary gearbox",
  controls: gearboxSpec.interaction,
  maxPixelRatio: gearboxSpec.performanceTargets.maxPixelRatio,
};

export default function CADHero3D() {
  return (
    <Suspense fallback={<ViewerPoster {...HERO} caption="Loading the 3D model…" className="cad-viewer-hero" />}>
      <ModelViewer {...HERO} className="cad-viewer-hero" />
    </Suspense>
  );
}
