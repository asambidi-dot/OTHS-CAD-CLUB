import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

const ZOOM_RANGE = [0.5, 1.7];
const DURATION = { explode: 1.8, camera: 0.45 };
const STAGE_WINDOW = 0.5; // share of the explode timeline each assembly stage takes
const POLAR_RANGE = [0.18, Math.PI - 0.18];
const INPUT_SPEED = Math.PI * 0.8; // rad/s at the input shaft (0.4 rev/s)
const STEP_ANGLE = Math.PI / 2; // input turn per step when motion is reduced
const DEFAULT_FILL = { assembled: 0.8, exploded: 0.86 };
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/*
 * The poster's softbox studio. Blender bakes the same emissive panels that light the
 * poster into an equirectangular HDR, so metal reflects identical highlights here.
 * One shadow-casting key adds the occlusion that image lighting alone can't.
 */
const KEY_DIRECTION = new THREE.Vector3(0.55, 0.78, 0.8).normalize(); // the Key softbox, glTF axes
// Cycles lets metal reflect the parts around it; image lighting only reflects the studio,
// so metal gets a little more of it to land at the poster's brightness.
const METAL_ENV_BOOST = 1.6;

function Studio({ env, radius, target, shadowSize }) {
  const { scene } = useThree();
  const texture = useLoader(HDRLoader, env);
  const light = useRef(null);

  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.environmentIntensity = 1;
    return () => {
      scene.environment = null;
    };
  }, [texture, scene]);

  useEffect(() => {
    const key = light.current;
    key.position.copy(target).addScaledVector(KEY_DIRECTION, radius * 4);
    key.target.position.copy(target);
    key.target.updateMatrixWorld();
    const cam = key.shadow.camera;
    cam.left = cam.bottom = -radius * 1.2;
    cam.right = cam.top = radius * 1.2;
    cam.near = radius;
    cam.far = radius * 7;
    cam.updateProjectionMatrix();
  }, [radius, target]);

  return (
    <directionalLight
      ref={light}
      intensity={0.35}
      color="#fff4ea"
      castShadow
      shadow-mapSize={[shadowSize, shadowSize]}
      shadow-radius={3}
      shadow-bias={-0.0002}
      shadow-normalBias={radius * 0.004}
    />
  );
}

/* Same basis as the Blender script's view_basis(), in glTF axes. */
function viewBasis(direction) {
  const forward = direction.clone().negate();
  const reference = Math.abs(direction.y) < 0.98 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, -1);
  const right = new THREE.Vector3().crossVectors(forward, reference).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward);
  return { forward, right, up };
}

/*
 * Target and distance so the model's vertices span `fill` of the limiting side of
 * the view, centred — the same fit the Blender script uses for the poster, so the
 * live view opens exactly where the poster was taken.
 */
function fitView(points, direction, fovY, aspect, fill) {
  const d = direction.clone().normalize();
  const { forward, right, up } = viewBasis(d);
  const tanY = Math.tan(fovY / 2);
  const tanX = tanY * aspect;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], points[i + k]);
      hi[k] = Math.max(hi[k], points[i + k]);
    }
  }
  const target = new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2);
  let distance = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 1.5;

  for (let iteration = 0; iteration < 10; iteration++) {
    const ex = target.x + d.x * distance;
    const ey = target.y + d.y * distance;
    const ez = target.z + d.z * distance;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; // prettier-ignore
    for (let i = 0; i < points.length; i += 3) {
      const vx = points[i] - ex;
      const vy = points[i + 1] - ey;
      const vz = points[i + 2] - ez;
      const z = vx * forward.x + vy * forward.y + vz * forward.z;
      const x = (vx * right.x + vy * right.y + vz * right.z) / (z * tanX);
      const y = (vx * up.x + vy * up.y + vz * up.z) / (z * tanY);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    const extent = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
    target
      .addScaledVector(right, ((x0 + x1) / 2) * distance * tanX)
      .addScaledVector(up, ((y0 + y1) / 2) * distance * tanY);
    distance *= extent / fill;
  }
  return { target, distance };
}

