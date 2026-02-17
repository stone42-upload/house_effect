# Optimization Guide — Tropical Geometry

Strategies for keeping the Crystal of Consequences effect lightweight and
performant within TikTok Effect House constraints.

---

## 1. Philosophy

Inspired by tropical geometry, where multiplication becomes addition and
addition becomes max/min, this approach replaces expensive visual
operations with elegant mathematical shortcuts that produce visually
identical results at a fraction of the computational cost.

## 2. Normal Mapping

Fake geometry detail using light math instead of polygons. A mesh with
2 million polygons can be replaced by a 500-polygon mesh combined with a
Normal Map texture. The visual result is nearly identical while the GPU
cost drops by a factor of 4000.

## 3. Light Baking

Pre-compute all shadows and global illumination on a desktop workstation,
then paint the results directly onto a texture. At runtime the scene
requires zero dynamic light calculations, freeing the GPU for other
work.

## 4. Texture Atlas

Merge all textures into a single image. This reduces draw calls from
potentially dozens down to one, significantly lowering CPU overhead on
mobile devices.

## 5. Procedural Shaders

Replace texture files with mathematical functions such as Perlin noise,
Voronoi noise, and Fresnel equations. The file-size cost is 0 MB because
the patterns are generated at runtime. The resolution is effectively
infinite: procedural patterns never pixelate regardless of zoom level.

## 6. Object Pooling

Pre-allocate a fixed number of objects during initialization. At runtime,
activate and deactivate them as needed instead of creating and destroying
instances. This eliminates garbage collection spikes and memory
fragmentation.

## 7. Frame-Rate Independent Lerp

Use the following formula to ensure that interpolation behaves
identically at 30 FPS and 60 FPS:

```typescript
const factor = 1.0 - Math.pow(1.0 - baseFactor, deltaTime * 60);
```

A naive `lerp(a, b, fixedFactor)` converges twice as fast at 60 FPS
compared to 30 FPS. The corrected formula normalizes the decay rate
against a reference frame rate of 60.

## 8. Zero-Allocation onUpdate

Never use `new` inside the update loop. Allocate all vectors, quaternions,
and temporary objects in `onStart`. During `onUpdate`, copy values by
assigning individual components (`.x = `, `.y = `, `.z = `) rather than
creating new instances. This avoids per-frame heap allocations and
reduces garbage collection pressure.

## 9. Effect House Constraints

The following hardware and platform limits apply to all effects published
through TikTok Effect House:

| Constraint             | Value                             |
| ---------------------- | --------------------------------- |
| Package size max       | 8 MB                              |
| Image size max         | 1024 KB                           |
| Image resolution max   | 1024 x 1024 px                    |
| FPS max testable       | 30 FPS                            |
| Triangles (static)     | Max 200K, optimal < 100K          |
| Triangles (skinned)    | Max 120K, optimal < 60K           |
| Triangles (blendshape) | Max 60K, optimal < 30K            |
| Joints per FBX         | Max 50                            |
| Joint influences       | Max 4                             |
| Lights                 | Max 3                             |
| Text                   | Max 400 characters                |

Design decisions should target the "optimal" column whenever possible to
leave headroom for future additions and to ensure smooth performance on
lower-end devices.
