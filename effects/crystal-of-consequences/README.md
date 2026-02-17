# Crystal of Consequences — Effect Documentation

An interactive AR effect for TikTok Effect House. A procedural crystal
levitates on screen while a philosophical dilemma is displayed. The user
swipes through the air with their tracked hand to choose between Purity
and Corruption. The crystal transforms in real time, reflecting the
decision through its material properties.

Four scripts work together: **CrystalController** reads the hand position
and drives the shader, **DilemmaManager** displays philosophical dilemmas,
**DecisionJuiceController** adds VFX punch on lock, and
**CrystalBreathingController** animates a subtle idle breathing.

---

## Architecture — Finite State Machine

```
User Interaction Flow:
═══════════════════════════════════════════════

 No hand          Hand appears       Hand moves
    │                  │                 │
    ▼                  ▼                 ▼
 ┌──────┐         ┌────────┐        ┌─────────┐
 │ IDLE │────────▶│TRACKING│───────▶│ LOCKING │
 │(0.5) │         │(lerp X)│        │(timer++) │
 └──────┘         └────────┘        └─────────┘
    ▲                  │                 │
    │      Hand lost   │     Hold > 0.5s │
    │      (> 2.0s)    │                 ▼
    │                  │            ┌────────┐
    └──────────────────┘            │ LOCKED │
                                   │(0 or 1)│
                                   └────────┘
                                        │
                                        ▼
                                   DecisionLocked
                                   event emitted
                                        │
                        ┌───────────────┤
                        ▼               ▼
                   JuiceController  DilemmaManager
                   (VFX/pulse)     (hide unchosen)
```

**Hand Detection States (Fix "Main Morte"):**

```
ACTIVE  → movementDelta > 0.001 → tracking normal
HOLDING → movementDelta < 0.001 for < 2.0s → crystal stays frozen
LOST    → movementDelta < 0.001 for > 2.0s → drift to neutral
```

---

## Data Flow Diagram

```
Hand Tracker Transform
        │
        ▼ getWorldPosition()
   World Position (Vector3f)
        │
        ▼ worldToViewportPoint()
   Viewport X (0.0 → 1.0)
        │
        ▼ Frame-rate independent lerp
   Smoothed X
        │
        ├──▶ material.setFloat('CorruptionLevel', x)
        │         │
        │         ▼
        │    Procedural Shader
        │    (Fresnel ↔ Voronoi)
        │
        └──▶ Lock evaluation
              (< 0.15 for 0.5s → purity)
              (> 0.85 for 0.5s → corruption)
```

---

## File Descriptions

| File | Size | Role |
|------|------|------|
| `CrystalController.ts` | ~6 KB | Main brain: hand tracking → shader bridge. 3-state detection (ACTIVE/HOLDING/LOST). Emits DecisionLocked + CrystalStateChanged. |
| `DilemmaManager.ts` | ~5 KB | 20 philosophical dilemmas. Anti-repeat history (last 5). Listens for DecisionLocked to hide unchosen text. |
| `DecisionJuiceController.ts` | ~3 KB | VFX on lock: purity = scale pulse, corruption = position shake. Emits JuiceComplete. |
| `CrystalBreathingController.ts` | ~2 KB | Subtle ±2% scale oscillation when crystal is idle (no hand). Stops on decision. |
| `SHADER_NOTES.md` | ~3 KB | Full shader specification: Fresnel/GrabPass at 0.0, Voronoi/Emission at 1.0, node graph. |

---

## API Traceability

| Method | Source | Used In |
|--------|--------|---------|
| `getSceneObject()` | SceneObject | All scripts |
| `scene.findSceneObject()` | SceneObject (Search) | All scripts |
| `getTransform()` | Transform | CrystalController, Juice, Breathing |
| `getWorldPosition()` | Transform (World) | CrystalController |
| `worldToViewportPoint()` | Camera (Conversions) | CrystalController |
| `getComponent('MeshRenderer')` | SceneObject (Components) | CrystalController |
| `mainMaterial` | Material (Access) | CrystalController |
| `setFloat()` | Material (Setters) | CrystalController |
| `t.localScale` | Transform (Local) | Juice, Breathing |
| `t.localPosition` | Transform (Local) | Juice |
| `distanceTo()` | Vector3f (Math) | CrystalController |
| `defineUserEventType()` | EventManager | All scripts |
| `getGlobalEmitter()` | EventManager | All scripts |
| `on()` / `emit()` | EventManager | All scripts |
| `createEvent()` / `args.push()` | EventManager | CrystalController, Juice |
| `obj.enabled` | SceneObject | DilemmaManager |
| `Math.sin()`, `Math.pow()`, `Math.PI` | JavaScript native | All scripts |

---

## Known Limitations

- **Hand detection by velocity.** Effect House does not expose an
  `isTracking()` or `isDetected()` method in the TypeScript API for the
  Hand Tracker. Detection is inferred by measuring the distance between
  consecutive world positions.
- **Immobile hand tolerance.** An immobile hand is treated as "present"
  for up to 2 seconds (HOLDING state), then as "lost" (LOST state).
- **Text API.** The 2D Text component API is not fully documented for
  scripting. Dilemma text is displayed by setting the `name` property of
  the SceneObject as a workaround until the API is verified.
- **Gesture Detection** is only available in Visual Scripting, not
  TypeScript.
- **Max testable FPS** is 30 (Effect House limitation).

---

## Events Reference

| Event Name | Emitted By | Listened By | Args |
|------------|-----------|-------------|------|
| `DecisionLocked` | CrystalController | DilemmaManager, DecisionJuiceController | `[0]: string ('purity'\|'corruption')`, `[1]: number (0.0\|1.0)` |
| `CrystalStateChanged` | CrystalController | CrystalBreathingController, DilemmaManager | `[0]: string ('ACTIVE'\|'HOLDING'\|'LOST')`, `[1]: number (current smoothedX)` |
| `JuiceComplete` | DecisionJuiceController | (available for future use) | `[0]: string ('purity'\|'corruption')` |

---

## Quick Setup

1. Open Effect House and create a new project.
2. Add a Hand Tracker: `Hierarchy > Add [+] > AR Tracking > Hand Tracker`.
3. Add an Icosahedron (or import a mesh) and rename it to `Crystal`.
   Assign the procedural material with the `CorruptionLevel` uniform.
4. Create four Empty Objects. Attach one script to each:
   `CrystalController.ts`, `DilemmaManager.ts`,
   `DecisionJuiceController.ts`, `CrystalBreathingController.ts`.
5. Add two 2D Text objects named `TextPurity` and `TextCorruption`.
   Preview the effect and move your hand left or right to see the crystal
   transform.

For the full step-by-step guide, see
[`docs/EFFECT_HOUSE_SETUP.md`](../../docs/EFFECT_HOUSE_SETUP.md).
