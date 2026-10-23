"""
cadkit.py — shared helpers for the club's procedural Blender models.

Imported by create_gearbox.py and create_project_models.py; it does nothing when run
on its own. Units are metres (1 Blender unit = 1 m); dimensions are written in
millimetres and scaled by MM. Blender is Z-up and glTF is Y-up: the exporter maps a
Blender vector (x, y, z) to glTF (x, z, -y), and any axis stored in an object's extras
goes through to_gltf() first, so the website never needs to know about Blender's axes.
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Matrix, Vector

MM = 0.001
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

CAMERA_DIRECTION = Vector((1.0, 0.82, 0.62)).normalized()   # target → camera, Blender axes
FRAME_MARGIN = 1.06

# ---------------------------------------------------------------- axes and colour


def to_gltf(v):
    """Blender (Z-up) vector → glTF (Y-up) vector, as written by the exporter."""
    return [round(v[0], 6), round(v[2], 6), round(-v[1], 6)]


def from_gltf(v):
    """glTF (Y-up) vector → Blender (Z-up) vector."""
    return Vector((v[0], -v[2], v[1]))


def srgb_to_linear(hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return (*lin, 1.0)


# ---------------------------------------------------------------- geometry


def link(obj, collection):
    collection.objects.link(obj)
    return obj


def mesh_object(name, bm, collection):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me), collection)


def arc(cx, cz, r, a0, a1, segments):
    return [
        (cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / segments)),
         cz + r * math.sin(math.radians(a0 + (a1 - a0) * i / segments)))
        for i in range(segments + 1)
    ]


def extrude_xz(name, profile, y0, y1, collection):
    """Sweep a closed (x, z) profile in millimetres along Y from y0 to y1."""
    bm = bmesh.new()
    front = [bm.verts.new((x * MM, y0 * MM, z * MM)) for x, z in profile]
    back = [bm.verts.new((x * MM, y1 * MM, z * MM)) for x, z in profile]
    n = len(profile)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[i], front[j], back[j], back[i]))
    bm.faces.new(front)
    bm.faces.new(back)
    return mesh_object(name, bm, collection)


def cylinder(name, radius, depth, segments, collection, matrix=Matrix()):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segments,
                          radius1=radius * MM, radius2=radius * MM, depth=depth * MM,
                          matrix=matrix)
    return mesh_object(name, bm, collection)


def lathe(name, profile, collection, segments=40, closed=False):
    """Revolve an (r, z) profile in millimetres around local Z, with turned-part UVs."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rings = []
    for r, z in profile:
        if r <= 1e-9:
            rings.append([bm.verts.new((0.0, 0.0, z * MM))])
        else:
            rings.append([
                bm.verts.new((r * MM * math.cos(2 * math.pi * i / segments),
                              r * MM * math.sin(2 * math.pi * i / segments), z * MM))
                for i in range(segments)
            ])
    # v runs along the profile, u around the axis, so a streaked texture reads as turning marks
    pts = list(profile) + ([profile[0]] if closed else [])
    lengths = [0.0]
    for (r0, z0), (r1, z1) in zip(pts, pts[1:]):
        lengths.append(lengths[-1] + math.hypot(r1 - r0, z1 - z0))
    total = lengths[-1] or 1.0

    count = len(rings) if closed else len(rings) - 1
    for k in range(count):
        a, b = rings[k], rings[(k + 1) % len(rings)]
        va, vb = lengths[k] / total, lengths[k + 1] / total
        for i in range(segments):
            j = (i + 1) % segments
            u0, u1 = i / segments, (i + 1) / segments
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                verts, uvs = (a[0], b[i], b[j]), ((u0, va), (u0, vb), (u1, vb))
            elif len(b) == 1:
                verts, uvs = (a[i], b[0], a[j]), ((u0, va), (u0, vb), (u1, va))
            else:
                verts, uvs = (a[i], a[j], b[j], b[i]), ((u0, va), (u1, va), (u1, vb), (u0, vb))
            face = bm.faces.new(verts)
            for loop, coord in zip(face.loops, uvs):
                loop[uv].uv = coord
    return mesh_object(name, bm, collection)


def bake_modifiers(obj):
    """Apply all modifiers by evaluating the object (no operator context needed)."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True,
                                           depsgraph=depsgraph)
    old, name = obj.data, obj.data.name
    obj.modifiers.clear()
    obj.data = mesh
    if old.users == 0:
        bpy.data.meshes.remove(old)
    mesh.name = name


def boolean(obj, cutter, operation, transfer=False, self_intersect=False):
    """Apply one boolean and delete the cutter. With transfer=True the faces that come
    from the cutter keep the cutter's material (used for machined and section faces);
    otherwise they take the object's first material."""
    mod = obj.modifiers.new(f"{operation.title()} {cutter.name}", "BOOLEAN")
    mod.operation = operation
    mod.object = cutter
    solvers = {item.identifier for item in mod.bl_rna.properties["solver"].enum_items}
    mod.solver = "EXACT" if "EXACT" in solvers else "MANIFOLD"
    if obj.data.materials and (not transfer or not cutter.data.materials):
        cutter.data.materials.clear()
        cutter.data.materials.append(obj.data.materials[0])
    if mod.solver == "EXACT":
        mod.use_self = self_intersect
        if hasattr(mod, "material_mode"):
            mod.material_mode = "TRANSFER"
    bake_modifiers(obj)
    bpy.data.objects.remove(cutter, do_unlink=True)
    drop_empty_slots(obj)


