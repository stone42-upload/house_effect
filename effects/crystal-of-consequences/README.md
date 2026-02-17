# Crystal of Consequences

An interactive AR effect for TikTok Effect House. A procedural crystal
levitates on screen while a philosophical dilemma is displayed. The user
swipes through the air with their tracked hand to choose between Purity
and Corruption. The crystal transforms in real time, reflecting the
decision through its material properties.

---

## Architecture

The effect follows a finite-state machine (FSM) with four states:

```
IDLE --> TRACKING --> LOCKING --> LOCKED
```

| State    | Description                                                   |
| -------- | ------------------------------------------------------------- |
| IDLE     | No hand detected. Crystal holds the neutral value (0.5).      |
| TRACKING | Hand detected. Smoothed X position drives CorruptionLevel.    |
| LOCKING  | Hand held past threshold for the required duration.           |
| LOCKED   | Decision confirmed. Event emitted, interaction disabled.      |

## Data Flow

```
Hand Tracker Transform
        |
        v
getWorldPosition()
        |
        v
worldToViewportPoint()
        |
        v
Lerp Smooth (frame-rate independent)
        |
        v
setFloat('CorruptionLevel')
        |
        v
Procedural Shader
```

## Files

| File                  | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `scripts/CrystalController.ts` | Main controller. Reads hand position, drives the shader uniform, and emits decision events. |
| `scripts/DilemmaManager.ts`    | Manages the bank of philosophical dilemmas. Listens for `DecisionLocked` events and updates UI text. |
| `shaders/SHADER_NOTES.md`      | Creative direction and node graph specification for the procedural material. |

## API Traceability

| Method / Property               | Source Section                |
| -------------------------------- | ---------------------------- |
| `getSceneObject()`              | SceneObject                  |
| `scene.findSceneObject(name)`   | SceneObject (Search)         |
| `getTransform()`                | Transform                    |
| `getWorldPosition()`            | Transform (World Space)      |
| `worldToViewportPoint(pos)`     | Camera (Conversions)         |
| `getComponent('MeshRenderer')`  | SceneObject (Components)     |
| `renderer.mainMaterial`         | Material (Access)            |
| `mat.setFloat(name, value)`     | Material (Uniform Setters)   |
| `Vector3f`, `distanceTo()`      | Math (Vector3f)              |
| `EventManager.defineUserEventType()` | EventManager            |
| `EventManager.getGlobalEmitter()`    | EventManager            |
| `EventManager.createEvent()`         | EventManager            |
| `emitter.emit(event)`               | EventManager            |
| `emitter.on(type, cb, ctx)`         | EventManager            |

## Known Limitations

- **Hand detection by velocity.** Effect House does not expose an
  `isTracking()` or `isDetected()` method in the TypeScript API for the
  Hand Tracker. Detection is inferred by measuring the distance between
  consecutive world positions. If the hand transform stops moving, the
  system assumes no hand is present and returns to the neutral value.

- **Text API.** The 2D Text component API is not fully documented for
  scripting. Dilemma text is displayed by setting the `name` property of
  the SceneObject as a workaround until the API is verified.

## Quick Setup

1. Open Effect House and create a new project.
2. Add a Hand Tracker: `Hierarchy > Add [+] > AR Tracking > Hand Tracker`.
3. Add an Icosahedron (or import a mesh) and rename it to `Crystal`.
   Assign the procedural material with the `CorruptionLevel` uniform.
4. Create two Empty Objects. Attach `CrystalController.ts` to the first
   and `DilemmaManager.ts` to the second.
5. Add two 2D Text objects named `TextPurity` and `TextCorruption`.
   Preview the effect and move your hand left or right to see the crystal
   transform.

For the full step-by-step guide, see
[`docs/EFFECT_HOUSE_SETUP.md`](../../docs/EFFECT_HOUSE_SETUP.md).
