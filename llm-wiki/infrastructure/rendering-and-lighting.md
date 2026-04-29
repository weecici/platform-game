---
tags: [infrastructure, core, engine]
source_files: ["src/core/engine.ts", "src/systems/lighting-system.ts"]
last_updated: 2026-04-29
---

# Rendering & Lighting

The game engine separates Three.js boilerplate (`Engine`) from logic.

## Engine Core

- Initializes WebGL rendering with `ACESFilmicToneMapping`, `SRGBColorSpace`, and `PCFSoftShadowMap`.
- Exposes `PerspectiveParams` enabling FOV manipulation on the fly.

## Lighting System

Maintains a combination of Ambient, Hemisphere, Directional, and Point lights.

- **Dynamic Sun:** The `DirectionalLight` (sun) acts as the primary shadow caster. Because rendering a massive shadow map covering an entire parkour level is too expensive, the orchestrator triggers `updateSunPosition(playerX, playerZ)` every frame. The shadow camera strictly follows the [Player Controller](../entities/player.md), giving crisp shadows only where it matters.

## Affine Transforms

An internal `AffineTransforms` module provides simple matrix operations to translate, rotate, and scale Three.js objects. It is heavily utilized by the interactive `DebugGUI` (Lil-gui) to allow the developer to tweak object offsets at runtime.
