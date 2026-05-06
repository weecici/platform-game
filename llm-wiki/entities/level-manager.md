---
tags: [entity, levels, rendering]
source_files: ["src/levels/level-manager.ts"]
last_updated: 2026-04-29
---

# Level Manager

The `LevelManager` parses [Data-Driven Levels](../concepts/data-driven-levels.md) and converts them into runtime objects in the Three.js and Cannon-es worlds.

## Platform Runtimes

For every platform in the config, it creates a `PlatformRuntime` containing a Three.js Mesh and optionally a Cannon.js Body (if `solid: true`).

- **Kinematic Updates:** If a platform is `moving` or `rotating`, the `LevelManager` manually interpolates its position/quaternion during the `update(dt)` loop and applies the calculated velocity to the `CANNON.Body` so the player accurately moves with the platform.

## Decoration Runtimes

Decorations serve two purposes: aesthetics (e.g., Apple `.usdz` clouds or trees) and pickups.

- **Collectibles:** If a decoration config has a `collectible` string, it represents a block type. The orchestrator calls `checkCollectibles(playerPos)`. If the player is within `PICKUP_RADIUS` (2.0), the decoration plays a fast shrink/float animation and removes itself from the scene. The orchestrator then delegates the granted block to the [Block Inventory](./block-inventory.md).
- **Physical Models:** Decorations with `solid: true` generate [Exact Mesh Collision](../concepts/mesh-collision.md) bodies automatically when loaded, enabling precise interaction between the player and complex 3D meshes.
