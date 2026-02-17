# TikTok Effect House API Reference — Compiled February 2026

Comprehensive reference for the APJS scripting API available in TikTok
Effect House v3.0 and later. Every method listed here has been verified
against the official documentation.

---

## Section 1 — Component System

All scripts must extend `APJS.BasicScriptComponent` and use the
`@component()` decorator. Each `.ts` file defines exactly one component.
Do not use `require()` or dynamic imports.

```typescript
@component()
export class MonScript extends APJS.BasicScriptComponent {
  onStart(): void { }
  onUpdate(deltaTime: number): void { }
}
```

**Rules:**

- One component per `.ts` file.
- Component names must be unique across the project.
- No `require()` or `import` statements for APJS types; they are
  available globally.
- The class must extend `APJS.BasicScriptComponent`.

---

## Section 2 — Port UI (Properties)

Properties exposed in the Inspector panel are declared with the `@port`
decorator. The mapping between TypeScript types and Effect House UI
widgets is:

| TypeScript Type       | Effect House Type |
| --------------------- | ----------------- |
| `boolean`             | bool              |
| `number`              | float / double / int |
| `string`              | string            |
| `APJS.SceneObject`    | SceneObject       |
| `APJS.Transform`      | Transform         |
| `APJS.Vector2f`       | Vector2f          |
| `APJS.Vector3f`       | Vector3f          |
| `APJS.Vector4f`       | Vector4f          |
| `APJS.Color`          | Color             |
| `APJS.Texture`        | Texture           |
| `APJS.Prefab`         | Prefab            |

---

## Section 3 — SceneObject and Hierarchy

```typescript
const self = this.getSceneObject();
const scene = self.scene;
const obj = scene.findSceneObject('MonObjet');
const child = self.getChild('NomEnfant');
self.enabled = false;
const comp = self.getComponent('MeshRenderer') as APJS.MeshRenderer;
```

- `getSceneObject()` returns the `SceneObject` the script is attached to.
- `scene` gives access to the root scene for global searches.
- `findSceneObject(name)` performs a recursive search by name.
- `getChild(name)` returns a direct child by name.
- `enabled` toggles visibility and processing.
- `getComponent(type)` retrieves a component by its type name string.

---

## Section 4 — Transform

```typescript
const t = obj.getTransform();
t.localPosition = new APJS.Vector3f(x, y, z);
t.localScale = new APJS.Vector3f(sx, sy, sz);
t.localRotation = APJS.Quaternionf.makeFromAngleAxis(angle, new APJS.Vector3f(0, 1, 0));
t.getWorldPosition(); // Vector3f
t.setWorldPosition(new APJS.Vector3f(x, y, z));
t.getWorldRotation(); // Quaternionf
t.getWorldScale(); // Vector3f
t.getWorldMatrix(); // Matrix4x4f
```

- Local properties (`localPosition`, `localScale`, `localRotation`) are
  relative to the parent transform.
- World methods provide values in the global coordinate system.

---

## Section 5 — Camera

```typescript
const cam = obj.getComponent('Camera') as APJS.Camera;
cam.fov = 60;
cam.near = 0.1;
cam.far = 100;
cam.worldToViewportPoint(worldPos); // Vector3f (0 to 1)
cam.worldToScreenPoint(worldPos); // Vector3f (pixels)
cam.viewportToWorldPoint(vpPos); // Vector3f
cam.screenToWorldPoint(screenPos, depth); // Vector3f
cam.viewportPointToRay(vpPos); // Ray
cam.projectionMatrix; // Matrix4x4f
cam.getCameraToWorldMatrix(); // Matrix4x4f
cam.getWorldToCameraMatrix(); // Matrix4x4f
```

- Viewport coordinates range from 0.0 to 1.0.
- Screen coordinates are in pixels.
- Conversion methods are essential for mapping tracked points (e.g., hand
  position) into normalized UI space.

---

## Section 6 — Material and Uniforms

```typescript
const renderer = obj.getComponent('MeshRenderer') as APJS.MeshRenderer;
const mat = renderer.mainMaterial;
mat.setFloat('_Uniform', 0.5);
mat.setVector('_Vec', new APJS.Vector2f(1, 1));
mat.setColor('_Color', new APJS.Color(1, 0, 0, 1));
mat.setMatrix('_Mat', new APJS.Matrix4x4f());
mat.setTexture('_Tex', tex);
mat.getFloat('_Uniform'); // number | undefined
mat.clone();
```

Uniform names correspond to parameters exposed via "Pin to Graph" in the
Material Editor.

---

## Section 7 — Pass (Render Configuration)