function worldPoints(root) {
  root.updateMatrixWorld(true);
  const out = [];
  const v = new THREE.Vector3();
  root.traverse((node) => {
    if (!node.isMesh) return;
    const position = node.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld);
      out.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(out);
}

/*
 * Reads the exported GLB into a per-viewer hierarchy: cloned materials (so wireframe
 * never leaks between viewers), explode stages and mechanism drives from the glTF
 * extras, the gear train's tooth counts, and the opening camera from ViewCamera.
 */
function useAssembly(src) {
  const gltf = useGLTF(src);

  return useMemo(() => {
    const root = gltf.scene.clone(true);
    const clones = new Map();
    const parts = [];
    const drives = [];
    let view = null;
    let train = null;

    root.traverse((node) => {
      const data = node.userData;
      if (node.isCamera || node.name === "ViewCamera") view ??= node;
      if (data.sun_teeth) train = { sun: data.sun_teeth, planet: data.planet_teeth, ring: data.ring_teeth };
      if (node.isMesh) {
        if (!clones.has(node.material)) {
          const material = node.material.clone();
          if (material.metalness > 0.5) material.envMapIntensity = METAL_ENV_BOOST;
          clones.set(node.material, material);
        }
        node.material = clones.get(node.material);
        node.castShadow = true;
        node.receiveShadow = true;
      }
      if (Array.isArray(data.explode_axis)) {
        parts.push({
          object: node,
          assembled: node.position.clone(),
          axis: new THREE.Vector3(...data.explode_axis).normalize(),
          distance: data.explode_distance ?? 0,
          order: data.explode_order ?? 0,
        });
      }
      if (data.drive) {
        drives.push({ object: node, rest: node.quaternion.clone(), drive: data.drive, factor: data.drive_factor ?? 1 });
      }
    });

    let direction = new THREE.Vector3(1, 0.62, 0.82).normalize();
    let fill = DEFAULT_FILL;
    if (view) {
      view.updateWorldMatrix(true, false);
      const target = new THREE.Vector3(...(view.userData.target ?? [0, 0, 0]));
      direction = view.getWorldPosition(new THREE.Vector3()).sub(target).normalize();
      if (view.userData.fill) fill = { assembled: view.userData.fill, exploded: view.userData.fill_exploded ?? view.userData.fill };
      view.removeFromParent();
    }

    // Staggered stages: order 0 leaves first and returns last.
    const lastStage = Math.max(0, ...parts.map((part) => part.order));
    const window = lastStage ? STAGE_WINDOW : 1;
    for (const part of parts) part.start = lastStage ? (part.order * (1 - window)) / lastStage : 0;
    const explodeTo = (t) => {
      for (const part of parts) {
        const k = easeInOut(clamp((t - part.start) / window, 0, 1));
        part.object.position.copy(part.assembled).addScaledVector(part.axis, part.distance * k);
      }
    };

    const assembled = worldPoints(root);
    explodeTo(1);
    const exploded = parts.length ? worldPoints(root) : assembled;
    explodeTo(0);
    root.updateMatrixWorld(true);

    const bounds = new THREE.Box3();
    for (const points of [assembled, exploded]) {
      for (let i = 0; i < points.length; i += 3) bounds.expandByPoint(new THREE.Vector3(points[i], points[i + 1], points[i + 2]));
    }
    let floor = Infinity;
    for (let i = 1; i < assembled.length; i += 3) floor = Math.min(floor, assembled[i]);

    return { root, materials: [...clones.values()], parts, drives, train, explodeTo, points: { assembled, exploded }, direction, fill, bounds, floor };
  }, [gltf]);
}

export default function ViewerScene({
  src,
  env,
  apiRef,
  exploded,
  wireframe,
  running,
  visible,
  interactive,
  reducedMotion,
  fov,
  shadowSize = 2048,
  onReady,
}) {
  const { camera, size, invalidate, gl } = useThree();
  const model = useAssembly(src);
  const controls = useRef(null);
  const fovY = THREE.MathUtils.degToRad(fov);

  const computeFits = (aspect) => ({
    assembled: fitView(model.points.assembled, model.direction, fovY, aspect, model.fill.assembled),
    exploded: fitView(model.points.exploded, model.direction, fovY, aspect, model.fill.exploded),
  });

  // View: direction from the target and a zoom factor relative to the fitted distance.
  const view = useRef({ direction: model.direction.clone(), zoom: 1 });
  const fits = useRef(computeFits(size.width / size.height));
  const explodeState = useRef({ value: exploded ? 1 : 0, from: 0, to: 0, start: -1 });
  const cameraTween = useRef(null);
  const mechanism = useRef({ alpha: 0 });

  // Framing follows the explode: the camera eases out to fit the separated parts.
  const frame = () => {
    const k = easeInOut(explodeState.current.value);
    const { assembled: a, exploded: e } = fits.current;
    return {
      target: a.target.clone().lerp(e.target, k),
      distance: a.distance + (e.distance - a.distance) * k,
    };
  };

  const placeCamera = () => {
    const { target, distance } = frame();
    const { direction, zoom } = view.current;
    camera.position.copy(target).addScaledVector(direction, distance * zoom);
    camera.near = distance * 0.05;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    controls.current?.target.copy(target);
    controls.current?.update();
  };

  // Pull the live direction/zoom back from the camera after the visitor drags.
  const syncFromCamera = () => {
    const { target, distance } = frame();
    const offset = camera.position.clone().sub(target);
    view.current.direction = offset.clone().normalize();
    view.current.zoom = offset.length() / distance;
  };

  const applyDrives = () => {
    if (!model.train) return;
    const { sun, planet, ring } = model.train;
    const alpha = mechanism.current.alpha;
    const carrier = (alpha * sun) / (sun + ring); // ring fixed: carrier = sun · S / (S + R)
    const angles = { input: alpha, carrier, planet: (-(alpha - carrier) * sun) / planet }; // planet spin relative to the carrier
    const turn = new THREE.Quaternion();
    for (const drive of model.drives) {
      turn.setFromAxisAngle(Z_AXIS, (angles[drive.drive] ?? 0) * drive.factor);
      drive.object.quaternion.copy(turn).multiply(drive.rest);
    }
  };

  // First placement, and keep the framing when the stage is resized.
  useEffect(() => {
    syncFromCamera();
    fits.current = computeFits(size.width / size.height);
    placeCamera();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  useEffect(() => {
    view.current = { direction: model.direction.clone(), zoom: 1 };
    placeCamera();
    onReady?.({ parts: model.parts.length, mechanism: Boolean(model.train && model.drives.length) });
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    for (const material of model.materials) material.wireframe = wireframe;
    invalidate();
  }, [wireframe, model, invalidate]);

  useEffect(() => {
    const state = explodeState.current;
    const to = exploded ? 1 : 0;
    syncFromCamera();
    if (reducedMotion) {
      Object.assign(state, { value: to, start: -1 });
      model.explodeTo(to);
      placeCamera();
    } else {
      Object.assign(state, { from: state.value, to, start: performance.now() });
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploded, reducedMotion, invalidate]);

  // Start (or resume, once back on screen) the render loop for the mechanism.
  useEffect(() => {
    if (running && visible) invalidate();
  }, [running, visible, invalidate]);

  // Touch devices: only take over touches in explicit interaction mode, so the page still scrolls.
  useEffect(() => {
    gl.domElement.style.touchAction = interactive ? "none" : "pan-y";
  }, [interactive, gl]);

  const animateView = (direction, zoom) => {
    if (!cameraTween.current) syncFromCamera();
    const next = { direction: direction.clone().normalize(), zoom: clamp(zoom, ...ZOOM_RANGE) };
    if (reducedMotion) {
      view.current = next;
      placeCamera();
    } else {
      cameraTween.current = { from: { ...view.current, direction: view.current.direction.clone() }, to: next, start: performance.now() };
    }
    invalidate();
  };

  // Repeated presses add up: start from where a running move is heading, not where it is now.
  const heading = () => cameraTween.current?.to ?? (syncFromCamera(), view.current);

  const rotated = (azimuth, polar) => {
    const s = new THREE.Spherical().setFromVector3(heading().direction);
    s.theta += azimuth;
    s.phi = clamp(s.phi + polar, ...POLAR_RANGE);
    return new THREE.Vector3().setFromSpherical(s);
  };

  useImperativeHandle(apiRef, () => ({
    rotate: (azimuth = 0, polar = 0) => animateView(rotated(azimuth, polar), heading().zoom),
    zoom: (factor) => {
      const { direction, zoom } = heading();
      animateView(direction, zoom * factor);
    },
    reset: () => animateView(model.direction, 1),
    step: () => {
      if (explodeState.current.value > 0) return;
      mechanism.current.alpha += STEP_ANGLE;
      applyDrives();
      invalidate();
    },
  }));

  useFrame((_, delta) => {
    const now = performance.now();
    let busy = false;
    let reframe = false;

    const ex = explodeState.current;
    if (ex.start >= 0) {
      const t = Math.min(1, (now - ex.start) / (DURATION.explode * 1000));
      ex.value = ex.from + (ex.to - ex.from) * t;
      model.explodeTo(ex.value);
      reframe = true;
      if (t < 1) busy = true;
      else ex.start = -1;
    }

    // The mechanism only turns while assembled, running and on screen.
    if (running && visible && ex.value === 0 && ex.start < 0 && model.train) {
      mechanism.current.alpha += INPUT_SPEED * Math.min(delta, 0.05);
      applyDrives();
      busy = true;
    }

    const tween = cameraTween.current;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / (DURATION.camera * 1000));
      const k = easeInOut(t);
      const a = new THREE.Spherical().setFromVector3(tween.from.direction);
      const b = new THREE.Spherical().setFromVector3(tween.to.direction);
      let dTheta = b.theta - a.theta;
      if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
      if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
      const s = new THREE.Spherical(1, a.phi + (b.phi - a.phi) * k, a.theta + dTheta * k);
      view.current = {
        direction: new THREE.Vector3().setFromSpherical(s),
        zoom: tween.from.zoom + (tween.to.zoom - tween.from.zoom) * k,
      };
      reframe = true;
      if (t < 1) busy = true;
      else cameraTween.current = null;
    }

    if (reframe) placeCamera();
    if (busy) invalidate();
  });

  const { footprint, centre, radius } = useMemo(() => {
    const size = model.bounds.getSize(new THREE.Vector3());
    return { footprint: size, centre: model.bounds.getCenter(new THREE.Vector3()), radius: size.length() / 2 };
  }, [model]);
  const { floor } = model;

  return (
    <>
      <Studio env={env} radius={radius} target={centre} shadowSize={shadowSize} />
      <primitive object={model.root} dispose={null} />
      <ContactShadows
        position={[centre.x, floor - radius * 0.002, centre.z]}
        scale={[footprint.x * 1.6, footprint.z * 1.6]}
        far={footprint.y * 0.7}
        blur={2.4}
        opacity={0.55}
        resolution={512}
        color="#000000"
      />
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={interactive}
        enablePan={false}
        enableZoom={false}
        enableDamping={false}
        autoRotate={false}
        minPolarAngle={POLAR_RANGE[0]}
        maxPolarAngle={POLAR_RANGE[1]}
        onEnd={syncFromCamera}
      />
    </>
  );
}
