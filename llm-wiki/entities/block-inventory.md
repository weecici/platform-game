---
tags: [entity, inventory, UI]
source_files: ["src/systems/block-system.ts"]
last_updated: 2026-04-29
---

# Block Inventory

Tracks how many geometry blocks the player has collected. The player starts with 0 blocks.

## The Catalogue

A static `BLOCK_CATALOGUE` maps six primitives (`box`, `sphere`, `cone`, `cylinder`, `wheel`, `teapot`) to distinct icons and physical properties (friction, restitution).

## Hotbar & Selection

The `Game Orchestrator` assigns keys `1` through `6` to trigger `activateHotbarSlot(key)`. This pulls the corresponding `BlockType` and passes it to the [Primitive Placement](./primitive-placement.md) system.

- The player must have `remaining(blockType) > 0` for the system to execute a placement.
- When `add()` is triggered by the [Level Manager](./level-manager.md) during a pickup, the GUI HUD is dynamically updated with a +1 floating notification.
