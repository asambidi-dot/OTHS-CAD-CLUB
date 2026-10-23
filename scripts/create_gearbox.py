"""
create_gearbox.py — the OTHS CAD Club hero model: a cutaway planetary gearbox.

Run headless from the project root (Blender 4.2+; written against 5.2):

    blender --background --factory-startup --python scripts/create_gearbox.py
    blender --background --factory-startup --python scripts/create_gearbox.py -- --no-render
    blender --background --factory-startup --python scripts/create_gearbox.py -- --views <dir>

Outputs, relative to the project root:
    assets/blender/oths-gearbox.blend        editable scene: parts, materials, camera, studio
    public/models/oths-gearbox.glb           web asset: named parts, mechanism and explode data
    public/images/oths-gearbox-poster.webp   poster from the web viewer's opening camera
    public/env/studio-softbox.hdr            the poster's softbox studio as an equirectangular
                                             HDR, so the website reflects the same lights
`--views <dir>` also renders inspection views (sides, top, underside, exploded) into <dir>.

Gear train (module 1.5, 20° pressure angle): sun 18 T, three planets 27 T, fixed ring
72 T. The input shaft drives the sun and the carrier drives the output shaft, so
    ratio = 1 + ring / sun = 5 : 1.
Ring = sun + 2 × planet, and (sun + ring) / planets = 30 is a whole number, so three
equally spaced planets can mesh with both gears at once. The script derives each
planet's tooth phase and the ring's from the sun, then checks every mesh for
interference at several positions of the running mechanism.

Conventions shared with the website:
  * The gearbox axis is Blender Y (glTF Z). The output side faces −Y (glTF +Z).
  * Rotating nodes carry `drive` = "input" | "carrier" | "planet" (and optionally a
    `drive_factor`). The site turns them from the tooth counts stored on the Gearbox
    root, so the motion follows the gear relationships.
  * Nodes that separate in the exploded view carry `explode_axis` (glTF axes, in the
    parent's space), `explode_distance` (m) and `explode_order` (0 = first out).
  * Stationary parts are cut away in the +X/+Z quadrant. Cut faces use the Section
    material; machined faces (bores, mating faces) use Machined; the rest is coated.
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cadkit as kit  # noqa: E402  (shared geometry, materials, export)

MM = kit.MM
ARGS = kit.ARGS
BLEND_PATH = os.path.join(kit.ROOT, "assets", "blender", "oths-gearbox.blend")
GLB_PATH = os.path.join(kit.ROOT, "public", "models", "oths-gearbox.glb")
POSTER_PATH = os.path.join(kit.ROOT, "public", "images", "oths-gearbox-poster.webp")
ENV_PATH = os.path.join(kit.ROOT, "public", "env", "studio-softbox.hdr")
VIEWS_DIR = ARGS[ARGS.index("--views") + 1] if "--views" in ARGS else None

# ---------------------------------------------------------------- gear train

MODULE = 1.5
PRESSURE_ANGLE = math.radians(20.0)
SUN_TEETH, PLANET_TEETH, RING_TEETH = 18, 27, 72
PLANETS = 3
PLANET_START = math.radians(45.0)   # planet 1 sits in the middle of the cutaway
BACKLASH = 0.10                     # mm of circular backlash per mesh, split over the pair
GEAR_FACE = 14.0                    # sun and planets, centred on y = 0
RING_FACE = 16.0
GEAR_CHAMFER = 0.3

CENTRE_DISTANCE = MODULE * (SUN_TEETH + PLANET_TEETH) / 2      # 33.75 mm
RATIO = 1 + RING_TEETH / SUN_TEETH                              # 5 : 1
PLANET_THETAS = [PLANET_START + 2 * math.pi * i / PLANETS for i in range(PLANETS)]


def pitch_radius(teeth):
    return MODULE * teeth / 2


SUN_TIP, SUN_ROOT = pitch_radius(SUN_TEETH) + MODULE, pitch_radius(SUN_TEETH) - 1.25 * MODULE
PLANET_TIP, PLANET_ROOT = pitch_radius(PLANET_TEETH) + MODULE, pitch_radius(PLANET_TEETH) - 1.25 * MODULE
RING_TIP, RING_ROOT = pitch_radius(RING_TEETH) - MODULE, pitch_radius(RING_TEETH) + 1.25 * MODULE

# ---------------------------------------------------------------- layout (mm; Blender Y, output side −Y)

HOUSING_FRONT, HOUSING_REAR = -30.0, 16.0
BOLT_CIRCLE = 66.5
# Eight bolts per cover; the two inside the cutaway quadrant are left out with their holes.
BOLT_ANGLES = [a for a in (22.5 + 45 * k for k in range(8)) if not 0 < a < 90]
FLANGE_SCREW_CIRCLE = 17.0
FLANGE_SCREW_ANGLES = [105.0, 225.0, 345.0]   # between the carrier arms

OUTPUT_BEARING = dict(d=20.0, D=42.0, B=12.0, y=-43.0, ball=6.35, balls=9)    # 6004
INPUT_BEARING = dict(d=15.0, D=35.0, B=11.0, y=32.5, ball=5.95, balls=8)      # 6202

FRONT, REAR, UP = [0.0, 0.0, 1.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]   # glTF axes
EXPLODE = {   # name: (axis, distance mm, order); order 0 leaves first and returns last
    "CoverBolt": (FRONT, 145, 0), "RearBolt": (REAR, 150, 0),
    "OutputKey": (UP, 18, 0), "InputKey": (UP, 18, 0),
    "FrontCover": (FRONT, 115, 1), "RearCap": (REAR, 115, 1),
    "OutputShaftCirclip": (FRONT, 75, 1), "InputShaftCirclip": (REAR, 73, 1),
    "OutputBearing": (FRONT, 70, 2), "InputBearing": (REAR, 70, 2),
    "CarrierGroup": (FRONT, 50, 3), "InputGroup": (REAR, 45, 3),
}

CAMERA_FOV = 30.0                                          # vertical, degrees
CAMERA_DIRECTION = Vector((0.78, -0.58, 0.70)).normalized()   # target → camera, Blender axes
FILL, FILL_EXPLODED = 0.80, 0.86   # share of the limiting viewer side the model spans
POSTER_SIZE = 1200

AXIAL = Matrix.Rotation(math.radians(90), 4, "X")   # local Z → world −Y, local Y → world Z

# ---------------------------------------------------------------- 2D outlines


def polar(r, a):
    return (r * math.cos(a), r * math.sin(a))


def circle(r, n, phase=0.0):
    return [polar(r, phase + 2 * math.pi * i / n) for i in range(n)]


def inv(a):
    return math.tan(a) - a


def tooth_outline(teeth, half_thickness, r_tip, r_root, phase=0.0, flank=4, tip=2, root=2):
    """CCW (x, z) outline in mm of `teeth` involute teeth, tooth 0 centred on `phase`.
    `half_thickness` is half the circular thickness at the pitch circle. A ring gear's
    spaces have exactly this shape, so the same outline cuts its internal teeth."""
    rp = pitch_radius(teeth)
    rb = rp * math.cos(PRESSURE_ANGLE)
    psi_p = half_thickness / rp

    def psi(r):  # angular half thickness at radius r (radial flank below the base circle)
        return psi_p + inv(PRESSURE_ANGLE) - inv(math.acos(min(1.0, rb / max(r, rb))))

    start = max(r_root, rb)
    radii = [start + (r_tip - start) * i / flank for i in range(flank + 1)]
    if r_root < rb:
        radii.insert(0, r_root)
    assert psi(r_tip) > 0, "pointed teeth"

    pitch, pts = 2 * math.pi / teeth, []
    for k in range(teeth):
        c = phase + k * pitch
        pts += [polar(r, c - psi(r)) for r in radii]
        pts += [polar(r_tip, c - psi(r_tip) + 2 * psi(r_tip) * i / tip) for i in range(1, tip)]
        pts += [polar(r, c + psi(r)) for r in reversed(radii)]
        a0, a1 = c + psi(r_root), c + pitch - psi(r_root)
        pts += [polar(r_root, a0 + (a1 - a0) * i / root) for i in range(1, root)]
    return pts


def offset_outline(pts, d):
    """Offset a CCW outline by d mm (positive grows it), mitred at the corners."""
    n, out = len(pts), []
    for i in range(n):
        (x0, z0), (x1, z1), (x2, z2) = pts[i - 1], pts[i], pts[(i + 1) % n]
        l1 = math.hypot(x1 - x0, z1 - z0) or 1e-9
        l2 = math.hypot(x2 - x1, z2 - z1) or 1e-9
        n1 = ((z1 - z0) / l1, -(x1 - x0) / l1)
        n2 = ((z2 - z1) / l2, -(x2 - x1) / l2)
        bx, bz = n1[0] + n2[0], n1[1] + n2[1]
        lb = math.hypot(bx, bz)
        bx, bz = (bx / lb, bz / lb) if lb > 1e-9 else n1
        k = d / max(0.35, bx * n1[0] + bz * n1[1])
        out.append((x1 + bx * k, z1 + bz * k))
    return out


def resample(pts, count):
    """Evenly spaced points along a closed polyline."""
    closed = pts + [pts[0]]
    lengths = [0.0]
    for (x0, z0), (x1, z1) in zip(closed, closed[1:]):
        lengths.append(lengths[-1] + math.hypot(x1 - x0, z1 - z0))
    out, j = [], 0
    for i in range(count):
        s = lengths[-1] * i / count
        while lengths[j + 1] < s:
            j += 1
        t = (s - lengths[j]) / ((lengths[j + 1] - lengths[j]) or 1e-9)
        (x0, z0), (x1, z1) = closed[j], closed[j + 1]
        out.append((x0 + (x1 - x0) * t, z0 + (z1 - z0) * t))
    return out


def carrier_outline(count=300):
    """Hub with three arms to the planet pins, blended with smooth fillets (a signed
    distance field traced from the centre, so the outline is star-shaped)."""
    pins = [polar(CENTRE_DISTANCE, th) for th in PLANET_THETAS]

    def smin(a, b, k):
        h = max(k - abs(a - b), 0.0) / k
        return min(a, b) - h ** 3 * k / 6

    def segment(px, pz, bx, bz):
        t = max(0.0, min(1.0, (px * bx + pz * bz) / (bx * bx + bz * bz)))
        return math.hypot(px - bx * t, pz - bz * t)

    def sdf(x, z):
        d = math.hypot(x, z) - 23.5
        for bx, bz in pins:
            arm = segment(x, z, bx, bz) - 8.5
            boss = math.hypot(x - bx, z - bz) - 12.0
            d = smin(d, smin(arm, boss, 3.0), 7.0)
        return d

    dense = []
    for i in range(3600):
        a = 2 * math.pi * i / 3600
        lo, hi = 0.0, 80.0
        for _ in range(36):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if sdf(*polar(mid, a)) < 0 else (lo, mid)
        dense.append(polar(lo, a))
    return resample(dense, count)


def stadium(width, a0, a1, n=12):
    """Rounded-end slot outline in a (b, a) plane: `width` across, from a0 to a1 along."""
    r = width / 2
    pts = [(r * math.cos(t), a0 + r - r * math.sin(t)) for t in (math.pi * i / n for i in range(n + 1))]
    pts += [(-r * math.cos(t), a1 - r + r * math.sin(t)) for t in (math.pi * i / n for i in range(n + 1))]
    return pts[::-1]


def retaining_ring_outline(r_in, r_out, internal, phase_deg, gap_deg=28.0, lug=1.4, n=48):
    """DIN 471/472-style ring: thinnest at the lugs, widest opposite the gap. Lugs point
    outward on shaft rings and inward on bore rings."""
    gap, phase = math.radians(gap_deg), math.radians(phase_deg)
    width, lug_span = r_out - r_in, math.radians(17.0)
    outer, inner = [], []
    for k in range(n + 1):
        a = gap / 2 + (2 * math.pi - gap) * k / n
        taper = 0.68 + 0.32 * (1 - math.cos(a)) / 2
        end = min(a - gap / 2, 2 * math.pi - gap / 2 - a)
        bump = lug * 0.5 * (1 + math.cos(math.pi * min(1.0, end / lug_span)))
        if internal:
            ro, ri = r_out, r_out - width * taper - bump
        else:
            ri, ro = r_in, r_in + width * taper + bump
        outer.append(polar(ro, phase + a))
        inner.append(polar(ri, phase + a))
    return outer + inner[::-1]


# ---------------------------------------------------------------- meshes


def extrude(name, outline, t0, t1, c, axis="Y", chamfer=0.0, cutter=False, flare=1.0, uv_radius=None):
    """Extrude a CCW 2D outline in mm from t0 to t1 (t0 < t1).
    axis "Y": outline is (x, z), extruded along Y.  axis "Z": outline is (x, y), along Z.
    Solids get a 45° chamfer at both ends; cutters flare outward past both ends
    instead, so the hole they leave has the same chamfer."""
    if cutter:
        loops = ([(t0 - flare, chamfer + flare), (t0 + chamfer, 0.0), (t1 - chamfer, 0.0), (t1 + flare, chamfer + flare)]
                 if chamfer else [(t0 - flare, 0.0), (t1 + flare, 0.0)])
    else:
        loops = ([(t0, -chamfer), (t0 + chamfer, 0.0), (t1 - chamfer, 0.0), (t1, -chamfer)]
                 if chamfer else [(t0, 0.0), (t1, 0.0)])
    place = (lambda a, b, t: (a, t, b)) if axis == "Y" else (lambda a, b, t: (a, b, t))
    radius = uv_radius or max(math.hypot(a, b) for a, b in outline)

    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rings = []
    for t, d in loops:
        pts = offset_outline(outline, d) if d else outline
        rings.append([bm.verts.new(Vector(place(a, b, t)) * MM) for a, b in pts])
    n, faces = len(outline), []
    for ra, rb in zip(rings, rings[1:]):
        faces += [bm.faces.new((ra[i], ra[(i + 1) % n], rb[(i + 1) % n], rb[i])) for i in range(n)]
    faces += [bm.faces.new(rings[0]), bm.faces.new(rings[-1])]
    for face in faces:   # planar UVs centred on the part, for the faced-steel texture
        for loop in face.loops:
            co = loop.vert.co / MM
            a, b = (co.x, co.z) if axis == "Y" else (co.x, co.y)
            loop[uv].uv = (0.5 + a / (2 * radius), 0.5 + b / (2 * radius))
    return kit.mesh_object(name, bm, c)


def turned(name, profile, c, segments=64, closed=True):
    """Revolve an (r, y) profile in mm around the gearbox axis (world Y)."""
    obj = kit.lathe(name, [(r, -y) for r, y in profile], c, segments, closed)
    obj.data.transform(AXIAL)
    return obj


def box(name, lo, hi, c, chamfer=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector(((lo[i] + (hi[i] - lo[i]) * (v.co[i] + 0.5)) * MM for i in range(3)))
    if chamfer:
        bmesh.ops.bevel(bm, geom=list(bm.verts) + list(bm.edges), offset=chamfer * MM,
                        segments=1, affect="EDGES", profile=0.5)
    return kit.mesh_object(name, bm, c)


def axial_cylinder(name, x, z, r, y0, y1, c, segments=24):
    return kit.cylinder(name, r, y1 - y0, segments, c,
                        Matrix.Translation((x * MM, (y0 + y1) / 2 * MM, z * MM)) @ AXIAL)


def radial_cylinder(name, angle_deg, y, r, rho0, rho1, c, segments=32):
    a = math.radians(angle_deg)
    direction = Vector((math.cos(a), 0.0, math.sin(a)))
    centre = direction * (rho0 + rho1) / 2 + Vector((0, y, 0))
    rotation = Vector((0, 0, 1)).rotation_difference(direction).to_matrix().to_4x4()
    return kit.cylinder(name, r, rho1 - rho0, segments, c, Matrix.Translation(centre * MM) @ rotation)


def vertical_cylinder(name, x, y, r, z0, z1, c, segments=32):
    return kit.cylinder(name, r, z1 - z0, segments, c, Matrix.Translation((x * MM, y * MM, (z0 + z1) / 2 * MM)))


def merge(name, objects, c, material=None):
    """Join several objects into one mesh (used to make one boolean operand)."""
    bm = bmesh.new()
    for obj in objects:
        me = obj.data.copy()
        me.transform(obj.matrix_world)
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
        bpy.data.objects.remove(obj, do_unlink=True)
    merged = kit.mesh_object(name, bm, c)
    if material:
        merged.data.materials.append(material)
    return merged


def assign(obj, *materials):
    obj.data.materials.clear()
    for mat in materials:
        obj.data.materials.append(mat)
    return obj


def paint(obj, index, predicate):
    """Set material `index` on faces whose centre (mm) and normal pass `predicate`."""
    for poly in obj.data.polygons:
        centre = obj.matrix_world @ poly.center / MM
        if predicate(centre, poly.normal):
            poly.material_index = index


def radial(p):
    return math.hypot(p.x, p.z)


def cut_away(obj, section):
    """Remove the +X/+Z quadrant; the new faces take the Section material."""
    cutter = box("Cutaway", (0.0, -200.0, 0.0), (200.0, 200.0, 200.0), obj.users_collection[0])
    cutter.data.materials.append(section)
    kit.boolean(obj, cutter, "DIFFERENCE", transfer=True)


def finish(obj, angle=30.0):
    kit.shade_by_angle(obj, angle)
    return obj


def mesh_copy(name, source, c, location=(0, 0, 0), matrix=None):
    """Another object using the same mesh, so the GLB stores the geometry once."""
    obj = kit.link(bpy.data.objects.new(name, source.data), c)
    obj.matrix_world = matrix if matrix is not None else Matrix.Translation(Vector(location) * MM)
    return obj


# ---------------------------------------------------------------- materials


def faced_roughness(size=512, seed=11):
    """Concentric facing marks: roughness varies with distance from the UV centre."""
    import numpy as np

    rng = np.random.default_rng(seed)
    rings = 0.24 + 0.06 * np.convolve(rng.standard_normal(size + 12), np.ones(13) / 13, "valid")[:size]
    yy, xx = np.mgrid[0:size, 0:size]
    rho = np.clip(np.hypot(xx - size / 2 + 0.5, yy - size / 2 + 0.5).astype(int), 0, size - 1)
    pixels = np.ones((size, size, 4), dtype=np.float32)
    pixels[..., 1] = np.clip(rings[rho] + 0.02 * rng.standard_normal((size, size)), 0.14, 0.42)
    return kit.packed_image("Faced_MR", pixels, size)


def make_materials():
    m = {}
    m["coat"] = kit.principled("Housing_GreenCoat", "#24543A", 0.0, 0.40, coat=0.25, coat_roughness=0.24)[0]
    m["machined"] = kit.principled("Machined_Aluminium", "#bcc1be", 1.0, 0.34)[0]
    m["section"] = kit.principled("Section_Cut", "#dfe3dc", 0.75, 0.52)[0]
    mat, bsdf = kit.principled("Steel_Satin_Turned", "#c8cccf", 1.0, 0.26)
    m["steel"] = kit.roughness_map(mat, bsdf, kit.turned_roughness("Turned_MR", 0.24, 0.06, 0.14, 0.42))
    mat, bsdf = kit.principled("Steel_Satin_Faced", "#c8cccf", 1.0, 0.26)
    m["faced"] = kit.roughness_map(mat, bsdf, faced_roughness())
    m["polished"] = kit.principled("Steel_Polished", "#d9dcde", 1.0, 0.1)[0]
    m["dark"] = kit.principled("Steel_BlackOxide", "#3b4044", 0.9, 0.36)[0]
    m["brass"] = kit.principled("Brass_Satin", "#c79b52", 1.0, 0.3)[0]
    m["rubber"] = kit.principled("Seal_Rubber", "#17191a", 0.0, 0.6)[0]
    m["glass"] = kit.principled("SightGlass_Smoked", "#0d1513", 0.0, 0.04)[0]
    return m


# ---------------------------------------------------------------- gear phases and checks


def centred_fraction(x):
    return x - round(x)


def mesh_phases():
    """Tooth phases (radians) that let the sun, all planets and the ring mesh."""
    S, P, R = SUN_TEETH, PLANET_TEETH, RING_TEETH
    sun_phase, planets, ring_phases = 0.0, [], []
    for theta in PLANET_THETAS:
        # Rotate from "sun tooth on the centre line, planet space facing it" by however
        # far the sun's nearest tooth sits from the centre line.
        f = centred_fraction((theta - sun_phase) * S / (2 * math.pi))
        planet_phase = theta + math.pi - math.pi / P + f * 2 * math.pi / P
        # The planet tooth nearest the ring sets the ring's space position the same way.
        g = centred_fraction((theta - planet_phase) * P / (2 * math.pi))
        ring_phases.append(theta - g * 2 * math.pi / R)
        planets.append((theta, planet_phase))
    pitch = 2 * math.pi / R
    spread = max(abs(centred_fraction((p - ring_phases[0]) / pitch)) for p in ring_phases)
    assert spread < 1e-6, f"planets disagree on the ring phase ({spread:.3g} pitch)"
    return sun_phase, planets, ring_phases[0]


def train(alpha):
    """Carrier angle and planet spin (relative to the carrier) for sun angle alpha, ring fixed."""
    S, P, R = SUN_TEETH, PLANET_TEETH, RING_TEETH
    beta = alpha * S / (S + R)
    return beta, -(alpha - beta) * S / P


def rotate(pts, angle, centre=(0.0, 0.0)):
    c, s = math.cos(angle), math.sin(angle)
    return [(centre[0] + x * c - z * s, centre[1] + x * s + z * c) for x, z in pts]


def inside(px, pz, poly):
    hit, n = False, len(poly)
    for i in range(n):
        (x0, z0), (x1, z1) = poly[i - 1], poly[i]
        if (z0 > pz) != (z1 > pz) and px < x0 + (pz - z0) * (x1 - x0) / (z1 - z0):
            hit = not hit
    return hit


def seg_distance(px, pz, a, b):
    (x0, z0), (x1, z1) = a, b
    dx, dz = x1 - x0, z1 - z0
    t = max(0.0, min(1.0, ((px - x0) * dx + (pz - z0) * dz) / ((dx * dx + dz * dz) or 1e-12)))
    return math.hypot(px - x0 - dx * t, pz - z0 - dz * t)


def clearance(points, poly, centre, radius):
    """Smallest distance from `points` to the edges of `poly` that lie near `centre`."""
    edges = [(poly[i - 1], poly[i]) for i in range(len(poly))
             if math.hypot(poly[i][0] - centre[0], poly[i][1] - centre[1]) < radius]
    return min(seg_distance(px, pz, a, b) for px, pz in points for a, b in edges)


def check_meshes(sun, planet, ring_space, phases, steps=12):
    """Interference and clearance over 1/5 of an input turn (the pattern then repeats)."""
    sun_phase, planets, _ = phases
    worst = {"sun_planet": 1e9, "planet_ring": 1e9}
    for step in range(steps):
        alpha = 2 * math.pi / 5 * step / steps
        beta, spin = train(alpha)
        sun_now = rotate(sun, sun_phase + alpha)
        for theta, planet_phase in planets:
            centre = polar(CENTRE_DISTANCE, theta + beta)
            gear = rotate(planet, planet_phase + beta + spin, centre)
            near_sun = [p for p in gear if math.hypot(*p) < SUN_TIP + 0.5]
            near_ring = [p for p in gear if math.hypot(*p) > RING_TIP - 0.5]
            sun_near = [p for p in sun_now if math.hypot(p[0] - centre[0], p[1] - centre[1]) < PLANET_TIP + 0.5]
            assert not any(inside(*p, sun_now) for p in near_sun), f"planet cuts the sun at α={alpha:.3f}"
            assert not any(inside(*p, gear) for p in sun_near), f"sun cuts a planet at α={alpha:.3f}"
            assert all(inside(*p, ring_space) for p in near_ring), f"planet cuts the ring at α={alpha:.3f}"
            ring_near = [p for p in ring_space if math.hypot(p[0] - centre[0], p[1] - centre[1]) < PLANET_TIP]
            assert not any(inside(*p, gear) for p in ring_near), f"ring cuts a planet at α={alpha:.3f}"
            worst["sun_planet"] = min(worst["sun_planet"], clearance(near_sun, sun_now, centre, PLANET_TIP + 1))
            worst["planet_ring"] = min(worst["planet_ring"], clearance(near_ring, ring_space, centre, PLANET_TIP + 1))
    # Teeth must clear each other, but only by about the backlash: proof the phases are right.
    for name, gap in worst.items():
        assert 0 < gap < BACKLASH, f"{name} clearance {gap:.3f} mm"
    return {k: round(v, 4) for k, v in worst.items()}


def check_fits():
    """Shafts, bores and fasteners that must fit, as (what, hole radius, part radius)."""
    fits = [
        ("output bearing on shaft", OUTPUT_BEARING["d"] / 2 + 0.02, 10.0),
        ("output bearing in cover", 21.0, OUTPUT_BEARING["D"] / 2),
        ("input bearing on shaft", INPUT_BEARING["d"] / 2 + 0.02, 7.5),
        ("input bearing in rear cap", 17.5, INPUT_BEARING["D"] / 2),
        ("sun on input shaft", 6.02, 6.0),
        ("planet on pin", 5.08, 5.0),
        ("ring gear in housing", 62.0, 61.95),
        ("cover spigot in housing", 62.0, 61.9),
        ("rear cap spigot in housing", 56.0, 55.9),
        ("M5 screw in cover", 2.75, 2.5),
        ("output flange in cover opening", 17.0, 13.0),
        ("carrier arm inside ring teeth", RING_TIP, CENTRE_DISTANCE + 12.0),
        ("planet tips inside ring root", RING_ROOT, CENTRE_DISTANCE + PLANET_TIP),
    ]
    for what, hole, part in fits:
        assert hole >= part, f"{what}: {hole} < {part}"
    neighbours = 2 * CENTRE_DISTANCE * math.sin(math.pi / PLANETS)
    assert neighbours > 2 * PLANET_TIP, "planets touch each other"
    return {"fits_checked": len(fits), "planet_tip_gap_mm": round(neighbours - 2 * PLANET_TIP, 2)}


# ---------------------------------------------------------------- parts

HOUSING_PROFILE = (
    [(0.0, -30.0), (70.8, -30.0), (72.0, -28.8), (72.0, -23.2), (70.8, -22.0), (69.0, -22.0)]
    + kit.arc(69.0, -19.0, 3.0, 270, 180, 5)[1:]           # fillet into the shell
    + kit.arc(69.0, 5.0, 3.0, 180, 90, 5)                  # and out to the rear flange
    + [(70.8, 8.0), (72.0, 9.2), (72.0, 14.8), (70.8, 16.0), (0.0, 16.0)]
)
CAVITY_PROFILE = [
    (0.0, -31.0), (64.0, -31.0), (62.0, -29.0),                      # bore entry chamfer
    (62.0, -9.45), (63.6, -9.45), (63.6, -8.15), (62.0, -8.15),      # ring-gear circlip groove
    (62.0, 8.0), (56.0, 8.0),                                        # shoulder behind the ring
    (56.0, 15.0), (58.0, 17.0), (0.0, 17.0),
]
COVER_PROFILE = (
    [(20.0, -55.0), (28.5, -55.0), (30.0, -53.5), (30.0, -41.0)]
    + kit.arc(32.0, -41.0, 2.0, 180, 90, 4)[1:]
    + [(33.0, -39.0), (34.0, -38.0), (59.0, -38.0), (60.0, -39.0),  # recessed panel
       (70.8, -39.0), (72.0, -37.8), (72.0, -30.6), (71.4, -30.0),
       (61.9, -30.0), (61.9, -25.5), (61.4, -25.0), (54.5, -25.0), (54.0, -25.5), (54.0, -30.0),
       (17.6, -30.0), (17.0, -30.6), (17.0, -37.0),
       (21.0, -37.0), (21.0, -49.05), (22.6, -49.05), (22.6, -50.45), (19.0, -50.45), (19.0, -54.0)]
)
REAR_CAP_PROFILE = (
    [(12.0, 16.0), (48.0, 16.0), (48.0, 12.5), (48.5, 12.0), (55.4, 12.0), (55.9, 12.5), (55.9, 16.0),
     (71.4, 16.0), (72.0, 16.6), (72.0, 23.8), (70.8, 25.0), (28.0, 25.0)]
    + kit.arc(28.0, 27.0, 2.0, 270, 180, 4)[1:]
    + [(26.0, 42.8), (24.8, 44.0), (17.0, 44.0), (16.0, 43.0),
       (16.0, 39.45), (19.0, 39.45), (19.0, 38.05), (17.5, 38.05), (17.5, 27.0), (12.0, 27.0)]
)
OUTPUT_SHAFT_PROFILE = [
    (0.0, -83.0), (1.6, -85.0), (7.2, -85.0), (8.0, -84.2),         # centre hole and end chamfer
    (8.0, -51.5), (9.6, -51.5), (10.0, -51.1),
    (10.0, -50.3), (9.3, -50.3), (9.3, -49.2), (10.0, -49.2),       # circlip groove
    (10.0, -30.0), (12.6, -30.0), (13.0, -29.6), (13.0, -23.5),     # collar
    (21.4, -23.5), (22.0, -22.9), (22.0, -19.1), (21.4, -18.5), (0.0, -18.5),   # flange
]
INPUT_SHAFT_PROFILE = [
    (0.0, -10.0), (5.4, -10.0), (6.0, -9.4),
    (6.0, -8.2), (5.5, -8.2), (5.5, -7.2), (6.0, -7.2),             # sun circlip groove
    (6.0, 7.0), (8.6, 7.0), (9.0, 7.4), (9.0, 11.6), (8.6, 12.0),   # collar
    (7.5, 12.0), (7.5, 38.2), (7.0, 38.2), (7.0, 39.2), (7.5, 39.2),
    (7.5, 44.1), (7.1, 44.5), (6.0, 44.5), (6.0, 75.4), (5.4, 76.0), (1.6, 76.0), (0.0, 74.0),
]
PIN_PROFILE = [(0.0, -19.1), (4.6, -19.1), (5.0, -18.7), (5.0, 8.6), (4.0, 8.6), (4.0, 9.7),
               (5.0, 9.7), (5.0, 10.6), (4.6, 11.0), (0.0, 11.0)]


def ring_profile(r0, r1, y0, y1, c=0.3):
    return [(r0, y0 + c), (r0 + c, y0), (r1 - c, y0), (r1, y0 + c), (r1, y1 - c), (r1 - c, y1), (r0 + c, y1), (r0, y1 - c)]


def seal_profile(r_shaft, r_bore, y_out, y_in):
    s = 1 if y_in > y_out else -1
    return [(r_bore, y_out), (r_bore, y_in), (r_bore - 1.3, y_in), (r_bore - 1.3, y_out + s * 1.0),
            (r_shaft + 2.2, y_out + s * 1.0), (r_shaft + 0.05, y_in - s * 0.5),
            (r_shaft + 0.05, y_in - s * 1.4), (r_shaft + 1.6, y_out)]


def build_housing(c, m):
    body = assign(turned("Housing", HOUSING_PROFILE, c, 96, closed=False), m["coat"], m["machined"])
    # Mating faces against the covers are machined bare.
    paint(body, 1, lambda p, n: abs(n.y) > 0.99 and (abs(p.y - HOUSING_FRONT) < 0.01 or abs(p.y - HOUSING_REAR) < 0.01))

    adds = [
        box("Pedestal", (-44, -29, -83.5), (44, 15, -40), c, 1.5),
        box("BasePlate", (-94, -29.5, -84), (94, 15.5, -72), c, 1.5),
        radial_cylinder("BreatherBoss", 120, -7, 8, 58, 73, c, 32),
        radial_cylinder("SightBoss", 180, -7, 12, 58, 71, c, 48),
    ]
    for side in (1, -1):
        gusset = [(43, -72.5), (68, -72.5), (68, -70.8), (43, -49.5)]
        adds.append(kit.extrude_xz("Gusset", [(side * x, z) for x, z in gusset], -10, -4, c))
    for angle in (135, 225, 315):
        rib = kit.extrude_xz("Rib", [(60, -4), (70.2, -4), (71, -3.2), (71, 3.2), (70.2, 4), (60, 4)], -22.5, 8.5, c)
        rib.data.transform(Matrix.Rotation(math.radians(-angle), 4, "Y"))
        adds.append(rib)
    kit.boolean(body, merge("HousingAdds", adds, c, m["coat"]), "UNION", self_intersect=True)

    machined = [turned("Cavity", CAVITY_PROFILE, c, 96, closed=False)]
    for a in BOLT_ANGLES:
        x, z = polar(BOLT_CIRCLE, math.radians(a))
        machined.append(axial_cylinder("Tap", x, z, 2.1, -31, -22.5, c))
        machined.append(axial_cylinder("Tap", x, z, 2.1, 8.5, 17, c))
    machined += [
        # Lettering cut through the coat on the right foot's end face, square to the opening view.
        engraving("OTHS CAD", 6.0, (94.0, -7.0, -78.0), (0, 1, 0), (0, 0, 1), 0.4, c, m["machined"]),
        radial_cylinder("BreatherTap", 120, -7, 4.0, 64, 75, c, 24),
        radial_cylinder("SightRecess", 180, -7, 9.5, 68, 72, c, 48),
    ]
    for x in (-78, 78):
        for y in (-20.5, 6.5):
            machined.append(vertical_cylinder("FootHole", x, y, 5.5, -90, -66, c))
            machined.append(vertical_cylinder("Counterbore", x, y, 8.0, -78, -66, c, 40))
    kit.boolean(body, merge("HousingMachining", machined, c, m["machined"]), "DIFFERENCE", transfer=True, self_intersect=True)

    # Shallow relief under the base, so it stands on its two feet.
    kit.boolean(body, assign(box("UnderRelief", (-56, -25.5, -86), (56, 11.5, -82), c), m["coat"]), "DIFFERENCE", transfer=True)
    cut_away(body, m["section"])
    return finish(body)


def engraving(text, size, centre, right, up, depth, c, material):
    """Text cutter on a flat face: `centre` (mm) lies on the face, the text reads along
    `right` with its letters along `up`, and it sinks `depth` mm into the material."""
    curve = bpy.data.curves.new("Engraving", "FONT")
    curve.body = text
    curve.size = size * MM
    curve.space_character = 1.18
    curve.align_x, curve.align_y = "CENTER", "CENTER"
    curve.extrude = 1.0 * MM
    curve.resolution_u = 4
    obj = kit.link(bpy.data.objects.new("Engraving", curve), c)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.curves.remove(curve)
    u, v = Vector(right), Vector(up)
    n = u.cross(v)   # outward face normal
    basis = Matrix((u, v, n)).transposed().to_4x4()
    # The text is 2 mm thick around its own plane; shift it so only `depth` is inside.
    mesh.transform(Matrix.Translation((Vector(centre) + n * (1.0 - depth)) * MM) @ basis)
    cutter = kit.link(bpy.data.objects.new("Engraving", mesh), c)
    cutter.data.materials.append(material)
    return cutter


def build_front_cover(c, m):
    cover = assign(turned("FrontCover", COVER_PROFILE, c, 96), m["coat"], m["machined"])
    paint(cover, 1, lambda p, n: radial(p) < 23
          or abs(p.y + 55) < 0.01                                   # turned boss face
          or (abs(p.y - HOUSING_FRONT) < 0.01 and radial(p) > 54)   # mating face
          or (54 <= radial(p) <= 62 and p.y > HOUSING_FRONT - 0.01))  # spigot
    holes = [axial_cylinder("Clearance", *polar(BOLT_CIRCLE, math.radians(a)), 2.75, -40, -29, c) for a in BOLT_ANGLES]
    kit.boolean(cover, merge("CoverMachining", holes, c, m["machined"]), "DIFFERENCE", transfer=True, self_intersect=True)
    cut_away(cover, m["section"])
    return finish(cover)


def build_rear_cap(c, m):
    cap = assign(turned("RearCap", REAR_CAP_PROFILE, c, 96), m["coat"], m["machined"])
    paint(cap, 1, lambda p, n: radial(p) < 20
          or abs(p.y - 44) < 0.01
          or (abs(p.y - HOUSING_REAR) < 0.01 and radial(p) > 55)
          or (48 <= radial(p) <= 56 and p.y < HOUSING_REAR + 0.01))
    ribs = []
    for angle in (135, 225, 315):
        side = [(24.0, 24.5), (60.0, 24.5), (60.0, 26.6), (58.8, 27.6), (27.0, 39.0), (24.0, 39.0)]
        bm = bmesh.new()
        lo = [bm.verts.new((r * MM, y * MM, -3 * MM)) for r, y in side]
        hi = [bm.verts.new((r * MM, y * MM, 3 * MM)) for r, y in side]
        for i in range(len(side)):
            j = (i + 1) % len(side)
            bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
        bm.faces.new(lo)
        bm.faces.new(hi)
        rib = kit.mesh_object("CapRib", bm, c)
        rib.data.transform(Matrix.Rotation(math.radians(-angle), 4, "Y"))
        ribs.append(rib)
    kit.boolean(cap, merge("CapRibs", ribs, c, m["coat"]), "UNION", self_intersect=True)
    holes = [axial_cylinder("Clearance", *polar(BOLT_CIRCLE, math.radians(a)), 2.75, 15, 26, c) for a in BOLT_ANGLES]
    kit.boolean(cap, merge("CapMachining", holes, c, m["machined"]), "DIFFERENCE", transfer=True)
    cut_away(cap, m["section"])
    return finish(cap)


def build_ring_gear(c, m, ring_space):
    blank = extrude("RingGear", circle(61.95, 96), -RING_FACE / 2, RING_FACE / 2, c, chamfer=0.6)
    teeth = extrude("RingTeeth", ring_space, -RING_FACE / 2, RING_FACE / 2, c, chamfer=GEAR_CHAMFER,
                    cutter=True, flare=0.25)
    kit.boolean(blank, teeth, "DIFFERENCE")
    assign(blank, m["faced"])
    cut_away(blank, m["section"])
    return finish(blank)


def build_gear(name, outline, bore, c, m):
    gear = extrude(name, outline, -GEAR_FACE / 2, GEAR_FACE / 2, c, chamfer=GEAR_CHAMFER)
    kit.boolean(gear, extrude("Bore", circle(bore, 48), -GEAR_FACE / 2, GEAR_FACE / 2, c, chamfer=0.4, cutter=True), "DIFFERENCE")
    return finish(assign(gear, m["faced"]))


def build_carrier(c, m):
    carrier = extrude("Carrier", carrier_outline(), -18.5, -8.5, c, chamfer=0.6)
    holes = [extrude("Bore", circle(10.5, 48), -18.5, -8.5, c, chamfer=0.6, cutter=True)]
    holes += [extrude("PinHole", circle(5.0, 32, 0), -18.5, -8.5, c, chamfer=0.4, cutter=True) for _ in PLANET_THETAS]
    for hole, theta in zip(holes[1:], PLANET_THETAS):
        x, z = polar(CENTRE_DISTANCE, theta)
        hole.data.transform(Matrix.Translation((x * MM, 0, z * MM)))
    kit.boolean(carrier, merge("CarrierHoles", holes, c), "DIFFERENCE")
    return finish(assign(carrier, m["faced"]))


def build_shaft(name, profile, keyway, c, m):
    """keyway: (width, y0, y1, depth, shaft radius) cut into the top of the exposed end."""
    shaft = assign(turned(name, profile, c, 48, closed=False), m["steel"])
    width, y0, y1, depth, top = keyway
    slot = extrude("Keyway", stadium(width, y0, y1), top - depth, top + 4, c, axis="Z")
    kit.boolean(shaft, slot, "DIFFERENCE")
    return finish(shaft)


def build_key(name, keyway, c, m):
    width, y0, y1, depth, top = keyway
    key = extrude(name, stadium(width - 0.02, y0 + 0.1, y1 - 0.1), top - depth, top - depth + width, c,
                  axis="Z", chamfer=0.3)
    return finish(assign(key, m["dark"]))


def build_screw(name, d, length, head_d, head_h, socket, c, m, segments=20):
    """ISO 4762 socket head cap screw along local +Z; z = 0 is under the head."""
    profile = [(0, -length), (d / 2 - 0.4, -length), (d / 2, -length + 0.4), (d / 2, -0.3), (d / 2 + 0.3, 0.0),
               (head_d / 2 - 0.35, 0.0), (head_d / 2, 0.35), (head_d / 2, head_h - 0.45),
               (head_d / 2 - 0.45, head_h), (0, head_h)]
    screw = kit.lathe(name, profile, c, segments)
    depth = socket * 0.62
    r_hex = socket / 2 / math.cos(math.radians(30))
    hexagon = kit.cylinder("Socket", r_hex, depth * 2, 6, c, Matrix.Translation((0, 0, head_h * MM)))
    kit.boolean(screw, hexagon, "DIFFERENCE")
    point = kit.lathe("DrillPoint", [(0, head_h - depth - socket * 0.3), (socket / 2 - 0.05, head_h - depth),
                                     (socket / 2 - 0.05, head_h - depth + 0.4), (0, head_h - depth + 0.4)], c, 24)
    kit.boolean(screw, point, "DIFFERENCE")
    mouth = kit.lathe("Countersink", [(0, head_h - 0.6), (socket / 2 + 0.05, head_h - 0.35),
                                      (r_hex + 1.2, head_h + 1.0), (0, head_h + 1.0)], c, 24)
    kit.boolean(screw, mouth, "DIFFERENCE")
    return finish(assign(screw, m["dark"]), 35)


def build_bearing(prefix, spec, c, m, cut_section):
    d, D, B, y, ball, count = (spec[k] for k in ("d", "D", "B", "y", "ball", "balls"))
    pitch = (d + D) / 4
    r_inner, r_outer, groove = pitch - 0.36 * ball, pitch + 0.36 * ball, 0.52 * ball
    y0, y1 = y - B / 2, y + B / 2
    t_in = math.acos((pitch - r_inner) / groove)
    t_out = math.acos((r_outer - pitch) / groove)
    arc_in = [(pitch - groove * math.cos(t), y + groove * math.sin(t)) for t in (-t_in + 2 * t_in * i / 8 for i in range(9))]
    arc_out = [(pitch + groove * math.cos(t), y - groove * math.sin(t)) for t in (-t_out + 2 * t_out * i / 8 for i in range(9))]

    inner = [(d / 2 + 0.02, y0 + 0.5), (d / 2 + 0.52, y0), (r_inner - 0.3, y0), (r_inner, y0 + 0.3)]
    inner += arc_in + [(r_inner, y1 - 0.3), (r_inner - 0.3, y1), (d / 2 + 0.52, y1), (d / 2 + 0.02, y1 - 0.5)]
    inner_race = finish(assign(turned(f"{prefix}_Inner", inner, c, 48), m["steel"]))

    outer = [(D / 2, y1 - 0.5), (D / 2 - 0.5, y1), (r_outer + 0.3, y1), (r_outer, y1 - 0.3)]
    outer += arc_out + [(r_outer, y0 + 0.3), (r_outer + 0.3, y0), (D / 2 - 0.5, y0), (D / 2, y0 + 0.5)]
    race = turned(f"{prefix}_Outer", outer, c, 48)
    shields = [turned("Shield", ring_profile(r_inner + 0.35, r_outer - 0.02, y0 + 0.35, y0 + 0.75, 0.1), c, 48),
               turned("Shield", ring_profile(r_inner + 0.35, r_outer - 0.02, y1 - 0.75, y1 - 0.35, 0.1), c, 48)]
    shield = merge("Shields", shields, c)
    for poly in shield.data.polygons:
        poly.material_index = 1
    race = assign(merge(f"{prefix}_Outer", [race, shield], c), m["steel"], m["dark"])   # shields keep index 1
    if cut_section:
        cut_away(race, m["section"])
    finish(race)

    bm = bmesh.new()
    for k in range(count):
        x, z = polar(pitch, 2 * math.pi * k / count)
        bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=ball / 2 * MM,
                                  matrix=Matrix.Translation((x * MM, y * MM, z * MM)))
    balls = assign(kit.mesh_object(f"{prefix}_Balls", bm, c), m["polished"])
    for poly in balls.data.polygons:
        poly.use_smooth = True
    cage_factor = (1 - ball / (2 * pitch)) / 2   # ball set speed with the outer race fixed
    return inner_race, race, balls, cage_factor


def build_ring_clip(name, r_in, r_out, thickness, y, internal, phase, c, m, lug=1.4, holes=True, cut=False):
    outline = retaining_ring_outline(r_in, r_out, internal, phase, lug=lug)
    clip = extrude(name, outline, y - thickness / 2, y + thickness / 2, c)
    if holes:
        cutters = []
        for sign in (1, -1):
            a = math.radians(phase + sign * (14 + 6))
            width = (r_out - r_in) * 0.7 + lug
            r = r_out - width / 2 if internal else r_in + width / 2
            x, z = polar(r, a)
            cutters.append(axial_cylinder("LugHole", x, z, min(0.8, width * 0.2), y - 2, y + 2, c, 12))
        kit.boolean(clip, merge("LugHoles", cutters, c), "DIFFERENCE")
    assign(clip, m["dark"])
    if cut:
        cut_away(clip, m["section"])
    return finish(clip, 40)


def build_breather(c, m):
    hex_body = kit.lathe("Hex", [(0, 0), (7.2, 0), (7.6, 0.4), (7.6, 3.6), (7.2, 4.0), (0, 4.0)], c, 6)
    dome = kit.lathe("Dome", [(0, 3.9), (5.2, 3.9)] + [(5.2 * math.cos(t), 6.5 + 3.5 * math.sin(t))
                                                      for t in (math.pi / 2 * i / 6 for i in range(7))], c, 32)
    obj = merge("Breather", [hex_body, dome], c)
    a = math.radians(120)
    direction = Vector((math.cos(a), 0, math.sin(a)))
    rotation = Vector((0, 0, 1)).rotation_difference(direction).to_matrix().to_4x4()
    obj.data.transform(Matrix.Translation((direction * 73 + Vector((0, -7, 0))) * MM) @ rotation)
    return finish(assign(obj, m["brass"]), 40)


def build_sight_glass(c, m):
    rotation = Vector((0, 0, 1)).rotation_difference(Vector((-1, 0, 0))).to_matrix().to_4x4()
    at = lambda rho: Matrix.Translation((-rho * MM, -7 * MM, 0)) @ rotation   # noqa: E731
    bezel = kit.lathe("SightGlass_Bezel", [(8.0, 0.0), (12.5, 0.0), (12.5, 1.8), (11.8, 2.5), (8.7, 2.5), (8.0, 1.8)], c, 48, closed=True)
    bezel.data.transform(at(71))
    lens = kit.lathe("SightGlass_Lens", [(0, -0.8), (9.4, -0.8), (9.4, 0.8), (0, 0.8)], c, 48)
    lens.data.transform(at(70.1))
    return finish(assign(bezel, m["brass"])), finish(assign(lens, m["glass"]))


# ---------------------------------------------------------------- assembly


def set_explode(obj, key):
    axis, distance, order = EXPLODE[key]
    obj["explode_axis"] = axis
    obj["explode_distance"] = round(distance * MM, 6)
    obj["explode_order"] = order


def empty(name, c, parent=None):
    obj = kit.link(bpy.data.objects.new(name, None), c)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.02
    obj.parent = parent
    return obj


def parent(children, to):
    for child in children:
        world = child.matrix_world.copy()
        child.parent = to
        child.matrix_world = world


def build_assembly(c, m):
    phases = mesh_phases()
    sun_phase, planets, ring_phase = phases
    half = math.pi * MODULE / 4
    sun_outline = tooth_outline(SUN_TEETH, half - BACKLASH / 4, SUN_TIP, SUN_ROOT)
    planet_outline = tooth_outline(PLANET_TEETH, half - BACKLASH / 4, PLANET_TIP, PLANET_ROOT)
    ring_space = tooth_outline(RING_TEETH, half + BACKLASH / 4, RING_ROOT, RING_TIP, phase=ring_phase)
    report = {"mesh_check": check_meshes(sun_outline, planet_outline, ring_space, phases), **check_fits()}

    root = empty("Gearbox", c)
    root["sun_teeth"], root["planet_teeth"], root["ring_teeth"] = SUN_TEETH, PLANET_TEETH, RING_TEETH
    root["planet_count"], root["module_mm"], root["ratio"] = PLANETS, MODULE, RATIO
    parts = {}

    # Stationary housing and its covers.
    parts["Housing"] = build_housing(c, m)
    parts["RingGear"] = build_ring_gear(c, m, ring_space)
    parts["RingCirclip"] = build_ring_clip("RingCirclip", 59.0, 63.5, 1.2, -8.8, True, 225, c, m, lug=1.8, cut=True)
    parts["FrontCover"] = build_front_cover(c, m)
    parts["RearCap"] = build_rear_cap(c, m)
    front_seal = assign(turned("FrontSeal", seal_profile(8.0, 19.0, -55.0, -51.6), c, 48), m["rubber"])
    rear_seal = assign(turned("RearSeal", seal_profile(7.5, 16.0, 44.0, 39.6), c, 48), m["rubber"])
    for seal in (front_seal, rear_seal):
        cut_away(seal, m["section"])
        finish(seal)
    parts["Breather"] = build_breather(c, m)
    parts["SightGlass_Bezel"], parts["SightGlass_Lens"] = build_sight_glass(c, m)

    m5 = build_screw("SHCS_M5x16", 5.0, 16.0, 8.5, 5.0, 4.0, c, m)
    m4 = build_screw("SHCS_M4x10", 4.0, 10.0, 7.0, 4.0, 3.0, c, m)
    cover_bolts, rear_bolts = [], []
    for i, a in enumerate(BOLT_ANGLES, start=1):
        x, z = polar(BOLT_CIRCLE, math.radians(a))
        cover_bolts.append(mesh_copy(f"CoverBolt_{i:02d}", m5, c, matrix=Matrix.Translation((x * MM, -39 * MM, z * MM)) @ AXIAL))
        rear_bolts.append(mesh_copy(f"RearBolt_{i:02d}", m5, c, matrix=Matrix.Translation((x * MM, 25 * MM, z * MM)) @ AXIAL.inverted()))
    bpy.data.objects.remove(m5, do_unlink=True)

    # Bearings: outer races are cut with the housing; the ball sets turn at cage speed.
    out_inner, out_outer, out_balls, out_cage = build_bearing("OutputBearing", OUTPUT_BEARING, c, m, True)
    in_inner, in_outer, in_balls, in_cage = build_bearing("InputBearing", INPUT_BEARING, c, m, True)
    out_bore_clip = build_ring_clip("OutputBearing_Circlip", 19.6, 22.55, 1.2, -49.75, True, 210, c, m, cut=True)
    in_bore_clip = build_ring_clip("InputBearing_Circlip", 16.4, 18.95, 1.2, 38.75, True, 210, c, m, cut=True)
    out_shaft_clip = build_ring_clip("OutputShaftCirclip", 9.35, 11.6, 1.0, -49.75, False, 300, c, m)
    in_shaft_clip = build_ring_clip("InputShaftCirclip", 7.05, 8.9, 1.0, 38.7, False, 300, c, m, lug=1.2)

    # Input: shaft, sun, retaining ring, spacer and key turn together.
    input_keyway = (4.0, 52.0, 72.0, 2.5, 6.0)
    input_parts = [
        build_shaft("InputShaft", INPUT_SHAFT_PROFILE, input_keyway, c, m),
        build_gear("SunGear", sun_outline, 6.02, c, m),
        build_ring_clip("SunCirclip", 5.55, 7.3, 1.0, -7.7, False, 120, c, m, lug=1.2),
        finish(assign(turned("InputSpacer", ring_profile(7.55, 10.0, 12.05, 26.95), c, 32), m["steel"])),
        build_key("InputKey", input_keyway, c, m),
    ]
    input_parts[1].rotation_euler.y = -sun_phase

    # Carrier: output shaft, planet pins, planets, thrust washers and pin clips.
    output_keyway = (5.0, -82.0, -60.0, 3.0, 8.0)
    carrier_parts = [
        build_carrier(c, m),
        build_shaft("OutputShaft", OUTPUT_SHAFT_PROFILE, output_keyway, c, m),
        finish(assign(turned("OutputSpacer", ring_profile(10.05, 13.0, -36.95, -30.05), c, 32), m["steel"])),
        build_key("OutputKey", output_keyway, c, m),
    ]
    for i, a in enumerate(FLANGE_SCREW_ANGLES, start=1):
        x, z = polar(FLANGE_SCREW_CIRCLE, math.radians(a))
        carrier_parts.append(mesh_copy(f"FlangeScrew_{i:02d}", m4, c, matrix=Matrix.Translation((x * MM, -23.5 * MM, z * MM)) @ AXIAL))
    bpy.data.objects.remove(m4, do_unlink=True)

    pin = finish(assign(turned("PlanetPin", PIN_PROFILE, c, 32, closed=False), m["steel"]))
    planet = build_gear("PlanetGear", planet_outline, 5.08, c, m)
    washer_front = finish(assign(turned("ThrustWasherFront", ring_profile(5.15, 10.0, -8.45, -7.05, 0.2), c, 32), m["brass"]))
    washer_rear = finish(assign(turned("ThrustWasherRear", ring_profile(5.15, 10.0, 7.05, 8.45, 0.2), c, 32), m["brass"]))
    pin_clip = build_ring_clip("PinClip", 4.05, 6.0, 0.9, 9.15, False, 90, c, m, lug=1.0, holes=False)
    planets_out = []
    for i, (theta, phase) in enumerate(planets, start=1):
        x, z = polar(CENTRE_DISTANCE, theta)
        carrier_parts.append(mesh_copy(f"PlanetPin_{i:02d}", pin, c, (x, 0, z)))
        gear = mesh_copy(f"Planet_{i:02d}", planet, c, matrix=Matrix.Translation((x * MM, 0, z * MM)) @ Matrix.Rotation(-phase, 4, "Y"))
        gear["drive"] = "planet"
        planets_out.append(gear)
        carrier_parts.append(mesh_copy(f"ThrustWasher_{2 * i - 1:02d}", washer_front, c, (x, 0, z)))
        carrier_parts.append(mesh_copy(f"ThrustWasher_{2 * i:02d}", washer_rear, c, (x, 0, z)))
        carrier_parts.append(mesh_copy(f"PinClip_{i:02d}", pin_clip, c, matrix=Matrix.Translation((x * MM, 0, z * MM)) @ Matrix.Rotation(-theta, 4, "Y")))
    for template in (pin, planet, washer_front, washer_rear, pin_clip):
        bpy.data.objects.remove(template, do_unlink=True)
    carrier_parts += planets_out

    # Hierarchy, mechanism drives and explode data.
    statics = [parts[k] for k in ("Housing", "RingGear", "RingCirclip", "FrontCover", "RearCap", "Breather",
                                  "SightGlass_Bezel", "SightGlass_Lens")] + cover_bolts + rear_bolts
    parent(statics + [out_shaft_clip, in_shaft_clip], root)
    parent([front_seal], parts["FrontCover"])
    parent([rear_seal], parts["RearCap"])

    groups = {}
    for name, members, drive in (
        ("OutputBearing", [out_outer, out_inner, out_balls, out_bore_clip], None),
        ("InputBearing", [in_outer, in_inner, in_balls, in_bore_clip], None),
        ("InputGroup", input_parts, "input"),
        ("CarrierGroup", carrier_parts, "carrier"),
    ):
        group = empty(name, c, root)
        parent(members, group)
        if drive:
            group["drive"] = drive
        set_explode(group, name)
        groups[name] = group

    out_balls["drive"], out_balls["drive_factor"] = "carrier", round(out_cage, 5)
    in_balls["drive"], in_balls["drive_factor"] = "input", round(in_cage, 5)
    out_shaft_clip["drive"], in_shaft_clip["drive"] = "carrier", "input"
    for bolt in cover_bolts:
        set_explode(bolt, "CoverBolt")
    for bolt in rear_bolts:
        set_explode(bolt, "RearBolt")
    for key in ("FrontCover", "RearCap"):
        set_explode(parts[key], key)
    set_explode(out_shaft_clip, "OutputShaftCirclip")
    set_explode(in_shaft_clip, "InputShaftCirclip")
    set_explode(bpy.data.objects["OutputKey"], "OutputKey")
    set_explode(bpy.data.objects["InputKey"], "InputKey")

    report["phases_deg"] = {
        "sun": round(math.degrees(sun_phase), 3),
        "planets": [round(math.degrees(p) % (360 / PLANET_TEETH), 3) for _, p in planets],
        "ring": round(math.degrees(ring_phase) % (360 / RING_TEETH), 3),
    }
    report["cage_factors"] = {"output": round(out_cage, 4), "input": round(in_cage, 4)}
    return root, report


# ---------------------------------------------------------------- explode (for inspection renders)


def explode_nodes(c):
    return [o for o in c.objects if "explode_axis" in o]


def set_exploded(c, amount):
    for obj in explode_nodes(c):
        if "assembled" not in obj:
            obj["assembled"] = list(obj.location)
        base = Vector(obj["assembled"])
        obj.location = base + kit.from_gltf(obj["explode_axis"]) * obj["explode_distance"] * amount
    bpy.context.view_layer.update()
    if amount == 0:
        for obj in explode_nodes(c):
            del obj["assembled"]


# ---------------------------------------------------------------- framing


def world_points(c):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    pts = []
    for obj in c.objects:
        if obj.type != "MESH":
            continue
        mw = obj.evaluated_get(depsgraph).matrix_world
        pts += [mw @ v.co for v in obj.data.vertices]
    return pts


def view_basis(direction):
    d = direction.normalized()
    forward = -d
    reference = Vector((0, 0, 1)) if abs(d.z) < 0.98 else Vector((0, 1, 0))
    right = forward.cross(reference).normalized()
    return d, forward, right, right.cross(forward)


def fit_view(points, direction, fov_y, aspect, fill):
    """Target and distance so the projected points span `fill` of the limiting side,
    centred. Same algorithm as the website's viewer (ViewerScene.jsx → fitView)."""
    d, forward, right, up = view_basis(direction)
    tan_y = math.tan(fov_y / 2)
    tan_x = tan_y * aspect
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    target, distance = (lo + hi) / 2, (hi - lo).length * 1.5
    for _ in range(10):
        eye = target + d * distance
        xs, ys = [], []
        for p in points:
            v = p - eye
            z = v.dot(forward)
            xs.append(v.dot(right) / (z * tan_x))
            ys.append(v.dot(up) / (z * tan_y))
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        extent = max((max(xs) - min(xs)) / 2, (max(ys) - min(ys)) / 2)
        target = target + right * cx * distance * tan_x + up * cy * distance * tan_y
        distance *= extent / fill
    return target, distance


