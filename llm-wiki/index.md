# LLM Wiki Index

Catalog of all knowledge pages in the `llm-wiki/`.

## Entities

- [Game Orchestrator](./entities/game-orchestrator.md) - The main game loop, state machine, and character selection preview (`src/main.ts`).
- [Player Controller](./entities/player.md) - Player character physics, momentum, coyote time, and death mechanics.
- [Level Manager](./entities/level-manager.md) - Loads and updates data-driven level platforms and decorations.
- [Primitive Placement](./entities/primitive-placement.md) - Logic for ghost preview, block instantiation, and debug UI affine transforms.
- [Block Inventory](./entities/block-inventory.md) - Tracking player collected blocks and hotbar selection.

## Concepts

- [Momentum Physics](./concepts/momentum-physics.md) - Percentage-based friction and acceleration system for tight controls.
- [Data-Driven Levels](./concepts/data-driven-levels.md) - Structure of `LEVEL_PARKOUR_CITY` and platform definitions.

## Infrastructure

- [Rendering & Lighting](./infrastructure/rendering-and-lighting.md) - WebGL setup, hemisphere/directional lights, and dynamic sun positioning.
- [Asset Pipeline](./infrastructure/asset-pipeline.md) - Model loading (GLTF/USDZ), ShapeFactory, and TextureManager for procedural/PBR textures.