def drop_empty_slots(obj):
    """Remove empty or repeated material slots left by booleans, keeping each face's material."""
    mats = list(obj.data.materials)
    keep = []
    for m in mats:
        if m and m not in keep:
            keep.append(m)
    if not keep or len(keep) == len(mats):
        return
    remap = [keep.index(m) if m else 0 for m in mats]
    indices = [remap[p.material_index] if p.material_index < len(remap) else 0 for p in obj.data.polygons]
    obj.data.materials.clear()
    for m in keep:
        obj.data.materials.append(m)
    for poly, index in zip(obj.data.polygons, indices):
        poly.material_index = index


def shade_by_angle(obj, angle=30.0):
    """Smooth faces, with sharp edges where faces meet at more than `angle` degrees."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    limit = math.radians(angle)
    for face in bm.faces:
        face.smooth = True
    for edge in bm.edges:
        sharp = not edge.is_manifold or edge.calc_face_angle(math.pi) > limit
        edge.smooth = not sharp
    bm.to_mesh(obj.data)
    bm.free()


def world_corners(obj, offset=Vector()):
    return [obj.matrix_world @ Vector(c) + offset for c in obj.bound_box]


def triangle_count(objects):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    total = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        mesh = obj.evaluated_get(depsgraph).to_mesh()
        mesh.calc_loop_triangles()
        total += len(mesh.loop_triangles)
        obj.evaluated_get(depsgraph).to_mesh_clear()
    return total


# ---------------------------------------------------------------- materials


def principled(name, color, metallic, roughness, coat=0.0, coat_roughness=0.2):
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:  # Blender < 5 creates materials without nodes
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb_to_linear(color)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if coat and "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    mat.diffuse_color = srgb_to_linear(color)
    return mat, bsdf


def roughness_map(mat, bsdf, image):
    """Drive roughness and metallic from a glTF-layout image (G = roughness, B = metallic)."""
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.interpolation = "Linear"
    split = nodes.new("ShaderNodeSeparateColor")
    links.new(tex.outputs["Color"], split.inputs["Color"])
    links.new(split.outputs["Green"], bsdf.inputs["Roughness"])
    links.new(split.outputs["Blue"], bsdf.inputs["Metallic"])
    tex.location, split.location = (-600, 0), (-300, 0)
    return mat


def packed_image(name, pixels, size):
    image = bpy.data.images.new(name, size, size, alpha=False, float_buffer=False)
    image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(pixels.ravel())
    image.pack()
    return image


def turned_roughness(name, base=0.30, spread=0.07, lo=0.18, hi=0.5, seed=7, size=256):
    """Rows of slightly different roughness: turning marks along lathe UVs (v = profile)."""
    import numpy as np

    rng = np.random.default_rng(seed)
    rows = base + spread * np.convolve(rng.standard_normal(size + 8), np.ones(9) / 9, "valid")[:size]
    grain = 0.03 * rng.standard_normal((size, size))
    pixels = np.ones((size, size, 4), dtype=np.float32)
    pixels[..., 1] = np.clip(rows[:, None] + grain, lo, hi)   # G = roughness, R/B = 1
    return packed_image(name, pixels, size)


def brushed_steel():
    """Steel with a small turned-finish roughness map (glTF metallicRoughness layout)."""
    mat, bsdf = principled("Fastener_BrushedSteel", "#c6cacd", 1.0, 0.3)
    return roughness_map(mat, bsdf, turned_roughness("SteelTurned_MR"))


# ---------------------------------------------------------------- output


def export_glb(path, objects, **overrides):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    wanted = dict(
        filepath=path, export_format="GLB", use_selection=True, export_apply=True,
        export_yup=True, export_extras=True, export_cameras=True, export_lights=False,
        export_texcoords=True, export_normals=True, export_tangents=False,
        export_materials="EXPORT", export_image_format="AUTO", export_animations=False,
        export_draco_mesh_compression_enable=False,
    )
    wanted.update(overrides)
    available = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in available})


def build_studio(scene, studio, center, radius, floor_z):
    """Area lights and a shadow catcher for thumbnail renders only (not exported)."""
    world = bpy.data.worlds.new("Studio_World")
    scene.world = world
    if world.node_tree is None:  # Blender < 5 creates worlds without nodes
        world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.010, 0.014, 0.012, 1.0)
    bg.inputs["Strength"].default_value = 1.0

    # Lights sit at a fixed multiple of the object's size, so power scales with size²
    # to keep the same exposure for small and large parts.
    power = (radius / 0.0973) ** 2

    def area(name, direction, size, energy, color=(1, 1, 1)):
        data = bpy.data.lights.new(name, "AREA")
        data.shape = "DISK"
        data.size = size
        data.energy = energy * power
        data.color = color
        light = link(bpy.data.objects.new(name, data), studio)
        light.location = center + Vector(direction).normalized() * radius * 4.0
        light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()
        return light

    # Energies in watts for a ~0.2 m object with lights ~0.4 m away.
    area("Key", (0.6, 1.1, 1.4), radius * 2.6, 1.5, (1.0, 0.97, 0.93))
    area("Fill", (1.4, -0.4, 0.5), radius * 3.2, 0.45, (0.86, 0.95, 1.0))
    area("Rim", (-1.2, -0.9, 0.9), radius * 1.8, 1.4, (0.80, 1.0, 0.88))
    area("Top", (0.1, 0.2, 1.0), radius * 3.0, 0.3)

    shadow_catcher(studio, center, radius * 8, floor_z)


def shadow_catcher(studio, center, size, floor_z):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(center.x, center.y, floor_z))
    catcher = bpy.context.active_object
    catcher.name = "ShadowCatcher"
    for collection in catcher.users_collection:
        collection.objects.unlink(catcher)
    studio.objects.link(catcher)
    catcher.is_shadow_catcher = True
    return catcher


def save_blend(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.file.pack_all()
    bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backups next to the source
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