def make_camera(scene, c, target, distance):
    data = bpy.data.cameras.new("ViewCamera")
    data.sensor_fit = "VERTICAL"
    data.angle_y = math.radians(CAMERA_FOV)
    data.clip_start, data.clip_end = 0.01, 20.0
    camera = kit.link(bpy.data.objects.new("ViewCamera", data), c)
    aim(camera, target, CAMERA_DIRECTION, distance)
    camera["target"] = kit.to_gltf(target)
    camera["fill"], camera["fill_exploded"], camera["fov_deg"] = FILL, FILL_EXPLODED, CAMERA_FOV
    scene.camera = camera
    return camera


def aim(camera, target, direction, distance):
    d, forward, right, up = view_basis(direction)
    camera.location = target + d * distance
    camera.rotation_euler = Matrix((right, up, d)).transposed().to_euler()


# ---------------------------------------------------------------- studio

# Softboxes around the model: (name, direction from the model, width m, height m,
# radiance, colour). They light the poster and are baked into the website's HDR.
# Small, bright panels keep crisp highlights on metal without flooding the coated green.
SOFTBOXES = [
    ("Key", (0.55, -0.80, 0.78), 4.2, 2.9, 8.5, (1.0, 0.965, 0.92)),
    ("Top", (0.05, 0.15, 1.0), 3.9, 3.9, 4.8, (1.0, 1.0, 1.0)),
    ("Fill", (-1.0, -0.55, 0.22), 5.2, 3.6, 1.3, (0.86, 0.93, 1.0)),
    ("RimLeft", (-0.85, 0.90, 0.40), 1.3, 7.0, 8.5, (0.92, 1.0, 0.95)),
    ("RimRight", (0.95, 0.75, 0.35), 1.3, 7.0, 5.7, (1.0, 1.0, 1.0)),
    ("Strip", (0.15, -1.0, -0.02), 9.0, 0.8, 2.4, (1.0, 1.0, 1.0)),
    ("Floor", (0.0, 0.0, -1.0), 24.0, 24.0, 0.11, (0.55, 0.75, 0.6)),
]
STUDIO_RADIUS = 12.0
WORLD_COLOR = (0.017, 0.021, 0.019, 1.0)
VIEW_TRANSFORM = "Khronos PBR Neutral"   # keeps the coated green saturated; three.js: NeutralToneMapping


