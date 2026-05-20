---
tags: [entity, levels, rendering]
source_files: ["src/levels/level-manager.ts"]
last_updated: 2026-05-20
---

# Level Manager

The `LevelManager` parses [Data-Driven Levels](../concepts/data-driven-levels.md) and converts them into runtime objects in the Three.js and Cannon-es worlds.

## Platform Runtimes

For every platform in the config, it creates a `PlatformRuntime` containing a Three.js Mesh and optionally a Cannon.js Body (if `solid: true`).

- **Kinematic Updates:** If a platform is `moving` or `rotating`, the `LevelManager` manually interpolates its position/quaternion during the `update(dt)` loop and applies the calculated velocity to the `CANNON.Body` so the player accurately moves with the platform.

## Decoration Runtimes

Decorations serve two purposes: aesthetics (e.g., Apple `.usdz` clouds or trees) and pickups.

- **Chunk Streaming & Culling:** To maintain 60 FPS, the game uses aggressive spatial management:
  - **Lazy Loading:** `.usdz` models are only fetched and parsed when the player gets within `100` units.
  - **Physics/Render Culling:** If the player moves more than `75` units away from a platform or decoration, its mesh is hidden (`visible = false`) and its expensive `CANNON.Body` is physically ejected from the `CANNON.World` to drop CPU overhead to near-zero.
  - **Shadow Management:** Because distant models are culled from rendering entirely, nearby `.usdz` set-pieces (like trees and barns) are permitted to cast dynamic WebGL shadows for high visual fidelity without crippling the framerate. (However, logical exceptions like clouds and the sun still have shadows disabled).
- **Collectibles:** If a decoration config has a `collectible` string, it represents a block type. The orchestrator calls `checkCollectibles(playerPos)`. If the player is within `PICKUP_RADIUS` (2.0), the decoration plays a fast shrink/float animation and removes itself from the scene. The orchestrator then delegates the granted block to the [Block Inventory](./block-inventory.md).
- **Physical Models:** Decorations with `solid: true` generate [Exact Mesh Collision](../concepts/mesh-collision.md) bodies automatically when loaded, enabling precise interaction between the player and complex 3D meshes.
- **Animation:** `DecorationDef.animate` supports multi-axis motion via `rotate` and `move` objects. Use `animate.rotate` to specify per-axis angular speeds (radians/sec) and `animate.move` to specify per-axis sinusoidal ranges; `animate.moveSpeed` controls global movement speed. The older bob/orbit-specific fields are no longer used.
