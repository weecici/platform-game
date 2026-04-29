---
tags: [entity, mechanics, rendering]
source_files: ["src/systems/primitive-placement.ts"]
last_updated: 2026-04-29
---

# Primitive Placement

Handles the interactive geometry placement mechanics.

## The Ghost Preview

When the user selects a block from the [Block Inventory](./block-inventory.md), the system creates a semi-transparent `ghostObject`.

- It recalculates `aimDirection()` every frame based on the player's yaw/pitch to cast the ghost directly in front of the camera.
- The `ghostDistance` can be adjusted via the mouse scroll wheel.

## Placement & Affine Sync

On left click (`confirmPlace()`), it creates a real Three.js mesh and Cannon-es static Box body matching the ghost's coordinates.

- **Debug GUI Syncing:** The `PrimitivePlacementSystem` exposes `syncBodyToObject()`. If the user tweaks the position/scale of the block using the Lil-gui [Rendering & Lighting](../infrastructure/rendering-and-lighting.md) panel, this method dynamically recreates the immutable Cannon.js shape to match the new visual scale.