```typescript
const pass = mat.mainPass;
pass.depthTest = true;
pass.depthWrite = true;
pass.cullMode = APJS.CullMode.Back;
pass.colorMask = APJS.ColorMask.R | APJS.ColorMask.G | APJS.ColorMask.B | APJS.ColorMask.A;
pass.stencilState.enable = true;
```

The `Pass` object controls low-level render state for a material,
including depth testing, face culling, color write masks, and stencil
operations.

---

## Section 8 — EventManager

```typescript
const MY_EVENT = APJS.EventManager.defineUserEventType('MonEvent');
const emitter = APJS.EventManager.getGlobalEmitter();
emitter.on(MY_EVENT, callback, context);
emitter.once(MY_EVENT, callback, context);
const evt = APJS.EventManager.createEvent(MY_EVENT);
evt.args.push('data');
emitter.emit(evt);
emitter.off(MY_EVENT, callback, context);
```

- `defineUserEventType(name)` registers a custom event and returns an
  integer identifier.
- `getGlobalEmitter()` returns the singleton emitter shared across all
  scripts.
- `createEvent(type)` creates an event object whose `args` array can
  carry arbitrary data.
- `on`, `once`, `off` manage listeners. Always pass `this` as context
  when registering from a component.

---

## Section 9 — TouchData

```typescript
APJS.EventManager.getGlobalEmitter().on(APJS.EventType.Touch, (event) => {
  const touch = event.args[0] as APJS.TouchData;
  touch.phase; // Began | Moved | Ended | Canceled
  touch.position; // Vector2f
  touch.force; // number
  touch.touchId; // number
});
```

Touch events are delivered through the global emitter with event type
`APJS.EventType.Touch`. Each event carries a `TouchData` payload with
phase, position, force, and an identifier for multi-touch tracking.

---

## Section 10 — Math Types

### Vector2f

Constructor: `new APJS.Vector2f(x, y)`

Properties: `x`, `y`.

Methods: `set(x, y)`, `magnitude()`, `normalize()`, `clone()`,
`add(v)`, `subtract(v)`, `multiply(v)`, `divide(v)`,
`multiplyScalar(s)`, `dot(v)`, `distanceTo(v)`.

Static: `Vector2f.lerp(a, b, t)`, `Vector2f.max(a, b)`,
`Vector2f.min(a, b)`.

### Vector3f

Constructor: `new APJS.Vector3f(x, y, z)`

Properties: `x`, `y`, `z`.

Methods: `set(x, y, z)`, `magnitude()`, `normalize()`, `clone()`,
`add(v)`, `subtract(v)`, `multiply(v)`, `divide(v)`,
`multiplyScalar(s)`, `dot(v)`, `cross(v)`, `distanceTo(v)`.

Static: `Vector3f.lerp(a, b, t)`, `Vector3f.max(a, b)`,
`Vector3f.min(a, b)`.

### Vector4f

Constructor: `new APJS.Vector4f(x, y, z, w)`

Properties: `x`, `y`, `z`, `w`.

Methods: `set(x, y, z, w)`, `magnitude()`, `normalize()`, `clone()`,
`add(v)`, `subtract(v)`, `multiply(v)`, `divide(v)`,
`multiplyScalar(s)`, `dot(v)`, `distanceTo(v)`.

Static: `Vector4f.lerp(a, b, t)`, `Vector4f.max(a, b)`,
`Vector4f.min(a, b)`.

### Quaternionf

Methods: `multiply(q)`, `inverse()`, `normalize()`, `toEulerAngles()`.

Static: `Quaternionf.makeFromAngleAxis(angle, axis)`,
`Quaternionf.makeFromEulerAngles(x, y, z)`,
`Quaternionf.slerp(a, b, t)`, `Quaternionf.identity()`,
`Quaternionf.lookAtRotate(forward, up)`.

### Color

Constructor: `new APJS.Color(r, g, b, a)`

Properties: `r`, `g`, `b`, `a`.

Methods: `equals(c)`, `clone()`.

### Ray

Properties: `origin` (Vector3f), `direction` (Vector3f).

### AABB

Properties: `min` (Vector3f), `max` (Vector3f).

Methods: `intersects(other)`.

### Rect

Constructor: `new APJS.Rect(x, y, w, h)`

Properties: `x`, `y`, `w`, `h`.

### Matrix3x3f and Matrix4x4f

Methods: `set(row, col, value)`, `get(row, col)`, `multiply(m)`,
`inverse()`, `transpose()`.

Matrix4x4f additional methods: `multiplyPoint(v)`, `compose(pos, rot, scale)`,
`getDecompose()`.

Static (Matrix4x4f): `Matrix4x4f.perspective(fov, aspect, near, far)`,
`Matrix4x4f.orthographic(left, right, bottom, top, near, far)`,
`Matrix4x4f.lookAt(eye, target, up)`.

