# Effect House Setup Guide

Step-by-step instructions for setting up the Crystal of Consequences
effect in TikTok Effect House.

---

## Prerequisites

- TikTok Effect House v3.0 or later.
  Download from <https://effecthouse.tiktok.com>.

---

## Steps

### 1. Create a New Project

Open Effect House and select **New Effect**. Choose a blank template.

### 2. Add the Hand Tracker

Navigate to `Hierarchy > Add [+] > AR Tracking > Hand Tracker`.

This creates a scene object named **Hand Tracker** with a Transform
component that follows the detected hand in real time.

### 3. Add the Crystal Object

Navigate to `Hierarchy > Add [+] > 3D Basic` and choose an Icosahedron
(or import a custom `.fbx` mesh). Rename the object to **Crystal**.

### 4. Create the Procedural Material

Open the **Material Editor**. Build the shader graph described in
[`SHADER_NOTES.md`](../effects/crystal-of-consequences/shaders/SHADER_NOTES.md).
Expose the `CorruptionLevel` float parameter via **Pin to Graph** so
that it can be set from a script.

### 5. Assign the Material

Select the **Crystal** object in the hierarchy. In the Inspector, locate
the **MeshRenderer** component and drag the procedural material onto it.

### 6. Create the Controller Host

Navigate to `Hierarchy > Add [+] > Empty Object`. Rename it to
**CrystalControllerHost**. In the Assets panel, import
`CrystalController.ts`. Drag the script onto the empty object.

### 7. Create the Dilemma Manager Host

Repeat the same process: create another Empty Object, rename it to
**DilemmaManagerHost**, import `DilemmaManager.ts`, and attach the
script.

### 8. Add UI Text Objects

Add two 2D Text objects to the scene:

- Name the first one **TextPurity** and position it on the left side of
  the screen.
- Name the second one **TextCorruption** and position it on the right
  side of the screen.

### 9. Verify the Camera

Ensure the main Camera object is named **Camera** (this is the default
name). The controller script looks it up by this name.

### 10. Test the Effect

Click **Preview** in Effect House. Hold your hand in front of the camera
and move it left or right. Observe the crystal transforming between its
Purity and Corruption states.

---

## Test Checklist

- [ ] Hand moves left: crystal becomes pure (transparent, diamond-like).
- [ ] Hand moves right: crystal corrupts (dark base, lava veins).
- [ ] No hand detected: crystal slowly returns to neutral (0.5).
- [ ] Hold left for more than 0.5 s: decision locks with event.
- [ ] Hold right for more than 0.5 s: decision locks with event.
- [ ] Dilemma text appears on screen.
- [ ] Non-selected text disappears after lock.
- [ ] Stable 30 FPS on test device.
