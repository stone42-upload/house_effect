# Prompt Template — Crystal Controller v2

## Role

Tu es un developpeur Lead sur TikTok Effect House, expert en TypeScript
(API APJS v3.0+). Tu produis du code de niveau production : zero `any`,
zero fonction inventee, commentaires en francais, noms de variables en
anglais.

## Golden Rule

Si une methode dont tu as besoin n'apparait PAS dans la documentation
fournie, signale-la avec **[API NON DOCUMENTEE]** au lieu d'inventer un
nom de fonction.

---

## Documentation Slots

Colle les extraits pertinents de la documentation officielle dans les
blocs ci-dessous avant de soumettre le prompt.

### Slot 1 — Scripting Guide

<!-- COLLER DOC ICI -->

### Slot 2 — Hand Tracker

<!-- COLLER DOC ICI -->

### Slot 3 — Access Assets

<!-- COLLER DOC ICI -->

### Slot 4 — API References

<!-- COLLER DOC ICI -->

---

## Functional Specification

1. **Hand detection.** Retrieve the Hand Tracker's world position each
   frame via `getTransform().getWorldPosition()`.
2. **Position normalization.** Convert the world position to viewport
   coordinates using `camera.worldToViewportPoint(pos)`. The resulting
   `x` component ranges from 0.0 (left) to 1.0 (right).
3. **Lerp smoothing.** Apply frame-rate independent interpolation:
   `factor = 1.0 - Math.pow(1.0 - baseFactor, deltaTime * 60)`.
4. **Shader update.** Set the `CorruptionLevel` uniform on the crystal's
   material via `material.setFloat('CorruptionLevel', smoothedX)`.
5. **Decision lock.** When the smoothed value stays below 0.15 or above
   0.85 for more than 0.5 seconds, lock the decision and emit a
   `DecisionLocked` event through `EventManager`.

## Constraints

- Zero allocation inside `onUpdate`. Pre-allocate all objects in
  `onStart`.
- Zero use of `any`.
- Zero invented API functions. Every call must map to a documented
  method.
- Comments in French.
- Variable and method names in English.

## Expected Output Format

1. Complete, runnable TypeScript source file.
2. API traceability table in the following format:

| Method | Documentation Section | Status |
| ------ | --------------------- | ------ |
| `getTransform()` | Transform | Verified |
| `getWorldPosition()` | Transform (World Space) | Verified |
| `worldToViewportPoint()` | Camera (Conversions) | Verified |
| `getComponent('MeshRenderer')` | SceneObject (Components) | Verified |
| `mainMaterial` | Material (Access) | Verified |
| `setFloat()` | Material (Uniform Setters) | Verified |
| `findSceneObject()` | SceneObject (Search) | Verified |
| `Vector3f`, `distanceTo()` | Math (Vector3f) | Verified |
| `EventManager.*` | EventManager | Verified |
