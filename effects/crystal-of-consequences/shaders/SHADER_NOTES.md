# Crystal of Consequences — Procedural Shader Specification v2

Full artistic direction and technical specification for the procedural
material that drives the crystal's visual transformation between Purity
and Corruption.

---

## 1. Overview

- Zero texture files. Everything is procedural math. Budget: **0 MB**.
- Single input: `CorruptionLevel` (float, 0.0 → 1.0), exposed via
  "Pin to Graph" in the Material Editor.
- Output: Standard PBR channels (BaseColor, Metallic, Roughness, Normal,
  Emission).
- Driven in real-time by `CrystalController.ts` via
  `material.setFloat('CorruptionLevel', value)`.

---

## 2. Purity State (CorruptionLevel = 0.0)

- **Base Color:** Near-white with slight blue tint (`#E8F0FE`).
- **Fresnel effect** on edges: bright rim light, intensity = 2.0,
  power = 4.0.
- **Refraction simulation:** Use Grab Pass (screen texture behind the
  object) with UV distortion via normal-based offset. This simulates
  light bending through crystal without real raytracing.
- **Chromatic dispersion:** Split the Grab Pass into 3 channels (R, G, B)
  with slightly different UV offsets to create rainbow edge effects.
- **Roughness** = 0.0 (mirror-smooth surface).
- **Metallic** = 0.2 (dielectric with slight reflection).
- **No emission.**
- *Note:* True refraction is impossible on mobile. The Grab Pass technique
  gives a convincing illusion at near-zero GPU cost.

---

## 3. Corruption State (CorruptionLevel = 1.0)

- **Base Color:** Near-black obsidian (`#0A0A0A`).
- **Voronoi Noise:** Creates organic crevasse pattern.
  Cell scale = 4.0, jitter = 0.8.
- **Crevasse detection:** Use `1.0 - VoronoiDistance` through a
  `Smoothstep(0.02, 0.08)` to isolate thin edge lines.
- **Distance-from-center mask:** Multiply Voronoi by
  `1.0 - length(UV - 0.5) * 2.0` so corruption grows FROM EDGES INWARD,
  not uniformly.
- **Emission in crevasses:** Color gradient from `#FF4500` (orange) to
  `#8B0000` (dark red). Intensity modulated by
  `sin(Time * 3.0) * 0.3 + 0.7` for pulsating ember effect.
- **Roughness** = 0.85 (not 1.0 — keeps micro-reflections like real
  obsidian).
- **Metallic** = 0.8 (volcanic glass is partially metallic).
- **Micro-fractures:** Secondary Voronoi layer at cell scale = 12.0,
  very faint, added to normal channel for surface detail.

---

## 4. Transition (0.0 → 1.0)

- All channels use Mix/Lerp nodes with `CorruptionLevel` as factor.
- Color transition passes through deep purple (`#2D0A4E`) at the midpoint
  (0.5) — use a curve or remap node, not linear.
- At exactly 0.5: crystal "hesitates" — `CrystalBreathingController.ts`
  adds ±2% scale oscillation externally.
- Voronoi corruption appears progressively from edges inward thanks to the
  distance mask.

---

## 5. Material Editor Node Graph

```
[CorruptionLevel] ─── float uniform (Pin to Graph)
        │
        ├──→ [Mix: BaseColor]
        │       A: Fresnel + GrabPass (Purity)
        │       B: Voronoi masked + Black (Corruption)
        │       Alpha: CorruptionLevel
        │
        ├──→ [Mix: Roughness]
        │       A: 0.0    B: 0.85
        │
        ├──→ [Mix: Metallic]
        │       A: 0.2    B: 0.8
        │
        └──→ [Multiply: Emission]
                A: VoronoiEdge × EmberColor × PulseWave
                B: CorruptionLevel
                (Emission only active when CorruptionLevel > 0)

[Time] ──→ [Voronoi UV Offset] (animate crevasse crawl)
       ──→ [sin(Time * 3.0)] (ember pulse)

[UV] ──→ [Distance from Center] ──→ [Edge Mask] ──→ [Voronoi Multiplier]
```

---

## 6. Geometry Specifications

- **Mesh:** Icosahedron (20 faces, ~5 KB).
- **Optional:** Normal Map baked from subdivided version in Blender (for
  surface micro-detail).
- **Total triangle budget** for crystal: < 100 triangles.
- **Total texture budget:** 0 MB.

---

## 7. Performance Notes

- **Target:** Stable 30 FPS on 5-year-old smartphones.
- No real-time shadows on the crystal (use baked or none).
- Single material, single pass.
- Grab Pass for refraction is the most expensive operation — test on
  low-end devices first.
