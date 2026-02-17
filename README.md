# 🔮 Crystal of Consequences

**A TikTok Effect House AR filter — where your decisions shape reality.**

> *"Every choice transforms the crystal. Purity or Corruption — the matter responds to your hand."*

---

## 🎯 Concept

An interactive AR experience for TikTok where a **procedural crystal** levitates on screen. A philosophical dilemma appears. The user **swipes through the air with their hand** (Minority Report-style spatial interaction) to choose. The crystal **transforms in real-time**:

- **Swipe Left → Purity** — Crystal-clear diamond with rainbow refractions
- **Swipe Right → Corruption** — Dark obsidian with glowing lava veins
- **Hold for 0.5s → Decision Locked** — VFX/SFX confirmation burst

The transition is **analog, not binary** — the crystal morphs proportionally to the hand position, creating a deeply satisfying tactile-visual feedback loop.

---

## 🧠 Philosophy: "Tropical Geometry" Optimization

Inspired by tropical geometry (where products become sums, sums become max/min), we replace **heavy visual assets** with **mathematical elegance**:

| Traditional Approach | Our Approach | Weight |
|---------------------|-------------|--------|
| 4K texture files | Procedural shaders (Voronoi, Perlin, Fresnel) | 0 MB |
| High-poly mesh (2M triangles) | Icosahedron (20 faces) + Normal Map | ~5 KB |
| Pre-rendered animations | Real-time math (sin, lerp, noise) | ~2 KB |
| Multiple LOD models | Single mesh, shader-driven detail | ~5 KB |

**Target package size: < 500 KB** (TikTok limit: 8 MB)

---

## 🏗️ Project Structure

```
house_effect/
├── README.md                                          # This file
├── effects/
│   └── crystal-of-consequences/
│       ├── scripts/
│       │   ├── CrystalController.ts                   # Main controller (Hand → Shader bridge)
│       │   └── DilemmaManager.ts                      # Dilemma text system + event listener
│       └── shaders/
│           └── SHADER_NOTES.md                        # Procedural shader creative direction
├── docs/
│   ├── API_REFERENCE.md                               # Verified Effect House API bible (18 sections)
│   ├── EFFECT_HOUSE_SETUP.md                          # Step-by-step setup checklist
│   └── OPTIMIZATION_GUIDE.md                          # "Tropical Geometry" optimization techniques
├── prompts/
│   └── opus-crystal-controller-v2.md                  # AI prompt template for code delegation
├── .gitignore
└── LICENSE
```

---

## ⚡ Tech Stack

- **Platform:** TikTok Effect House (v3.0+)
- **Language:** TypeScript (APJS API — strict mode)
- **Shader:** Procedural (Material Editor — zero texture files)
- **Interaction:** Hand Tracking → Spatial Swipe
- **Architecture:** ECS pattern, FSM (IDLE → TRACKING → LOCKING → LOCKED)

---

## 🔧 Quick Setup

1. Download [Effect House](https://effecthouse.tiktok.com)
2. Create a new project
3. Add **Hand Tracker**: `Hierarchy → Add [+] → AR Tracking → Hand Tracker`
4. Add **3D Object** (Icosahedron or custom mesh) — rename to `Crystal`
5. Create procedural material, expose `CorruptionLevel` float uniform
6. Attach `CrystalController.ts` to an Empty Object
7. Attach `DilemmaManager.ts` to another Empty Object
8. Test with your hand in front of the camera 🖐️

See [`docs/EFFECT_HOUSE_SETUP.md`](docs/EFFECT_HOUSE_SETUP.md) for the full guide.

---

## 📊 API Traceability

Every API call in the codebase is **verified against official Effect House documentation**. Zero invented functions. See [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) for the complete reference.

---

## 🎨 Creative Direction

| State | Visual | Technique |
|-------|--------|-----------|
| **Purity (0.0)** | Diamond, rainbow refractions, crystal-clear | Fresnel + Refraction + Chromatic Dispersion |
| **Neutral (0.5)** | Hesitation — subtle breathing pulse | `sin(time)` modulation |
| **Corruption (1.0)** | Obsidian, lava veins, micro-fractures | Voronoi Noise + Emission + Time offset |

See [`effects/.../shaders/SHADER_NOTES.md`](effects/crystal-of-consequences/shaders/SHADER_NOTES.md) for full shader specs.

---

## 📄 License

MIT © 2026 stone42-upload

---

*Built with 🧠 strategy, 🎨 poetry, and ⚡ zero wasted bytes.*