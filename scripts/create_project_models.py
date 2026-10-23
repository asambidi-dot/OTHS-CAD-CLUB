"""
create_project_models.py — practice-project models and gallery thumbnails.

Run headless from the project root:

    blender --background --factory-startup --python scripts/create_project_models.py
    blender --background --factory-startup --python scripts/create_project_models.py -- --only gear

For each practice concept this builds the part procedurally (with the shared helpers
in cadkit.py), then writes:
    public/models/projects/<id>.glb     opened in the project dialog's 3D viewer
    public/images/projects/<id>.webp    static thumbnail for the gallery card

Conventions: metres, millimetre constants, Blender Z-up exported as glTF Y-up, a
ViewCamera with the framing in its extras, and explode axes on movable parts already
converted to glTF axes.
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cadkit as kit  # noqa: E402  (shared geometry, materials, studio)

MM = kit.MM
MODEL_DIR = os.path.join(kit.ROOT, "public", "models", "projects")
THUMB_DIR = os.path.join(kit.ROOT, "public", "images", "projects")
ARGS = kit.ARGS
ONLY = ARGS[ARGS.index("--only") + 1] if "--only" in ARGS else None

THUMB_SIZE = (800, 520)
THUMB_FOV = 30.0


def extrude_xy(name, profile, z0, z1, collection):
    """Sweep a closed (x, y) profile in millimetres along Z."""
    bm = bmesh.new()
    bottom = [bm.verts.new((x * MM, y * MM, z0 * MM)) for x, y in profile]
    top = [bm.verts.new((x * MM, y * MM, z1 * MM)) for x, y in profile]
    n = len(profile)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bottom[i], bottom[j], top[j], top[i]))
    bm.faces.new(bottom)
    bm.faces.new(top)
    return kit.mesh_object(name, bm, collection)


def box(name, lo, hi, collection):
    x0, y0, z0 = lo
    x1, y1, z1 = hi
    return extrude_xy(name, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1, collection)


def polygon(cx, cy, r, sides, phase=0.0):
    return [(cx + r * math.cos(math.radians(phase) + 2 * math.pi * i / sides),
             cy + r * math.sin(math.radians(phase) + 2 * math.pi * i / sides)) for i in range(sides)]


def finish(obj, material, bevel=0.5, angle=30.0):
    kit.shade_by_angle(obj, angle)
    if bevel:
        mod = obj.modifiers.new("Edge break", "BEVEL")
        mod.width = bevel * MM
        mod.segments = 2
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(30)
        mod.use_clamp_overlap = True
        if hasattr(mod, "harden_normals"):
            mod.harden_normals = True
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


# ---------------------------------------------------------------- models


def build_gear(c, mats):
    teeth, root, tip = 18, 33.0, 40.0
    step = 2 * math.pi / teeth
    profile = []
    for i in range(teeth):
        a = i * step
        for frac, r in ((0.0, root), (0.12, root), (0.27, tip), (0.47, tip), (0.62, root)):
            profile.append((r * math.cos(a + frac * step), r * math.sin(a + frac * step)))
    gear = extrude_xy("Gear", profile, 0, 12, c)
    hub = kit.cylinder("Hub", 13, 9, 48, c, Matrix.Translation((0, 0, 16.5 * MM)))
    kit.boolean(gear, hub, "UNION")
    bore = kit.cylinder("Bore", 6, 40, 40, c)
    kit.boolean(gear, bore, "DIFFERENCE")
    key = box("Key", (4.5, -2, -5), (8.5, 2, 30), c)
    kit.boolean(gear, key, "DIFFERENCE")
    for i in range(6):
        a = math.radians(30 + 60 * i)
        hole = kit.cylinder("Lightening", 4.6, 30, 32, c,
                             Matrix.Translation((22 * math.cos(a) * MM, 22 * math.sin(a) * MM, 6 * MM)))
        kit.boolean(gear, hole, "DIFFERENCE")
    return [finish(gear, mats["green"], 0.4)]


def build_organizer(c, mats):
    tray = box("Tray", (0, 0, 0), (100, 64, 18), c)
    for lo, hi in (((4, 4, 3), (48, 60, 30)), ((51, 4, 3), (96, 30.5, 30)), ((51, 33.5, 3), (96, 60, 30))):
        kit.boolean(tray, box("Pocket", lo, hi, c), "DIFFERENCE")
    parts = [finish(tray, mats["pla"], 0.6)]

    cup = kit.cylinder("PenCup", 14, 52, 48, c, Matrix.Translation((26 * MM, 32 * MM, 29 * MM)))
    inner = kit.cylinder("CupInside", 12, 52, 48, c, Matrix.Translation((26 * MM, 32 * MM, 33 * MM)))
    kit.boolean(cup, inner, "DIFFERENCE")
    parts.append(finish(cup, mats["green"], 0.4))

    for i, (x, y, h, tone) in enumerate(((21, 28, 34, "green"), (30, 30, 28, "steel"), (24, 37, 24, "green"))):
        pen = kit.lathe(f"Pen_{i + 1:02d}", [(0, 0), (3.6, 0), (3.6, h), (2.2, h + 4), (0.6, h + 7), (0, h + 7)], c, 24)
        pen.location = (x * MM, y * MM, 5 * MM)
        parts.append(finish(pen, mats[tone], 0))
    notes = box("StickyNotes", (60, 38, 3), (86, 56, 11), c)
    parts.append(finish(notes, mats["paper"], 0.3))
    return parts


def build_hook(c, mats):
    profile = (
        [(0, 66), (48, 66), (48, 60), (6, 60)]
        + kit.arc(20, 18, 14, 180, 360, 16)
        + [(34, 30), (40, 30)]
        + kit.arc(20, 18, 20, 0, -180, 18)
    )
    hook = kit.extrude_xz("Hook", profile, 0, 24, c)
    for x in (18, 38):
        hole = kit.cylinder("ScrewHole", 2.2, 20, 24, c, Matrix.Translation((x * MM, 12 * MM, 63 * MM)))
        kit.boolean(hook, hole, "DIFFERENCE")
        sink = kit.cylinder("Countersink", 4.2, 3, 24, c, Matrix.Translation((x * MM, 12 * MM, 61 * MM)))
        kit.boolean(hook, sink, "DIFFERENCE")
    return [finish(hook, mats["green"], 0.6)]


def build_assembly(c, mats):
    base = extrude_xy("HexBase", polygon(0, 0, 34, 6, 30), 0, 14, c)
    block = extrude_xy("Block", polygon(0, 0, 19, 4, 20), 14, 38, c)
    pyramid_bm = bmesh.new()
    ring = [pyramid_bm.verts.new((x * MM, y * MM, 38 * MM)) for x, y in polygon(0, 0, 19, 4, 20)]
    apex = pyramid_bm.verts.new((0, 0, 64 * MM))
    pyramid_bm.faces.new(ring[::-1])
    for i in range(4):
        pyramid_bm.faces.new((ring[i], ring[(i + 1) % 4], apex))
    pyramid = kit.mesh_object("Pyramid", pyramid_bm, c)

    parts = [finish(base, mats["green"], 0.6), finish(block, mats["steel"], 0.5), finish(pyramid, mats["pla"], 0.4)]
    # Origins on the mating faces, so each part lifts straight up its shared axis.
    for obj, seat, distance in ((block, 14, 22), (pyramid, 38, 46)):
        offset = Vector((0, 0, seat * MM))
        obj.data.transform(Matrix.Translation(-offset))
        obj.location = offset
        obj["role"] = "part"
        obj["explode_axis"] = kit.to_gltf(Vector((0, 0, 1)))
        obj["explode_distance"] = round(distance * MM, 6)
    return parts


def build_planter(c, mats):
    sides, wall = 6, 3.0
    outer = [(22, 0), (34, 28), (30, 48)]
    inner = [(30 - wall, 48), (34 - wall, 28), (22 - wall * 0.6, 4)]
    bm = bmesh.new()

    def ring(r, z):
        return [bm.verts.new((x * MM, y * MM, z * MM)) for x, y in polygon(0, 0, r, sides, 30)]

    rings = [ring(r, z) for r, z in outer] + [ring(r, z) for r, z in inner]
    for a, b in zip(rings, rings[1:]):
        for i in range(sides):
            j = (i + 1) % sides
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(rings[0][::-1])       # outer bottom
    bm.faces.new(rings[-1])            # inner floor
    planter = kit.mesh_object("Planter", bm, c)
    return [finish(planter, mats["green"], 0.5)]


# ---------------------------------------------------------------- mechanical bracket (mm)

T = 8.0            # plate thickness
LENGTH = 120.0     # base plate, along +X
HEIGHT = 100.0     # wall plate, along +Z
WIDTH = 80.0       # along Y, centred on 0
BEND_IN = 6.0      # inside bend radius
BEND_OUT = T + BEND_IN
RIB_T = 8.0        # gusset thickness
RIB_LEG = 48.0     # gusset leg length from the inside faces
RIB_Y = 30.0       # gusset centre distance from Y = 0
HOLE_D = 11.0      # M10 clearance
BASE_HOLE_X = 96.0
WALL_HOLE_Z = 74.0
HOLE_Y = 22.0

BOLT_HEAD_D, BOLT_HEAD_H = 16.0, 10.0
BOLT_D, BOLT_L, PITCH = 10.0, 25.0, 1.5      # M10 × 25 socket head cap screw
SOCKET_AF, SOCKET_DEPTH = 8.0, 5.0
WASHER_OD, WASHER_ID, WASHER_T = 20.0, 10.5, 2.0
EXPLODE_WASHER, EXPLODE_BOLT = 20.0, 60.0    # mm along each hole axis


def bracket_body(c, material):
    profile = (
        [(LENGTH, 0.0), (LENGTH, T)]
        + kit.arc(T + BEND_IN, T + BEND_IN, BEND_IN, 270, 180, 10)
        + [(T, HEIGHT), (0.0, HEIGHT)]
        + kit.arc(BEND_OUT, BEND_OUT, BEND_OUT, 180, 270, 14)[:-1]
        + [(BEND_OUT, 0.0)]
    )
    # Drop the duplicate point where the outer arc meets the start of the profile.
    profile = [p for i, p in enumerate(profile) if i == 0 or (abs(p[0] - profile[i - 1][0]) + abs(p[1] - profile[i - 1][1])) > 1e-6]
    bracket = kit.extrude_xz("Bracket", profile, -WIDTH / 2, WIDTH / 2, c)

    rib_profile = [(T, T), (T + RIB_LEG, T), (T + RIB_LEG, T + 3), (T + 3, T + RIB_LEG), (T, T + RIB_LEG)]
    for side in (-1, 1):
        y = side * RIB_Y
        rib = kit.extrude_xz("Rib", rib_profile, y - RIB_T / 2, y + RIB_T / 2, c)
        kit.boolean(bracket, rib, "UNION")

    for side in (-1, 1):
        base_hole = kit.cylinder("Cutter", HOLE_D / 2, T + 6, 48, c,
                                 Matrix.Translation((BASE_HOLE_X * MM, side * HOLE_Y * MM, T / 2 * MM)))
        kit.boolean(bracket, base_hole, "DIFFERENCE")
        wall_hole = kit.cylinder("Cutter", HOLE_D / 2, T + 6, 48, c,
                                 Matrix.Translation((T / 2 * MM, side * HOLE_Y * MM, WALL_HOLE_Z * MM))
                                 @ Matrix.Rotation(math.radians(90), 4, "Y"))
        kit.boolean(bracket, wall_hole, "DIFFERENCE")

    bracket["role"] = "bracket"
    return finish(bracket, material, 0.6)


def bolt_profile():
    tip_r, crest, root = 4.2, BOLT_D / 2, BOLT_D / 2 - 0.65
    pts = [(0.0, -BOLT_L), (tip_r, -BOLT_L), (crest, -BOLT_L + 0.8)]
    z, top_of_thread, crest_next = -BOLT_L + 0.8, -7.0, False
    while z + PITCH / 2 < top_of_thread:
        z += PITCH / 2
        pts.append((crest if crest_next else root, z))
        crest_next = not crest_next
    if pts[-1][0] != crest:
        pts.append((crest, z + PITCH / 4))
    pts += [
        (crest, -0.6), (crest + 0.35, -0.15), (crest + 0.8, 0.0),       # fillet under the head
        (BOLT_HEAD_D / 2 - 0.4, 0.0), (BOLT_HEAD_D / 2, 0.4),            # head underside chamfer
        (BOLT_HEAD_D / 2, BOLT_HEAD_H - 0.6), (BOLT_HEAD_D / 2 - 0.6, BOLT_HEAD_H),
        (0.0, BOLT_HEAD_H),
    ]
    return pts


def build_bolt(name, c, material):
    bolt = kit.lathe(name, bolt_profile(), c, segments=40)
    socket_r = SOCKET_AF / 2 / math.cos(math.radians(30))
    socket = kit.cylinder("Socket", socket_r, SOCKET_DEPTH * 2, 6, c,
                          Matrix.Translation((0, 0, BOLT_HEAD_H * MM)) @ Matrix.Rotation(math.radians(30), 4, "Z"))
    kit.boolean(bolt, socket, "DIFFERENCE")
    return finish(bolt, material, 0, 35)


def build_washer(name, c, material):
    ri, ro, t, ch = WASHER_ID / 2, WASHER_OD / 2, WASHER_T, 0.2
    profile = [(ri, ch), (ri + ch, 0.0), (ro - ch, 0.0), (ro, ch), (ro, t - ch), (ro - ch, t), (ri + ch, t), (ri, t - ch)]
    washer = kit.lathe(name, profile, c, segments=48, closed=True)
    return finish(washer, material, 0, 35)


def place(obj, seat_mm, axis):
    """Origin on the seat point; local +Z along the assembly axis (pointing out of the hole)."""
    rotation = Vector((0, 0, 1)).rotation_difference(axis).to_matrix().to_4x4()
    obj.matrix_world = Matrix.Translation(Vector(seat_mm) * MM) @ rotation


def build_bracket(c, mats):
    parts = [bracket_body(c, mats["green"])]
    holes = (
        ((BASE_HOLE_X, -HOLE_Y, T), Vector((0, 0, 1))),
        ((BASE_HOLE_X, HOLE_Y, T), Vector((0, 0, 1))),
        ((T, -HOLE_Y, WALL_HOLE_Z), Vector((1, 0, 0))),
        ((T, HOLE_Y, WALL_HOLE_Z), Vector((1, 0, 0))),
    )
    for index, (seat, axis) in enumerate(holes, start=1):
        tag = f"{index:02d}"
        washer = build_washer(f"Washer_{tag}", c, mats["steel"])
        place(washer, seat, axis)
        bolt = build_bolt(f"Bolt_{tag}", c, mats["steel"])
        place(bolt, Vector(seat) + axis * WASHER_T, axis)
        # Every fastener's origin sits on its hole axis, so exploding moves it straight out.
        for obj, distance in ((washer, EXPLODE_WASHER), (bolt, EXPLODE_BOLT)):
            obj["role"] = "fastener"
            obj["hole"] = tag
            obj["explode_axis"] = kit.to_gltf(axis)
            obj["explode_distance"] = round(distance * MM, 6)
        parts += [washer, bolt]
    return parts


PROJECTS = {
    "bracket": (build_bracket, True),
    "gear": (build_gear, True),
    "organizer": (build_organizer, True),
    "hook": (build_hook, True),
    "assembly": (build_assembly, True),
    "planter": (build_planter, True),
}


# ---------------------------------------------------------------- pipeline


def framing(parts):
    bpy.context.view_layer.update()  # parts moved via .location need fresh world matrices
    corners = []
    for obj in parts:
        offset = Vector()
        if "explode_axis" in obj:
            gx, gy, gz = obj["explode_axis"]
            offset = Vector((gx, -gz, gy)) * obj["explode_distance"]   # glTF → Blender
        corners += kit.world_corners(obj) + kit.world_corners(obj, offset)
    lo = Vector(tuple(min(v[i] for v in corners) for i in range(3)))
    hi = Vector(tuple(max(v[i] for v in corners) for i in range(3)))
    return lo, hi, (lo + hi) / 2, (hi - lo).length / 2


def make_camera(scene, collection, center, radius):
    aspect = THUMB_SIZE[0] / THUMB_SIZE[1]
    vfov = math.radians(THUMB_FOV)
    hfov = 2 * math.atan(math.tan(vfov / 2) * aspect)
    distance = radius / math.sin(min(vfov, hfov) / 2) * kit.FRAME_MARGIN
    data = bpy.data.cameras.new("ViewCamera")
    data.sensor_fit = "VERTICAL"
    data.angle_y = vfov
    data.clip_start, data.clip_end = 0.01, 10.0
    camera = kit.link(bpy.data.objects.new("ViewCamera", data), collection)
    camera.location = center + kit.CAMERA_DIRECTION * distance
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera["target"] = kit.to_gltf(center)
    camera["frame_radius"] = round(radius, 6)
    scene.camera = camera
    return camera


def tighten(scene, camera, parts, fill=0.86):
    """Thumbnail only: fit the assembled silhouette (not the rotation sphere) and centre it."""
    from bpy_extras.object_utils import world_to_camera_view

    corners = [c for obj in parts for c in kit.world_corners(obj)]
    aspect = THUMB_SIZE[0] / THUMB_SIZE[1]
    gx, gy, gz = camera["target"]
    target = Vector((gx, -gz, gy))  # glTF → Blender
    for _ in range(4):
        bpy.context.view_layer.update()
        pts = [world_to_camera_view(scene, camera, c) for c in corners]
        xs, ys = [p.x for p in pts], [p.y for p in pts]
        width, height = max(xs) - min(xs), max(ys) - min(ys)
        grow = max(width, height) / fill
        camera.location = target + (camera.location - target) * grow
        # Lens shift is measured in fractions of the larger (horizontal) image side.
        camera.data.shift_x += ((min(xs) + max(xs)) / 2 - 0.5)
        camera.data.shift_y += ((min(ys) + max(ys)) / 2 - 0.5) / aspect


def render(scene, path):
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = THUMB_SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 88
    scene.view_settings.view_transform = "AgX"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def build_project(project_id, builder, export_glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = f"Project {project_id}"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "MILLIMETERS"
    parts_col = bpy.data.collections.new("Parts")
    studio = bpy.data.collections.new("Studio")
    scene.collection.children.link(parts_col)
    scene.collection.children.link(studio)

    mats = {
        "green": kit.principled("PowderCoat_Green", "#2e7a4b", 0.0, 0.42, coat=0.25)[0],
        "pla": kit.principled("PLA_Stone", "#cfd5cf", 0.0, 0.55)[0],
        "paper": kit.principled("Paper_Mint", "#bfe8cc", 0.0, 0.7)[0],
        "steel": kit.brushed_steel(),
    }
    parts = builder(parts_col, mats)
    lo, hi, center, radius = framing(parts)
    camera = make_camera(scene, parts_col, center, radius)
    kit.build_studio(scene, studio, center, radius, lo.z)

    report = {"id": project_id, "triangles": kit.triangle_count(parts)}
    if export_glb:
        path = os.path.join(MODEL_DIR, f"{project_id}.glb")
        kit.export_glb(path, parts + [camera])
        report["glb_bytes"] = os.path.getsize(path)
    if "--no-render" not in ARGS:
        thumb = os.path.join(THUMB_DIR, f"{project_id}.webp")
        tighten(scene, camera, parts)
        render(scene, thumb)
        report["thumb_bytes"] = os.path.getsize(thumb)
    print("PROJECT_REPORT", report)


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)
    for project_id, (builder, export_glb) in PROJECTS.items():
        if ONLY and project_id != ONLY:
            continue
        build_project(project_id, builder, export_glb)


if __name__ == "__main__":
    main()