def build_studio(scene, studio):
    world = bpy.data.worlds.new("Studio_World")
    scene.world = world
    if world.node_tree is None:
        world.use_nodes = True
    world.node_tree.nodes.get("Background").inputs["Color"].default_value = WORLD_COLOR
    panels = []
    for name, direction, width, height, radiance, color in SOFTBOXES:
        mat = bpy.data.materials.new(f"Softbox_{name}")
        if mat.node_tree is None:
            mat.use_nodes = True
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        nodes.clear()
        emission = nodes.new("ShaderNodeEmission")
        emission.inputs["Color"].default_value = (*color, 1.0)
        emission.inputs["Strength"].default_value = radiance
        out = nodes.new("ShaderNodeOutputMaterial")
        links.new(emission.outputs["Emission"], out.inputs["Surface"])
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        for v in bm.verts:
            v.co.x *= width
            v.co.y *= height
        panel = kit.mesh_object(f"Softbox_{name}", bm, studio)
        panel.data.materials.append(mat)
        d = Vector(direction).normalized()
        panel.location = d * STUDIO_RADIUS
        up = "Y" if abs(d.z) < 0.95 else "X"
        panel.rotation_euler = (-d).to_track_quat("Z", up).to_euler()
        panel.visible_shadow = False
        panel.visible_camera = False
        panels.append(panel)
    return panels


