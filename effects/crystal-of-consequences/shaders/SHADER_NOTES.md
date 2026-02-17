# Shader Notes — Crystal of Consequences

Artistic direction and technical specification for the procedural shader
that drives the crystal's visual transformation between Purity and Corruption.

---

## Purity State (CorruptionLevel = 0.0)

- Crystal-clear diamond material.
- Fresnel effect on edges producing a bright rim light.
- Chromatic dispersion: RGB channel split through refraction on each
  icosahedron face.
- Roughness = 0, Metallic = 0.2.
- Refraction of the real camera feed through the icosahedron geometry.
- Subtle rainbow caustics projected onto surrounding surfaces.

## Corruption State (CorruptionLevel = 1.0)

- Dark obsidian base color (near black: `#0A0A0A`).
- Voronoi noise pattern generating organic crevasses and veins.
- Emission inside crevasses: orange-red lava glow transitioning from
  `#FF4500` to `#8B0000`.
- Roughness = 1.0, Metallic = 0.8.
- Micro-fractures animated via a time-based Voronoi UV offset.
- Pulsating ember particles in cracks driven by a sin-wave emission
  intensity curve.

## Transition Logic (0.0 to 1.0)

- Linear mix (`lerp`) between both material states, driven by the
  `CorruptionLevel` float uniform.
- At exactly 0.5 the crystal "hesitates": a subtle scale breathing effect
  is applied via `sin(time * 2.0) * 0.02`.
- The Voronoi corruption pattern grows from the edges inward, using
  distance-from-center as a mask.
- The color transition passes through deep purple (`#2D0A4E`) at the
  midpoint.

## Material Editor Implementation (Effect House)

- **Input node:** `CorruptionLevel` (float, range 0 to 1) exposed via
  "Pin to Graph" in the Material Editor.
- **Fresnel Node** feeds into a Mix node with factor `1.0 - CorruptionLevel`.
- **Voronoi Noise Node** feeds into the same Mix node with factor
  `CorruptionLevel`.
- **Time Node** offsets the Voronoi UV coordinates for animation.
- **Emission Node** computed as
  `CorruptionLevel * VoronoiEdge * EmberColor`.
- **Output:** Standard PBR channels (BaseColor, Metallic, Roughness,
  Normal, Emission).

## Geometry

- Base mesh: Icosahedron (20 faces), approximately 5 KB.
- Optional: Normal Map baked from a subdivided version in Blender to add
  surface micro-detail without increasing polygon count.
- Total texture budget: **0 MB** (everything is procedural).

## Node Graph Diagram

```
[Time] ──────────────────→ [Voronoi UV Offset]
                                    |
[CorruptionLevel] ──┬──→ [Mix: Fresnel <-> Voronoi] ──→ [Base Color]
                    |──→ [Mix: 0.0 <-> 1.0] ──────────→ [Roughness]
                    |──→ [Mix: 0.2 <-> 0.8] ──────────→ [Metallic]
                    └──→ [Multiply: Level x Edge] ────→ [Emission]
```
