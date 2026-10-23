import { Component, Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ViewerScene from "./ViewerScene";
import { Poster, asset } from "./ViewerPoster";
import {
  Explode,
  Hand,
  Pause,
  Play,
  Reset,
  RotateLeft,
  RotateRight,
  Step,
  Wireframe,
  ZoomIn,
  ZoomOut,
} from "../Icons";

const STEP = { azimuth: Math.PI / 6, polar: Math.PI / 12, zoom: 0.85 };
const DEFAULT_CONTROLS = {
  rotation: true,
  zoom: true,
  mechanismPlayback: true,
  explodedView: true,
  wireframe: true,
  resetView: true,
  autoplay: false,
};
const STUDIO = "env/studio-softbox.hdr";

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/* True while the element is on screen, so a running mechanism stops drawing when scrolled away. */
function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return onScreen;
}

/* Any failure inside the canvas (missing file, lost context) drops back to the poster. */
class ViewerBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ToolButton({ label, pressed, disabled, onClick, children, text }) {
  return (
    <button
      type="button"
      className={`viewer-tool${text ? " has-text" : ""}`}
      aria-label={text ? undefined : label}
      aria-pressed={pressed}
      disabled={disabled}
      title={label}
      onClick={onClick}
    >
      {children}
      {text && <span className="viewer-tool-text">{text}</span>}
    </button>
  );
}

/*
 * Interactive glTF viewer: poster first, then a transparent WebGL canvas that renders
 * only on demand — while something moves, and never while scrolled off screen.
 * Every interaction is also a real button and a key.
 */