def render_settings(scene, size, samples, path, fmt="WEBP", transparent=True):
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = samples > 16
    scene.render.film_transparent = transparent
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = fmt
    if fmt == "WEBP":
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.image_settings.quality = 90
    elif fmt == "PNG":
        scene.render.image_settings.color_mode = "RGBA"
    else:
        scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = path
    scene.view_settings.view_transform = VIEW_TRANSFORM
    scene.view_settings.look = "None"


def render_environment(scene, panels, collections, catcher):
    """Bake the softboxes into an equirectangular HDR for the website (model hidden)."""
    os.makedirs(os.path.dirname(ENV_PATH), exist_ok=True)
    for col in collections:
        col.hide_render = True
    catcher.hide_render = True
    data = bpy.data.cameras.new("EnvCamera")
    data.type = "PANO"
    data.panorama_type = "EQUIRECTANGULAR"
    cam = kit.link(bpy.data.objects.new("EnvCamera", data), scene.collection)
    # Looking along +X with +Z up gives three.js's equirect layout once converted to glTF.
    cam.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
    previous = scene.camera
    scene.camera = cam
    for panel in panels:
        panel.visible_camera = True
    render_settings(scene, (1024, 512), 16, ENV_PATH, fmt="HDR", transparent=False)
    scene.view_settings.view_transform = "Standard"   # an HDR file stores scene-linear light anyway
    bpy.ops.render.render(write_still=True)
    for panel in panels:
        panel.visible_camera = False
    for col in collections:
        col.hide_render = False
    catcher.hide_render = False
    scene.camera = previous
    bpy.data.objects.remove(cam, do_unlink=True)


