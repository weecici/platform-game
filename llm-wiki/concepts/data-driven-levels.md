---
tags: [concept, levels, config]
source_files: ["src/levels/level-data.ts"]
last_updated: 2026-05-20
---

# Data-Driven Levels

The game has no visual map editor. Instead, the [Level Manager](../entities/level-manager.md) parses massive JSON/object arrays located in `level-data.ts`.

## Structure

A `LevelConfig` (e.g. `LEVEL_PARKOUR_CITY`) is composed of:

1. **Platforms:** Defines solid (`solid: true`) rectangular prisms (`[sx, sy, sz]`). Allows mapping physical string identifiers to PBR textures (e.g., `concrete-moss`, `metal-plate`) which are parsed by the [Asset Pipeline](../infrastructure/asset-pipeline.md). It also supports kinematic behaviors like `type: "moving"` or `type: "rotating"` along a designated axis. Extremely massive platforms (like the 10,000 unit ground plane) must flag `noCull: true` to prevent the engine from optimizing away their physics body when the player moves away from the origin.
2. **Decorations:** Defines decorative or functional primitives/models placed freely in space.
   - **Set-Pieces:** The `modelPath` property is heavily utilized to load external `.usdz` assets (such as barns, animals, mountains, planes, and floating islands) to create expansive background environments and map borders around the core parkour track.
   - **Motion:** Decorations can use `animate.rotate` (per-axis angular speeds) and `animate.move` (per-axis ranges) with `animate.moveSpeed` as a global speed. The Level Manager applies the same animation model to both primitive decorations and loaded models.
   - **Pickups:** If a decoration config maps a `collectible: "cylinder"`, it acts as a floating, spinning pickup that grants the player a [Block Inventory](../entities/block-inventory.md) item.