export default function ModelViewer({
  src,
  poster,
  posterAlt,
  label,
  fov = 30,
  env = STUDIO,
  controls = DEFAULT_CONTROLS,
  maxPixelRatio = 1.5,
  className = "",
}) {
  const supported = useMemo(webglAvailable, []);
  const [status, setStatus] = useState(supported ? "loading" : "unsupported");
  const [features, setFeatures] = useState({ parts: false, mechanism: false });
  const [exploded, setExploded] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [running, setRunning] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const coarse = useMedia("(pointer: coarse)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const stage = useRef(null);
  const onScreen = useOnScreen(stage);
  const api = useRef(null);
  const helpId = useId();

  const show = { ...DEFAULT_CONTROLS, ...controls };
  const ready = status === "ready";
  const live = status === "loading" || ready;
  const interactive = !coarse || touchMode;
  const canExplode = show.explodedView && features.parts;
  const canRun = show.mechanismPlayback && features.mechanism;

  // Reduced motion never leaves the mechanism spinning; it advances in steps instead.
  useEffect(() => {
    if (reducedMotion) setRunning(false);
  }, [reducedMotion]);

  const say = (text) => setAnnouncement(text);

  const toggleRun = () => {
    if (!canRun || exploded) return;
    if (reducedMotion) {
      api.current?.step();
      say("Mechanism advanced by a quarter turn of the input shaft");
      return;
    }
    setRunning(!running);
    say(running ? "Mechanism paused" : "Mechanism running");
  };
  const toggleExplode = () => {
    if (!canExplode) return;
    const next = !exploded;
    // The mechanism pauses before the parts separate, and only resumes when asked again.
    if (next && running) setRunning(false);
    setExploded(next);
    say(next ? (running ? "Mechanism paused. Exploded view" : "Exploded view") : "Assembled view");
  };
  const toggleWireframe = () => {
    setWireframe(!wireframe);
    say(wireframe ? "Solid view" : "Wireframe view");
  };
  const resetView = () => {
    api.current?.reset();
    say("View reset");
  };
  const rotate = (azimuth, polar) => api.current?.rotate(azimuth, polar);
  const zoom = (factor) => api.current?.zoom(factor);

  const onKeyDown = (event) => {
    if (!ready || event.target !== event.currentTarget) return;
    const actions = {
      ArrowLeft: show.rotation && (() => rotate(-STEP.azimuth, 0)),
      ArrowRight: show.rotation && (() => rotate(STEP.azimuth, 0)),
      ArrowUp: show.rotation && (() => rotate(0, -STEP.polar)),
      ArrowDown: show.rotation && (() => rotate(0, STEP.polar)),
      "+": show.zoom && (() => zoom(STEP.zoom)),
      "=": show.zoom && (() => zoom(STEP.zoom)),
      "-": show.zoom && (() => zoom(1 / STEP.zoom)),
      _: show.zoom && (() => zoom(1 / STEP.zoom)),
      " ": canRun && !exploded && toggleRun,
      p: canRun && !exploded && toggleRun,
      e: canExplode && toggleExplode,
      w: show.wireframe && toggleWireframe,
      r: show.resetView && resetView,
      Home: show.resetView && resetView,
    };
    const action = actions[event.key] ?? actions[event.key.toLowerCase?.()];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation(); // e.g. the project dialog also listens for arrow keys
    action();
  };

  const help = !ready
    ? "Loading the 3D model…"
    : coarse
      ? touchMode
        ? "Drag to rotate. Tap Done to scroll the page again."
        : "Tap Interact to rotate the model with your finger."
      : canRun
        ? `Drag to explore. When focused: arrow keys rotate, + and − zoom, Space ${reducedMotion ? "steps" : "runs"} the mechanism.`
        : "Drag to explore. When focused, arrow keys rotate, + and − zoom.";

  const runLabel = reducedMotion ? "Step the mechanism" : running ? "Pause mechanism" : "Run mechanism";

  return (
    <figure className={`cad-viewer ${className}`.trim()} data-status={status}>
      <div
        ref={stage}
        className="cad-viewer-stage"
        role="group"
        aria-label={label}
        aria-describedby={helpId}
        tabIndex={ready ? 0 : -1}
        data-interacting={coarse && touchMode ? "true" : undefined}
        onKeyDown={onKeyDown}
      >
        <Poster src={poster} alt={posterAlt} hidden={ready} />

        {live && (
          <ViewerBoundary onError={() => setStatus("error")}>
            <Canvas
              style={{ position: "absolute", inset: 0 }}
              dpr={[1, maxPixelRatio]}
              frameloop="demand"
              shadows={{ type: THREE.PCFShadowMap }}
              camera={{ fov, near: 0.01, far: 10, position: [0.4, 0.3, 0.4] }}
              gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
              onCreated={({ gl }) => {
                gl.toneMapping = THREE.NeutralToneMapping; // Khronos PBR Neutral, as in the Blender poster
                gl.toneMappingExposure = 1;
                gl.setClearColor(0x000000, 0);
              }}
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <ViewerScene
                  src={asset(src)}
                  env={asset(env)}
                  apiRef={api}
                  fov={fov}
                  exploded={exploded}
                  wireframe={wireframe}
                  running={running}
                  visible={onScreen}
                  interactive={interactive}
                  reducedMotion={reducedMotion}
                  shadowSize={coarse ? 1024 : 2048}
                  onReady={({ parts, mechanism }) => {
                    setFeatures({ parts: parts > 0, mechanism });
                    setStatus("ready");
                    if (mechanism && show.autoplay && !reducedMotion) setRunning(true);
                  }}
                />
              </Suspense>
            </Canvas>
          </ViewerBoundary>
        )}
      </div>

      {ready && (
        <div className="viewer-toolbar" role="toolbar" aria-label="Model controls">
          <div className="viewer-group">
            {canRun && (
              <ToolButton
                label={exploded ? "Assemble the model to run the mechanism" : runLabel}
                text={reducedMotion ? "Step" : running ? "Pause" : "Run"}
                pressed={reducedMotion ? undefined : running}
                disabled={exploded}
                onClick={toggleRun}
              >
                {reducedMotion ? <Step /> : running ? <Pause /> : <Play />}
              </ToolButton>
            )}
            {canExplode && (
              <ToolButton
                label={exploded ? "Assemble the parts" : "Exploded view"}
                text={exploded ? "Assemble" : "Explode"}
                pressed={exploded}
                onClick={toggleExplode}
              >
                <Explode />
              </ToolButton>
            )}
            {show.wireframe && (
              <ToolButton label="Wireframe view" text="Wireframe" pressed={wireframe} onClick={toggleWireframe}>
                <Wireframe />
              </ToolButton>
            )}
            {show.resetView && (
              <ToolButton label="Reset view" onClick={resetView}>
                <Reset />
              </ToolButton>
            )}
            {coarse && show.rotation && (
              <ToolButton
                label={touchMode ? "Stop interacting with the model" : "Interact with the model"}
                text={touchMode ? "Done" : "Interact"}
                pressed={touchMode}
                onClick={() => setTouchMode((value) => !value)}
              >
                <Hand />
              </ToolButton>
            )}
          </div>

          {(show.rotation || show.zoom) && (
            <>
              <span className="viewer-sep" aria-hidden="true" />
              <div className="viewer-group">
                {show.rotation && (
                  <>
                    <ToolButton label="Rotate left" onClick={() => rotate(-STEP.azimuth, 0)}>
                      <RotateLeft />
                    </ToolButton>
                    <ToolButton label="Rotate right" onClick={() => rotate(STEP.azimuth, 0)}>
                      <RotateRight />
                    </ToolButton>
                  </>
                )}
                {show.zoom && (
                  <>
                    <ToolButton label="Zoom out" onClick={() => zoom(1 / STEP.zoom)}>
                      <ZoomOut />
                    </ToolButton>
                    <ToolButton label="Zoom in" onClick={() => zoom(STEP.zoom)}>
                      <ZoomIn />
                    </ToolButton>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <figcaption className="cad-viewer-help" id={helpId}>
        {status === "error" || status === "unsupported" ? null : help}
      </figcaption>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </figure>
  );
}