def render_poster(scene):
    render_settings(scene, (POSTER_SIZE, POSTER_SIZE), 160, POSTER_PATH)
    bpy.ops.render.render(write_still=True)


def render_views(scene, c, camera, catcher):
    """Inspection renders for checking the model from every side."""
    os.makedirs(VIEWS_DIR, exist_ok=True)
    keep = (camera.location.copy(), camera.rotation_euler.copy(), camera.data.shift_x, camera.data.shift_y)
    views = [
        ("three_quarter", CAMERA_DIRECTION, 0), ("front", Vector((0, -1, 0.02)), 0),
        ("back", Vector((0, 1, 0.02)), 0), ("right", Vector((1, 0, 0.02)), 0),
        ("left", Vector((-1, 0, 0.02)), 0), ("top", Vector((0, -0.03, 1)), 0),
        ("underside", Vector((0.25, -0.35, -1)), 0), ("rear_three_quarter", Vector((-0.7, 0.8, 0.5)), 0),
        ("exploded", CAMERA_DIRECTION, 1), ("exploded_side", Vector((1, -0.25, 0.35)), 1),
    ]
    catcher.hide_render = True
    for name, direction, amount in views:
        set_exploded(c, amount)
        target, distance = fit_view(world_points(c), direction, math.radians(CAMERA_FOV), 1.0, 0.86)
        aim(camera, target, direction, distance)
        render_settings(scene, (760, 760), 40, os.path.join(VIEWS_DIR, f"{name}.png"), fmt="PNG")
        bpy.ops.render.render(write_still=True)
    set_exploded(c, 0)
    catcher.hide_render = False
    camera.location, camera.rotation_euler, camera.data.shift_x, camera.data.shift_y = keep