---

## Section 11 — Mesh, Renderer, Prefab, Texture, Image, ScreenTransform

### MeshRenderer

Properties: `mainMaterial` (Material), `mesh` (Mesh), `enabled` (boolean).

### Mesh

Properties: `vertexCount`, `triangleCount`.

### Prefab

Used with `@port` to reference prefab assets in the Inspector.

### Texture

Properties: `width`, `height`.

### Image

Attached to 2D objects.

Properties: `texture` (Texture), `color` (Color), `enabled` (boolean).

### ScreenTransform

Used for 2D UI elements.

Properties: `anchors` (Rect), `offsets` (Rect), `pivot` (Vector2f),
`rotation` (number), `scale` (Vector2f).

---

## Section 12 — AlgorithmManager (Face Tracking)

```typescript
const result = APJS.AlgorithmManager.getResult();
result.getFaceCount();
result.getFaceBaseInfo(index); // landmarks
result.getFaceAttributeInfo(index); // age, gender, expression
```

- `getResult()` returns the current frame's algorithm output.
- `getFaceCount()` returns the number of detected faces.
- `getFaceBaseInfo(index)` returns landmark data for the face at the
  given index.
- `getFaceAttributeInfo(index)` returns attribute estimates (age, gender,
  expression) for the face at the given index.

---

## Section 13 — Physics 3D and 2D

### Gravity

Scene-level gravity vector. Default is `(0, -9.81, 0)`.

### RigidBody

Properties: `mass`, `drag`, `angularDrag`, `useGravity`,
`isKinematic`, `velocity` (Vector3f), `angularVelocity` (Vector3f).

Methods: `addForce(force)`, `addTorque(torque)`.

### Colliders

Types: `BoxCollider`, `SphereCollider`, `CapsuleCollider`,
`MeshCollider`.

Common properties: `isTrigger`, `center` (Vector3f).

BoxCollider: `size` (Vector3f).
SphereCollider: `radius` (number).
CapsuleCollider: `radius` (number), `height` (number),
`direction` (number).

### Joints

Types: `FixedJoint`, `HingeJoint`, `SpringJoint`.

Common properties: `connectedBody`, `breakForce`, `breakTorque`.

### DynamicChain

Properties: `stiffness`, `damping`, `gravity`.

---

## Section 14 — Animation

```typescript
const animator = obj.getComponent('Animator') as APJS.Animator;
animator.play('nom', APJS.AnimationWrapMode.Repeat, 1.0, 0.3);
animator.pauseAll();
animator.resumeAll();
animator.stopAll();
```

- `play(name, wrapMode, speed, blendTime)` starts an animation clip.
- `AnimationWrapMode` values: `Once`, `Loop`, `Repeat`, `PingPong`,
  `ClampForever`.
- `pauseAll()`, `resumeAll()`, `stopAll()` control all active
  animations on the object.

---

## Section 15 — DeviceInfo

```typescript
APJS.DeviceInfo.getOS(); // Android | iOS | Windows | MacOS | Linux | HarmonyOS
APJS.DeviceInfo.getCameraFacingType();
```

- `getOS()` returns the operating system name as a string.
- `getCameraFacingType()` returns whether the front or back camera is
  active.

---

## Section 16 — Technical Constraints

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

---

## Section 17 — Access Assets by Coding (Workaround)

Scripts do not support automatic asset reflection. Use intermediate
components attached to scene objects as bridges to access assets at
runtime.

```typescript
// Retrieve a material from a MeshRenderer
const mr = scene.findSceneObject('Cube')?.getComponent('MeshRenderer') as APJS.MeshRenderer;
const mat = mr.mainMaterial;
const mesh = mr.mesh;

// Retrieve a texture from an Image component
const img = scene.findSceneObject('Image')?.getComponent('Image') as APJS.Image;
const tex = img.texture;
```

---

## Section 18 — Hand Tracker

The Hand Tracker is added via `Hierarchy > Add [+] > AR Tracking >
Hand Tracker`. It provides a `Transform` component that follows the
detected hand in real time.

```typescript
const hand = scene.findSceneObject('Hand Tracker');
const worldPos = hand?.getTransform().getWorldPosition();
const vpPos = camera.worldToViewportPoint(worldPos);
const normalizedX = vpPos.x; // 0.0 (left) to 1.0 (right)
```

**Limitations (no TypeScript API available):**

- Individual landmarks (fingers, palm) are not accessible.
- `isTracking()` / `isDetected()` do not exist.
- Gesture Detection is available only through Visual Scripting.

**Workaround:** detect "no hand" by measuring the transform's positional
velocity across frames. When the distance between consecutive world
positions falls below a threshold, assume the hand is absent.