# ---------------------------------------------------------------- main


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "OTHS CAD Gearbox"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "MILLIMETERS"
    model = bpy.data.collections.new("Gearbox")
    studio = bpy.data.collections.new("Studio")
    scene.collection.children.link(model)
    scene.collection.children.link(studio)

    materials = make_materials()
    root, report = build_assembly(model, materials)
    bpy.context.view_layer.update()

    points = world_points(model)
    target, distance = fit_view(points, CAMERA_DIRECTION, math.radians(CAMERA_FOV), 1.0, FILL)
    camera = make_camera(scene, model, target, distance)
    floor = min(p.z for p in points)

    panels = build_studio(scene, studio)
    catcher = kit.shadow_catcher(studio, target, 3.0, floor)

    kit.export_glb(GLB_PATH, [root] + [o for o in model.objects if o is not root], export_vertex_color="NONE")
    if "--no-render" not in ARGS:
        render_environment(scene, panels, [model], catcher)
        render_poster(scene)
    if VIEWS_DIR:
        render_views(scene, model, camera, catcher)
    kit.save_blend(BLEND_PATH)

    meshes = [o for o in model.objects if o.type == "MESH"]
    per_part = sorted(((kit.triangle_count([o]), o.name) for o in meshes), reverse=True)
    balls = OUTPUT_BEARING["balls"] + INPUT_BEARING["balls"]
    report.update({
        "blender": bpy.app.version_string,
        "components": len(meshes),
        "physical_parts": len(meshes) - 2 + balls,   # each ball set is one mesh of loose balls
        "triangles": sum(t for t, _ in per_part),
        "heaviest": per_part[:8],
        "glb_bytes": os.path.getsize(GLB_PATH),
        "poster_bytes": os.path.getsize(POSTER_PATH) if os.path.exists(POSTER_PATH) else None,
        "env_bytes": os.path.getsize(ENV_PATH) if os.path.exists(ENV_PATH) else None,
        "frame_target_gltf": kit.to_gltf(target),
        "frame_distance_m": round(distance, 4),
    })
    print("GEARBOX_REPORT", report)


if __name__ == "__main__":
    main()
